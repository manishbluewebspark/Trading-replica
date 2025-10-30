import User from '../models/userModel.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { KiteConnect } from "kiteconnect";
import { sendResetMail } from '../utils/sendEmail.js';
import querystring from "querystring";
import dotenv from 'dotenv';
dotenv.config();
import { Op } from 'sequelize';
import { generateRandomNumbers } from "../utils/randomWords.js";
import axios from 'axios';
import { generateTOTP } from '../utils/generateTOTP.js';
import AngelOneCredentialer from '../models/angelOneCredential.js'


const GROWW_CLIENT_ID = process.env.GROWW_CLIENT_ID;
const GROWW_CLIENT_SECRET = process.env.GROWW_CLIENT_SECRET;
const GROWW_REDIRECT_URI = process.env.GROWW_REDIRECT_URI;
const FRONTEND_URL = process.env.FRONTEND_URL;


// ===================== auth controller start ================================


async function generateUniqueUsername() {
  let username;
  let isUnique = false;

  while (!isUnique) {
    username = await generateRandomNumbers(5); // e.g., "48371"

    const existingUser = await User.findOne({
      where: { username: username },
    });

    if (!existingUser) {
      isUnique = true; // ✅ unique username found
    }
  }

  return username;
}


export const register = async (req, res) => {

  const { firstName, lastName, email, password,mob, isChecked } = req.body;

  try {
    if (!isChecked) {

       return res.json({
            status: false,
            statusCode:400,
            message: "You must accept the Terms and Conditions",
            error: null,
        });
    }

     // ✅ Check mobile number length (must be exactly 10 digits)
      if (!mob || mob.length !== 10) {
        return res.json({
          status: false,
          statusCode: 400,
          message: "Mobile number must be exactly 10 digits",
          error: null,
        });
      }

      // ✅ Validate password strength
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{7,}$/;

  if (!passwordRegex.test(password)) {
    return res.json({
      status: false,
      statusCode: 400,
      message:
        "Password must be at least 7 characters long and contain uppercase, lowercase, number, and special character",
    });
  }

       const username = await generateUniqueUsername();
    
      const userExists = await User.findOne({
        where: {
          [Op.or]: [
            { email: email },
            { phoneNumber: mob },
            {username:username}
          ]
        }
      });


    
    if (userExists){

       return res.json({
            status: false,
            statusCode:400,
            message: "User already exists with mobile ,email",
            error: null,
        });

    } 

    const hashedPassword = await bcrypt.hash(password, 10);

     let saveUser = await User.create({
      firstName,
      lastName,
      username:username,
      email,
      phoneNumber:mob,
      password: hashedPassword,
      isChecked
    });
    
     const token = jwt.sign({ id: saveUser.id }, process.env.JWT_SECRET, { expiresIn: '1d' });
   
     return res.json({
            status: true,
            statusCode:400,
            saveUser,token,
            message: "User registered successfully",
            error: null,
        });
  } catch (error) {

    return res.json({
            status: false,
            statusCode:500,
            message: "Unexpected error occurred. Please try again.",
            data:null,
            error: error.message,
        });

  }
};


export const login = async (req, res) => {

  const { email, password } = req.body;

  try {

    // const user = await User.findOne({ where: { email } });

    const user = await User.findOne({
      where: {
        [Op.or]: [
          { email: email },      // assuming you store emails in lowercase
          { username: email },    // usernames are case-sensitive or as per your rules
        ],
      },
    });

    if (!user) {

      return res.json({
            status: false,
            statusCode:401,
            message: "User not found",
            error: null,
        });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch){

      return res.json({
            status: false,
            statusCode:401,
            message: "Invalid credentials",
            error: null,
        });

    } 

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1d' });

     return res.json({
            status: true,
            statusCode:400,
             token, user,
            message: "User registered successfully",
            error: null,
        });

  } catch (error) {

      return res.json({
            status: false,
            statusCode:500,
            message: "Unexpected error occurred. Please try again.",
            data:null,
            error: error.message,
        });
  }
};



// Step 1: Redirect to AngelOne login
export const loginWithAngelOne = async (req, res) => {

  const { ANGELONE_CLIENT_ID, ANGELONE_REDIRECT_URI } = process.env;

  const authUrl = `https://smartapi.angelbroking.com/publisher-login?api_key=${ANGELONE_CLIENT_ID}&redirect_uri=${encodeURIComponent(ANGELONE_REDIRECT_URI)}`;

  res.redirect(authUrl);

};



// Step 2: Get AngelOne Profile
export const loginWithTOTPInAngelOne = async function (req,res,next) {
    try {

    let existing = await AngelOneCredentialer.findOne({ where: { userId: req.userId } });

    if (!existing) {
      return res.json({
        status: false,
        statusCode: 404,
        message: "No credentials found for this user.",
        data: null,
      });
    }

   const createdData = existing.dataValues;

   let totpCode = await generateTOTP(createdData.totpSecret) 
     
      var data2 = JSON.stringify({
      "clientcode":createdData.clientId,
      "password":createdData.password,
      "totp":totpCode, 
    });

      var config = {
      method: 'post',
       url: 'https://apiconnect.angelone.in//rest/auth/angelbroking/user/v1/loginByPassword',

      headers : {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-UserType': 'USER',
        'X-SourceID': 'WEB',
        'X-ClientLocalIP': process.env.CLIENT_LOCAL_IP, 
            'X-ClientPublicIP': process.env.CLIENT_PUBLIC_IP, 
            'X-MACAddress': process.env.MAC_Address, 
            'X-PrivateKey': process.env.PRIVATE_KEY, 
      },
      data:data2
    };

    let {data} = await axios(config);

     if(data.status==true) {

      await User.update( {
        authToken: data.data.jwtToken,
        feedToken: data.data.feedToken,
        refreshToken: data.data.refreshToken,
      },
      {
        where: { id: req.userId },
        returning: true, // optional, to get the updated record
      }
    );

      return res.status(200).json({
              status: true,
              data: data.data
          });

     }else{

          return res.json({
              status: false,
              data:null,
              statusCode:data.errorCode,
              message:data.message
          });
     }

  } catch (error) {

    return res.json({
              status: false,
              data:null,
              statusCode:401,
              message:error.message
          });
  }
}

export const getAngelOneProfile = async function (req,res,next) {
    try {

      var config = {
      method: 'get',
      url: 'https://apiconnect.angelone.in/rest/secure/angelbroking/user/v1/getProfile',
      headers : {
         'Authorization': `Bearer ${req.headers.angelonetoken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-UserType': 'USER',
        'X-SourceID': 'WEB',
        'X-ClientLocalIP': process.env.CLIENT_LOCAL_IP, 
            'X-ClientPublicIP': process.env.CLIENT_PUBLIC_IP, 
            'X-MACAddress': process.env.MAC_Address, 
            'X-PrivateKey': process.env.PRIVATE_KEY, 
      }
    };

    let {data} = await axios(config);

     if(data.status==true) {

      return res.status(200).json({
              status: true,
              data: data.data
          });

     }else{

          return res.json({
              status: false,
              data:null,
              statusCode:data.errorCode,
              message:data.message
          });
     }

  } catch (error) {

    return res.json({
              status: false,
              data:null,
              statusCode:401,
              message:error.message
          });
  }
}

// Step 3: Get AngelOne Profile
export const logoutAngelOne = async function (req,res,next) {
    try {

      const obj = { clientcode:'M162423' };

      const jsonString = JSON.stringify(obj);

      var config = {
      method: 'post',
      url: 'https://apiconnect.angelone.in/rest/secure/angelbroking/user/v1/logout',

      headers : {
        'Authorization': `Bearer ${process.env.ANGELONE_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-UserType': 'USER',
        'X-SourceID': 'WEB',
            'X-ClientLocalIP': process.env.CLIENT_LOCAL_IP, 
            'X-ClientPublicIP': process.env.CLIENT_PUBLIC_IP, 
            'X-MACAddress': process.env.MAC_Address, 
            'X-PrivateKey': process.env.PRIVATE_KEY, 
      },
       data : jsonString
    };

    let response = await axios(config);

    const apiData = response.data;

      return res.status(200).json({
              success: true,
              data: apiData
          });

  } catch (error) {
    console.log('hhhy',error);
  }


}





// Step 4: Get AngelOne Profile
export const getAngelOneProfileFund = async function (req,res,next) {
    try {

      var config = {
      method: 'get',
      url: 'https://apiconnect.angelone.in/rest/secure/angelbroking/user/v1/getRMS',

      headers : {
        // 'Authorization': `Bearer ${auth_token}`,
         'Authorization': `Bearer ${req.headers.angelonetoken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-UserType': 'USER',
        'X-SourceID': 'WEB',
        'X-ClientLocalIP': process.env.CLIENT_LOCAL_IP, 
            'X-ClientPublicIP': process.env.CLIENT_PUBLIC_IP, 
            'X-MACAddress': process.env.MAC_Address, 
            'X-PrivateKey': process.env.PRIVATE_KEY, 
      }
    };

    let {data} = await axios(config);

     if(data.status==true) {

      return res.status(200).json({
              status: true,
              data: data.data
          });

     }else{
          return res.json({
              status: false,
              data:null,
              statusCode:data.errorCode,
              message:error.message
          });
     }

  } catch (error) {

    return res.json({
              status: false,
              data:null,
              statusCode:401,
              message:error.message
          });
  }
}



// Step 5: Generate Token
export const reGenerateTokenWithAngelOne = async function (req,res,next) {
    try {

          var reqData = JSON.stringify({
            "refreshToken":req.body.refresh_token
          });

          var config = {
          method: 'post',
          url: 'https://apiconnect.angelone.in/rest/auth/angelbroking/jwt/v1/generateTokens',
          headers: {
            'Authorization': `Bearer ${req.headers.angelonetoken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-UserType': 'USER',
            'X-SourceID': 'WEB',
            'X-ClientLocalIP': process.env.CLIENT_LOCAL_IP, 
            'X-ClientPublicIP': process.env.CLIENT_PUBLIC_IP, 
            'X-MACAddress': process.env.MAC_Address, 
            'X-PrivateKey': process.env.PRIVATE_KEY, 
        },
        data : reqData
      };

    let {data} = await axios(config);

       if(data.status==true) {

            return res.json({
            success: true,
            statusCode:200,
            data: data.data,
            message:'get data'
        });

         }else{

        return res.json({
            success: false,
            statusCode:data.errorcode,
            message: "Unexpected error occurred. Please try again.",
            data:null,
            error: data.message,
        });
    }

  } catch (error) {

    res.status(500).json({
            success: false,
            message: error.message,
        });

  }
}

export const angelOneCallback = async (req, res) => {

  const { auth_token, feed_token, refresh_token } = req.query;

  if (!auth_token) {
    return res.status(400).json({ message: "Missing auth_token in callback" });
  }

  try {
   
     // Generate pseudo user
    // const profileData = await fetchAngelOneProfile(refresh_token);

    // console.log("✅ profileData:", profileData);

    const angelUser = {
      clientcode: `774795`,
      name: "AngelOne User",
      email: `jhaamit7747@gmail.com` 
    };


    // Save or update user in DB
    let user = await User.findOne({ where: { angeloneId: angelUser.clientcode } });

    if (!user) {
      user = await User.create({
        firstName: "AngelOne",
        lastName: "User",
        password: "dummyPassword123!", 
        name: angelUser.name,
        email: angelUser.email,
        angeloneId: angelUser.clientcode,
        authToken: auth_token,
        feedToken: feed_token,
        refreshToken: refresh_token
      });
      
    } else {
      user.name = angelUser.name;
      user.email = angelUser.email || user.email;
      user.authToken = auth_token;
      user.feedToken = feed_token;
      user.refreshToken = refresh_token;
      await user.save();
      
    }

    // Generate JWT
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "1d" });
    console.log("🎯 JWT generated:", token);

    res.redirect(
      `${process.env.FRONTEND_URL}/login-success?token=${token}&user=${encodeURIComponent(JSON.stringify(user))}`
    );

  } catch (error) {
    console.error("💥 Error in AngelOne Callback:", error.message);
    res.status(500).json({ message: "AngelOne login failed", error: error.message });
  }
};





// ---------- ZERODHA ----------
const kite = new KiteConnect({
  api_key: process.env.KITE_API_KEY,
});

export const kiteLogin = (req, res) => {
  const loginUrl = kite.getLoginURL();
  res.redirect(loginUrl);
};

export const kiteCallback = async (req, res) => {
  const { request_token } = req.query;

  if (!request_token) {
    return res.status(400).json({ message: "Missing request_token" });
  }

  try {
    const session = await kite.generateSession(
      request_token,
      process.env.KITE_API_SECRET
    );

    console.log("✅ Zerodha Session:", session);

    // Here you decide how to identify the logged-in user
    // For example: req.user.email if logged in, or create a temp user
    const userEmail = `${session.user_id}@zerodha.com`; // Example fallback

    let user = await User.findOne({ email: userEmail });
    if (!user) {
      user = await User.create({
        email: userEmail,
        name: session.user_name || "Zerodha User",
        kiteToken: session.access_token,
      });
    } else {
      user.kiteToken = session.access_token;
      await user.save();
    }

    return res.redirect(
      `${process.env.FRONTEND_URL}/kite-login-success?token=${session.access_token}&user_id=${user._id}`
    );
  } catch (err) {
    console.error("❌ Zerodha Auth Error:", err);
    return res.redirect(`${process.env.FRONTEND_URL}/kite-login-failed`);
  }
};



// 1. Redirect to Groww authorize page
export const loginWithGroww = (req, res) => {
  const params = querystring.stringify({
    client_id: GROWW_CLIENT_ID,
    response_type: "code",
    redirect_uri: GROWW_REDIRECT_URI,
    scope: "profile email",
    state: "xyz123"
  });
  res.redirect(`https://groww.in/oauth/authorize?${params}`);
};

// 2. Handle callback
export const growwCallback = async (req, res) => {
  const { code } = req.query;

  try {
    // Exchange code for access token
    const tokenRes = await axios.post(
      "https://groww.in/oauth/token",
      querystring.stringify({
        grant_type: "authorization_code",
        code,
        redirect_uri: GROWW_REDIRECT_URI,
        client_id: GROWW_CLIENT_ID,
        client_secret: GROWW_CLIENT_SECRET
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    const { access_token } = tokenRes.data;

    // Fetch user profile
    const userRes = await axios.get("https://groww.in/oauth/userinfo", {
      headers: { Authorization: `Bearer ${access_token}` }
    });

    const growwUser = userRes.data;

    // Apne DB me user create/update karo
    const user = {
      name: growwUser.name,
      email: growwUser.email,
      growwId: growwUser.id
    };

    // JWT generate karo
    const token = createJwtToken(user);

    // Redirect to frontend with token & user
    res.redirect(
      `${FRONTEND_URL}/groww-login-success?token=${token}&user=${encodeURIComponent(
        JSON.stringify(user)
      )}`
    );
  } catch (err) {
    console.error("Groww login error:", err);
    res.redirect(`${FRONTEND_URL}/login?error=groww_login_failed`);
  }
};



// 1. Redirect to Fyers authorize page

export const fyersLogin = async (req, res) => {
  try {
    const BASE = process.env.FYERS_BASE_URL || "https://api-t1.fyers.in";
    const authUrl = `${BASE}/api/v3/generate-authcode` +
      `?client_id=${encodeURIComponent(process.env.FYERS_APP_ID)}` +
      `&redirect_uri=${encodeURIComponent(process.env.FYERS_REDIRECT_URI)}` +
      `&response_type=code` +
      `&state=fyers_${Date.now()}`;

    return res.redirect(authUrl);
  } catch (err) {
    console.error("FYERS login redirect error:", err);
    return res.status(500).json({ message: "Unable to start FYERS login" });
  }
};

// Utility: appIdHash (FYERS v3 requirement)
// Most setups: sha256(`${APP_ID}:${APP_SECRET}`)
function makeAppIdHash(appId, secret) {
  return crypto.createHash("sha256").update(`${appId}:${secret}`).digest("hex");
}


export const fyersCallback = async (req, res) => {
  const BASE = process.env.FYERS_BASE_URL || "https://api-t1.fyers.in";
  try {
    const code = req.query.code || req.query.auth_code; 
    if (!code) {
      return res.status(400).json({ message: "Missing auth code from FYERS" });
    }

    const appId = process.env.FYERS_APP_ID;
    const secret = process.env.FYERS_APP_SECRET;
    const appIdHash = makeAppIdHash(appId, secret);

    // Exchange code for tokens
    const tokenRes = await axios.post(
      `${BASE}/api/v3/validate-authcode`,
      {
        grant_type: "authorization_code",
        appIdHash,
        code, 
      },
      { headers: { "Content-Type": "application/json" } }
    );

    const { access_token, refresh_token } = tokenRes.data || {};
    if (!access_token) {
      throw new Error("No access_token in FYERS response");
    }

    const profileRes = await axios.get(`${BASE}/api/v3/profile`, {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const fyersProfile = profileRes.data || {};
 
    const fyersId = fyersProfile?.fy_id || fyersProfile?.user_id || fyersProfile?.id || null;
    const name =
      fyersProfile?.name ||
      fyersProfile?.display_name ||
      "FYERS User";
    const email =
      fyersProfile?.email_id ||
      fyersProfile?.email ||
      `${fyersId || "fyers"}@fyers.local`;

   
    let user = await User.findOne({ where: { fyersId } });
    if (!user) {
      user = await User.create({
        firstName: "FYERS",
        lastName: "User",
        name,
        email,
        password: "dummyPassword123!", 
        fyersId,
        fyersAccessToken: access_token,
        fyersRefreshToken: refresh_token,
      });
    } else {
      user.name = name;
      user.email = email || user.email;
      user.fyersAccessToken = access_token;
      user.fyersRefreshToken = refresh_token;
      await user.save();
    }

    // JWT for your app
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "1d" });

   
    return res.redirect(
      `${process.env.FRONTEND_URL}/login-success?token=${encodeURIComponent(
        token
      )}&user=${encodeURIComponent(JSON.stringify(user))}`
    );
  } catch (err) {
    console.error("FYERS callback error:", err?.response?.data || err.message);
    return res.redirect(
      `${process.env.FRONTEND_URL}/login?error=fyers_login_failed`
    );
  }
};





export const sendForgotEmail = async (req, res) => {
  const { email } = req.body;

  try {
    const emailExist = await User.findOne({ where: { email } });
    if(!emailExist) {
      return res.status(400).json({ message: "email is not registered" });
    }

    const resetCode = Math.floor(10000 + Math.random() * 900000).toString();

    emailExist.resetCode = resetCode;
    emailExist.resetCodeExpire = Date.now() + 15 * 60 * 1000;
    await emailExist.save();

    await sendResetMail(email, resetCode);

    return res.status(200).json({ message: "Reset Code Send to Your Email" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "server error" });
  }
}

export const verifyCode = async (req, res) => {

  const { email, code } = req.body;

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: "Email not registered" });
    }

    if (user.resetCode === code) {
      return res.status(200).json({ message: "Code verified successfully" });
    } else {
      return res.status(400).json({ message: "Invalid or expired code" });
    }
  } catch (error) {
    console.error("Verify code error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const newPassword = async (req, res) => {
  try {
    const { email, newPassword, confirmPassword } = req.body;

    if(!email || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: "all field are required" });
    }

    if(newPassword !== confirmPassword) {
      return res.status(400).json({ message: "password do not match" });
    }

    const user = await User.findOne({where: { email }});
    if(!user) {
      return res.status(404).json({ message: "user not found" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    user.resetCode = null;
    await user.save();

    return res.status(200).json({ message: "password reset successfully" });
  } catch (error) {
    console.error(" new password error", error);
    return res.status(500).json({ message: "internal server error" })
  }
};

// ===================== auth controller end ================================


// ====================== profile controller start ========================

export const profileUpdate = async (req, res) => {
  try {

    const { id, firstName, lastName, email, phoneNumber, bio } = req.body;
    let image;
    if (req.file) {
      image = req.file.filename;
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await user.update({
      firstName,
      lastName,
      email,
      phoneNumber,
      bio,
      ...(image && { image }),
    });

    res.status(200).json({ message: "Profile updated successfully", user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err });
  }
};

export const addressUpdate = async (req, res) => {
  try {
    const { id, country, cityOrState, postalCode } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await user.update({
      country,
      cityOrState,
      postalCode,
    });

    return res.status(200).json({ user, message: "Address updated successfully" });
  } catch (error) {
    console.error("Address update failed:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const updatePassword = async (req, res) => {
  const { id, currentPassword, newPassword, confirmPassword } = req.body;

  try {
    const existingUser = await User.findByPk(id);
    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, existingUser.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    existingUser.password = hashedPassword;
    await existingUser.save();

    res.status(200).json({ message: "Password changed successfully" });
  } catch (err) {
    console.error("Error in updatePassword:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};



// ====================== profile controller end ==========================
