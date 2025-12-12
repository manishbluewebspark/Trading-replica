import User from '../models/userModel.js';
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
import {  connectSmartSocket,emitOrderGet,isSocketReady} from "../services/smartapiFeed.js"
import UserSession from '../models/userSession.js';
import BrokerModel from '../models/borkerModel.js';

import { encrypt,decrypt } from "../utils/passwordUtils.js"
const GROWW_CLIENT_ID = process.env.GROWW_CLIENT_ID;
const GROWW_CLIENT_SECRET = process.env.GROWW_CLIENT_SECRET;
const GROWW_REDIRECT_URI = process.env.GROWW_REDIRECT_URI;
const FRONTEND_URL = process.env.FRONTEND_URL;
import logger from "../common/logger.js";


// ===================== auth controller start ================================


export async function fetchGooglFromSerpApi(req,res,next) {

  try {

    const url = "https://serpapi.com/search.json";

    const response = await axios.get(url, {
      params: {
        engine: "google_finance",
        q: "GOOGL:NASDAQ",
        // api_key: SERPAPI_KEY,
      },
    });

      return res.json({
              status: true,
              data:response.data,
              statusCode:2001,
              message:null
          });
    

  } catch (err) {

    return res.json({
              status: true,
              data:null,
              statusCode:2001,
              message:err.message
          });

  }
}

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

const { firstName, lastName,mob, isChecked,broker } = req.body;
const email = (req.body.email || "").trim();
const password = (req.body.password || "").trim();


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


    // const hashedPassword = await bcrypt.hash(password, 10);

      const hashedPassword = await encrypt(password, process.env.CRYPTO_SECRET);

      const brokerLower = broker?.toString().trim().toLowerCase();


      console.log(brokerLower);
      


     const brokerData = await BrokerModel.findOne({
          where: { brokerName: brokerLower },
          raw: true,
        });


        console.log(brokerData);
        

    if (!brokerData) {
          return res.json({
            status: false,
            message: "Invalid broker selected",
          });
        }

    const brokerLink = brokerData.brokerLink;

     let saveUser = await User.create({
      firstName,
      lastName,
      username:username,
      email,
      phoneNumber:mob,
      role:'user',
      password: hashedPassword,
      isChecked,
      brokerName:brokerLower,
      brokerImageLink:brokerLink
    });
    
     const token = jwt.sign({ id: saveUser.id,role:saveUser.role,broker:saveUser.brokerName }, process.env.JWT_SECRET, { expiresIn: '1d' });

     // create a new login session
      await UserSession.create({
      userId: saveUser.id,
      login_at: new Date(),
      is_active: true,
    });


   
     return res.json({
            status: true,
            statusCode:400,
            saveUser,token,
            data:saveUser,
            message: "User registered successfully",
            error: null,
        });
  } catch (error) {


    console.log(error);
    

    return res.json({
            status: false,
            statusCode:500,
            message: "Unexpected error occurred. Please try again.",
            data:null,
            error: error.message,
        });

  }
};


// export const login = async (req, res) => {

// const email = (req.body.email || "").trim();
// const password = (req.body.password || "").trim();

//   try {

//     // Get start and end of today
//       const now = new Date();
//       const startOfDay = new Date(now.setHours(0, 0, 0, 0)); // Midnight today
//       const endOfDay = new Date(now.setHours(23, 59, 59, 999)); // End of today

//        console.log(email,password,'llllll');
    

//     // const user = await User.findOne({ where: { email } });

//     const user = await User.findOne({
//       where: {
//         [Op.or]: [
//           { email: email },      // assuming you store emails in lowercase
//           { username: email },    // usernames are case-sensitive or as per your rules
//         ],
//       },
//     });

   

//     if (!user) {

//       console.log(user,'user');
      

//       return res.json({
//             status: false,
//             statusCode:401,
//             message: "User not found",
//             error: null,
//         });
//     }

    
//      // Count logins for the user today
//       const loginCount = await UserSession.count({
//         where: {
//           userId: user.id,
//           is_active:true,
//           login_at: {
//             [Op.not]: null, // Ensure login_at is not null
//             [Op.between]: [startOfDay, endOfDay], // Check if login_at is today
//           },
//         },
//       });

//       if(loginCount>=3&&user.role!=='admin') {
        
//           return res.json({
//             status: false,
//             statusCode:401,
//             message: "Only Two User Login Same Crendential",
//             error: null,
//         });
//       }

      
      

//     const originalPass = decrypt(user.password,process.env.CRYPTO_SECRET)

//       console.log('crypto code end ');

  
//     if (originalPass!==password){

//       return res.json({
//             status: false,
//             statusCode:401,
//             message: "Invalid credentials",
//             error: null,
//         });

//     } 


//      // create a new login session
//        await UserSession.create({
//       userId:  user.id,
//       login_at: new Date(),
//       is_active: true,
//     });


     
//     // 2️⃣ Find any user where angelLoginUser = true AND updated today
//       const activeAngelUser = await User.findOne({
//         where: {
//           angelLoginUser: true,
//           email:user.email,
//           updatedAt: {
//             [Op.between]: [startOfDay, endOfDay],
//           },
//         },
//         raw:true
//       });
      
//     const token = jwt.sign({ id: user.id,role:user.role,borker:user.brokerName }, process.env.JWT_SECRET, { expiresIn: '1d' })

//      if(user.role==='admin') {

//        if(activeAngelUser) {
      
//           let adminCren = {
//               authToken:activeAngelUser.authToken,
//               feedToken:activeAngelUser.feedToken,
//               refreshToken:activeAngelUser.refreshToken
//           }

//         if (isSocketReady(user.id)) {

//          emitOrderGet(user.authToken)
//       } else {
//           connectSmartSocket(user.id,activeAngelUser.authToken,activeAngelUser.feedToken,'abc')
//       }

//       return res.json({
//             status: true,
//             statusCode:400,
//             token, user,
//             message: "User login successfully",
//             angelTokens:adminCren,
//             error: null,
//         });

//     }else{
//         return res.json({
//             status: true,
//             statusCode:400,
//             token, user,
//             message: "User login successfully",
//             angelTokens:{},
//             error: null,
//         });
//     }
      
//      }else{

//         // 2️⃣ Find any user where angelLoginUser = true AND updated today
//       const angelCrendentialData = await AngelOneCredentialer.findOne({
//         where: {
//           userId:user.id ,
//         },
//         raw:true
//       });

//        if(angelCrendentialData) {

//         if (isSocketReady(user.id)) {

//             console.log('socket already connection',isSocketReady(user.id));

//         emitOrderGet(user.authToken)
        
//       } else {
//           connectSmartSocket(user.id,user.authToken,user.feedToken,angelCrendentialData?.clientId)
//       }

//      let userCren = {
//               authToken:user.authToken,
//               feedToken:user.feedToken,
//               refreshToken:user.refreshToken
//           }

      
//      return res.json({
//             status: true,
//             statusCode:400,
//             token, user,
//             angelTokens:userCren,
//             message: "User login successfully",
//             error: null,
//         });


//        }else if(user.brokerName==='kite') {

//         return res.json({
//             status: true,
//             statusCode:400,
//             token, user,
//             angelTokens:{
//               authToken:user.authToken,
//               feedToken:user.feedToken,
//               refreshToken:user.refreshToken
//             },
//             message: "User login successfully",
//             error: null,
//         });

//        }else{
         
//          return res.json({
//             status: true,
//             statusCode:400,
//             token, user,
//             angelTokens:{
//               authToken:"",
//               feedToken:"",
//               refreshToken:""
//             },
//             message: "User login successfully",
//             error: null,
//         });

//        }

//      }
  
//   } catch (error) {

//     console.log(error);
    

//       return res.json({
//             status: false,
//             statusCode:500,
//             message: "Unexpected error occurred. Please try again.",
//             data:null,
//             error: error.message,
//         });
//   }
// };













// Step 2: Get AngelOne Profile

export const login = async (req, res) => {

const email = (req.body.email || "").trim();
const password = (req.body.password || "").trim();

  try {

    // Get start and end of today
      const now = new Date();
      const startOfDay = new Date(now.setHours(0, 0, 0, 0)); // Midnight today
      const endOfDay = new Date(now.setHours(23, 59, 59, 999)); // End of today

       console.log(email,password,'llllll');
    

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

    
     // Count logins for the user today
      const loginCount = await UserSession.count({
        where: {
          userId: user.id,
          is_active:true,
          login_at: {
            [Op.not]: null, // Ensure login_at is not null
            [Op.between]: [startOfDay, endOfDay], // Check if login_at is today
          },
        },
      });

      if(loginCount>=3&&user.role!=='admin') {
        
          return res.json({
            status: false,
            statusCode:401,
            message: "Only Two User Login Same Crendential",
            error: null,
        });
      }

      console.log('crypto code start ');
      

    const originalPass = decrypt(user.password,process.env.CRYPTO_SECRET)

      console.log('crypto code end ');

  
    if (originalPass!==password){

      return res.json({
            status: false,
            statusCode:401,
            message: "Invalid credentials",
            error: null,
        });

    } 


    // ✅ 3) Only create a UserSession if user has NOT logged in today
    if (loginCount === 0) {
    
      // create a new login session
       await UserSession.create({
      userId:  user.id,
      login_at: new Date(),
      is_active: true,
    });

    } else {
      console.log(
        `User ${user.id} already has a session today, not creating new UserSession`
      );
    }


     
    // 2️⃣ Find any user where angelLoginUser = true AND updated today
      const activeAngelUser = await User.findOne({
        where: {
          angelLoginUser: true,
          brokerName:"angelone",
          updatedAt: {
            [Op.between]: [startOfDay, endOfDay],
          },
        },
        raw:true
      });
      
    const token = jwt.sign({ id: user.id,role:user.role,borker:user.brokerName }, process.env.JWT_SECRET, { expiresIn: '1d' })

     if(user.role==='admin') {

       if(activeAngelUser) {
      
          let adminCren = {
              authToken:activeAngelUser.authToken,
              feedToken:activeAngelUser.feedToken,
              refreshToken:activeAngelUser.refreshToken
          }

        if (isSocketReady(user.id)) {

         emitOrderGet(user.authToken)
      } else {
          connectSmartSocket(user.id,activeAngelUser.authToken,activeAngelUser.feedToken,'abc')
      }

      return res.json({
            status: true,
            statusCode:400,
            token, user,
            message: "User login successfully",
            angelTokens:adminCren,
            error: null,
        });

    }else{
        return res.json({
            status: true,
            statusCode:400,
            token, user,
            message: "User login successfully",
            angelTokens:{},
            error: null,
        });
    }
      
     }else{

        // 2️⃣ Find any user where angelLoginUser = true AND updated today
      const angelCrendentialData = await AngelOneCredentialer.findOne({
        where: {
          userId:user.id ,
        },
        raw:true
      });

       if(angelCrendentialData) {

        if (isSocketReady(user.id)) {

            console.log('socket already connection',isSocketReady(user.id));

        emitOrderGet(user.authToken)
        
      } else {
          connectSmartSocket(user.id,user.authToken,user.feedToken,angelCrendentialData?.clientId)
      }

     let userCren = {
              authToken:user.authToken,
              feedToken:user.feedToken,
              refreshToken:user.refreshToken
          }

      
     return res.json({
            status: true,
            statusCode:400,
            token, user,
            angelTokens:userCren,
            message: "User login successfully",
            error: null,
        });


       }else if(user.brokerName==='kite') {

        return res.json({
            status: true,
            statusCode:400,
            token, user,
            angelTokens:{
              authToken:user.authToken,
              feedToken:user.feedToken,
              refreshToken:user.refreshToken
            },
            message: "User login successfully",
            error: null,
        });

       }else{
         
         return res.json({
            status: true,
            statusCode:400,
            token, user,
            angelTokens:{
              authToken:"",
              feedToken:"",
              refreshToken:""
            },
            message: "User login successfully",
            error: null,
        });

       }

     }
  
  } catch (error) {

    console.log(error);
    

      return res.json({
            status: false,
            statusCode:500,
            message: "Unexpected error occurred. Please try again.",
            data:null,
            error: error.message,
        });
  }
};

export const adminloginWithTOTPInAngelOne = async function (req,res,next) {
    try {

       // Get start and end of today
      const now = new Date();
      const startOfDay = new Date(now.setHours(0, 0, 0, 0)); // Midnight today
      const endOfDay = new Date(now.setHours(23, 59, 59, 999)); // End of today

    // Count logins for the user today
      const loginCount = await UserSession.count({
        where: {
          userId: req.headers.userid,
            is_active:true,
          login_at: {
            [Op.not]: null, // Ensure login_at is not null
            [Op.between]: [startOfDay, endOfDay], // Check if login_at is today
          },
        },
      });

      if(loginCount>=2) {
        
          return res.json({
            status: false,
            statusCode:401,
            message: "Only Two User Login Same Crendential",
            error: null,
        });
      }  
        
    let existing = await AngelOneCredentialer.findOne({ where: { userId:req.headers.userid  } });

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
        angelLoginUser:true,
      },
      {
        where: { id: req.headers.userid },
        returning: true, // optional, to get the updated record
      }
    );

        

        if (isSocketReady(req.headers.userid)) {
        console.log('✅ WebSocket is connected!');
      } else {
          connectSmartSocket(req.headers.userid,data.data.jwtToken,data.data.feedToken,createdData.clientId)
      }

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


    console.log(error);
    

    return res.json({
              status: false,
              data:null,
              statusCode:401,
              message:error.message
          });
  }
}

// Step 2: Get AngelOne Profile


// export const loginWithTOTPInAngelOne = async (req, res, next) => {
//   try {
//     // 1) Fetch stored Angel creds for this user
//     const existing = await AngelOneCredentialer.findOne({ where: { userId: req.userId } });
//     if (!existing) {
//       return res.status(404).json({
//         status: false,
//         statusCode: 404,
//         message: "No credentials found for this user.",
//         data: null,
//       });
//     }

//     const createdData = existing.dataValues;
//     const totpCode = await generateTOTP(createdData.totpSecret);

//     // 2) Headers (keep your IPv4 public IP for compatibility)
//     const headers = {
//       "Content-Type": "application/json",
//       "Accept": "application/json",
//       "X-UserType": "USER",
//       "X-SourceID": "WEB",
//       "X-ClientLocalIP": process.env.CLIENT_LOCAL_IP || "127.0.0.1",
//       "X-ClientPublicIP": process.env.CLIENT_PUBLIC_IP || "1.187.216.154",
//       "X-MACAddress": process.env.MAC_Address || "32:bd:3a:75:8f:62",
//       "X-PrivateKey": process.env.PRIVATE_KEY, // Angel API key
//     };

//     // 3) Body (no stringify; axios handles JSON)
//     const body = {
//       clientcode: createdData.clientId,
//       password: createdData.password,
//       totp: totpCode,
//     };

//     // 4) Call Angel One Auth (note: single slash path; baseURL covers the host)
//     const { data } = await angelApi.post(
//       "/rest/auth/angelbroking/user/v1/loginByPassword",
//       body,
//       { headers }
//     );

//     // 5) Handle response
//     if (data?.status === true && data?.data?.jwtToken) {
//       // Persist tokens
//       await User.update(
//         {
//           authToken: data.data.jwtToken,
//           feedToken: data.data.feedToken,
//           refreshToken: data.data.refreshToken,
//         },
//         { where: { id: req.userId } }
//       );

//       // Optional: Connect SmartAPI WebSocket using fresh tokens
//       try {
//         connectSmartSocket(data.data.jwtToken, data.data.feedToken);
//       } catch (wsErr) {
//         // Don't fail login if WS connect fails; just log it
//         console.warn("SmartAPI WS connect error:", wsErr?.message || wsErr);
//       }

//       return res.status(200).json({
//         status: true,
//         statusCode: 200,
//         data: data.data,
//       });
//     }

//     // Angel returned an application error
//     return res.status(401).json({
//       status: false,
//       statusCode: data?.errorCode || 401,
//       message: data?.message || "Angel One login failed.",
//       data: null,
//     });
//   } catch (error) {
//     // Network/timeout/auth parsing etc.
//     console.error("loginWithTOTPInAngelOne error:", {
//       code: error?.code,
//       errno: error?.errno,
//       syscall: error?.syscall,
//       address: error?.address,
//       port: error?.port,
//       message: error?.message,
//       responseStatus: error?.response?.status,
//       responseData: error?.response?.data,
//     });

//     return res.status(500).json({
//       status: false,
//       statusCode: 500,
//       message: "Unexpected error occurred during Angel One login.",
//       data: null,
//       error: error?.message,
//     });
//   }
// };



// ---------- ZERODHA ----------
// controllers/kiteController.js
const kite = new KiteConnect({
  api_key: process.env.KITE_API_KEY,
});


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



// // 1. Redirect to Fyers authorize page

// export const fyersLogin = async (req, res) => {
//   try {
//     const BASE = process.env.FYERS_BASE_URL || "https://api-t1.fyers.in";
//     const authUrl = `${BASE}/api/v3/generate-authcode` +
//       `?client_id=${encodeURIComponent(process.env.FYERS_APP_ID)}` +
//       `&redirect_uri=${encodeURIComponent(process.env.FYERS_REDIRECT_URI)}` +
//       `&response_type=code` +
//       `&state=fyers_${Date.now()}`;

//     return res.redirect(authUrl);
//   } catch (err) {
//     console.error("FYERS login redirect error:", err);
//     return res.status(500).json({ message: "Unable to start FYERS login" });
//   }
// };

// // Utility: appIdHash (FYERS v3 requirement)
// // Most setups: sha256(`${APP_ID}:${APP_SECRET}`)
// function makeAppIdHash(appId, secret) {
//   return crypto.createHash("sha256").update(`${appId}:${secret}`).digest("hex");
// }


// export const fyersCallback = async (req, res) => {
//   const BASE = process.env.FYERS_BASE_URL || "https://api-t1.fyers.in";
//   try {
//     const code = req.query.code || req.query.auth_code; 
//     if (!code) {
//       return res.status(400).json({ message: "Missing auth code from FYERS" });
//     }

//     const appId = process.env.FYERS_APP_ID;
//     const secret = process.env.FYERS_APP_SECRET;
//     const appIdHash = makeAppIdHash(appId, secret);

//     // Exchange code for tokens
//     const tokenRes = await axios.post(
//       `${BASE}/api/v3/validate-authcode`,
//       {
//         grant_type: "authorization_code",
//         appIdHash,
//         code, 
//       },
//       { headers: { "Content-Type": "application/json" } }
//     );

//     const { access_token, refresh_token } = tokenRes.data || {};
//     if (!access_token) {
//       throw new Error("No access_token in FYERS response");
//     }

//     const profileRes = await axios.get(`${BASE}/api/v3/profile`, {
//       headers: { Authorization: `Bearer ${access_token}` },
//     });

//     const fyersProfile = profileRes.data || {};
 
//     const fyersId = fyersProfile?.fy_id || fyersProfile?.user_id || fyersProfile?.id || null;
//     const name =
//       fyersProfile?.name ||
//       fyersProfile?.display_name ||
//       "FYERS User";
//     const email =
//       fyersProfile?.email_id ||
//       fyersProfile?.email ||
//       `${fyersId || "fyers"}@fyers.local`;

   
//     let user = await User.findOne({ where: { fyersId } });
//     if (!user) {
//       user = await User.create({
//         firstName: "FYERS",
//         lastName: "User",
//         name,
//         email,
//         password: "dummyPassword123!", 
//         fyersId,
//         fyersAccessToken: access_token,
//         fyersRefreshToken: refresh_token,
//       });
//     } else {
//       user.name = name;
//       user.email = email || user.email;
//       user.fyersAccessToken = access_token;
//       user.fyersRefreshToken = refresh_token;
//       await user.save();
//     }

//     // JWT for your app
//     const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "1d" });

   
//     return res.redirect(
//       `${process.env.FRONTEND_URL}/login-success?token=${encodeURIComponent(
//         token
//       )}&user=${encodeURIComponent(JSON.stringify(user))}`
//     );
//   } catch (err) {
//     console.error("FYERS callback error:", err?.response?.data || err.message);
//     return res.redirect(
//       `${process.env.FRONTEND_URL}/login?error=fyers_login_failed`
//     );
//   }
// };





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

    const hashedPassword = await encrypt(existingUser.password, process.env.CRYPTO_SECRET);

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

  const { currentPassword, newPassword, confirmPassword } = req.body;

  try {

    const existingUser = await User.findByPk(req.userId);

    if (!existingUser) {

      return res.status(404).json({ message: "User not found" });
    }

    const originalPass = await decrypt( existingUser.password,process.env.CRYPTO_SECRET);

    if (originalPass!==currentPassword) {

      return res.status(400).json({ message: "Current password is incorrect" });

    }

    if (newPassword !== confirmPassword) {

      return res.status(400).json({ message: "Passwords do not match" });

    }

    const hashedPassword = await encrypt( newPassword,process.env.CRYPTO_SECRET);

    existingUser.password = hashedPassword;

    await existingUser.save();

    res.status(200).json({ message: "Password changed successfully" });

  } catch (err) {

    console.error("Error in updatePassword:", err);

    res.status(500).json({ message: "Server error", error: err.message });
  }
};



export const testGetAngelOneProfileFund = async function (req,res,next) {
    try {

      let token = 'eyJhbGciOiJIUzUxMiJ9.eyJ1c2VybmFtZSI6IkFSSk1BMTkyMSIsInJvbGVzIjowLCJ1c2VydHlwZSI6IlVTRVIiLCJ0b2tlbiI6ImV5SmhiR2NpT2lKU1V6STFOaUlzSW5SNWNDSTZJa3BYVkNKOS5leUoxYzJWeVgzUjVjR1VpT2lKamJHbGxiblFpTENKMGIydGxibDkwZVhCbElqb2lkSEpoWkdWZllXTmpaWE56WDNSdmEyVnVJaXdpWjIxZmFXUWlPalFzSW5OdmRYSmpaU0k2SWpNaUxDSmtaWFpwWTJWZmFXUWlPaUl4WlROa04yWTVZUzAwTkRWaUxUTmtZelV0T1RFeFlTMDJOR1ZtT1RZNE5qQTFZbVFpTENKcmFXUWlPaUowY21Ga1pWOXJaWGxmZGpJaUxDSnZiVzVsYldGdVlXZGxjbWxrSWpvMExDSndjbTlrZFdOMGN5STZleUprWlcxaGRDSTZleUp6ZEdGMGRYTWlPaUpoWTNScGRtVWlmU3dpYldZaU9uc2ljM1JoZEhWeklqb2lZV04wYVhabEluMTlMQ0pwYzNNaU9pSjBjbUZrWlY5c2IyZHBibDl6WlhKMmFXTmxJaXdpYzNWaUlqb2lRVkpLVFVFeE9USXhJaXdpWlhod0lqb3hOell6TVRnM05qTXdMQ0p1WW1ZaU9qRTNOak14TURFd05UQXNJbWxoZENJNk1UYzJNekV3TVRBMU1Dd2lhblJwSWpvaU0yRXpZMk5pWWpBdFlUbGtOaTAwTm1Ga0xUbG1ObUl0WmpKak5EUTVabVkwWXpZM0lpd2lWRzlyWlc0aU9pSWlmUS5weTFNamFRQXg5X0lyTVdqektyVWRPaU9ZZWl4UkxhNmVqbmFqcGprS3luY0VqMDJwUTdrVEFfY3VLc0ZQaVd2cnRWemw5OXhXcW5LLV9iOGItTUtCZXZKQ0dDTEZmcmV2c3VXRnM0amhxWC14VGl6Qm1WODVLTkg0NGR4bFZzQlhpOXVpLXFJc2Q5R1VGX3M5T1FyblMwWE5scW9VRFpjWFNOakRfZThBaUkiLCJBUEktS0VZIjoieUpicm5ua3giLCJYLU9MRC1BUEktS0VZIjp0cnVlLCJpYXQiOjE3NjMxMDEyMzAsImV4cCI6MTc2MzE0NTAwMH0.yzO3Ka-9N0-Ta96mop8yiwLBpASR7AiMEDtPmqYjE4jpSP2GuMWjA3yTXuLP5ey7_m5OHHznuLeZNOnTqESt1A'
    

      var config = {
      method: 'get',
      url: 'https://apiconnect.angelone.in/rest/secure/angelbroking/user/v1/getRMS',

      headers : {
        // 'Authorization': `Bearer ${auth_token}`,
         'Authorization': `Bearer ${token}`,
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

    console.log(data,'test fund');
    


     if(data.status==true) {

     
  return res.json({
              status: true,
              statusCode:200,
              data: data.data,
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

export const testGetAngelOneProfile = async function (req,res,next) {
    try {


    let token = 'eyJhbGciOiJIUzUxMiJ9.eyJ1c2VybmFtZSI6IkFSSk1BMTkyMSIsInJvbGVzIjowLCJ1c2VydHlwZSI6IlVTRVIiLCJ0b2tlbiI6ImV5SmhiR2NpT2lKU1V6STFOaUlzSW5SNWNDSTZJa3BYVkNKOS5leUoxYzJWeVgzUjVjR1VpT2lKamJHbGxiblFpTENKMGIydGxibDkwZVhCbElqb2lkSEpoWkdWZllXTmpaWE56WDNSdmEyVnVJaXdpWjIxZmFXUWlPalFzSW5OdmRYSmpaU0k2SWpNaUxDSmtaWFpwWTJWZmFXUWlPaUl4WlROa04yWTVZUzAwTkRWaUxUTmtZelV0T1RFeFlTMDJOR1ZtT1RZNE5qQTFZbVFpTENKcmFXUWlPaUowY21Ga1pWOXJaWGxmZGpJaUxDSnZiVzVsYldGdVlXZGxjbWxrSWpvMExDSndjbTlrZFdOMGN5STZleUprWlcxaGRDSTZleUp6ZEdGMGRYTWlPaUpoWTNScGRtVWlmU3dpYldZaU9uc2ljM1JoZEhWeklqb2lZV04wYVhabEluMTlMQ0pwYzNNaU9pSjBjbUZrWlY5c2IyZHBibDl6WlhKMmFXTmxJaXdpYzNWaUlqb2lRVkpLVFVFeE9USXhJaXdpWlhod0lqb3hOell6TVRnM05qTXdMQ0p1WW1ZaU9qRTNOak14TURFd05UQXNJbWxoZENJNk1UYzJNekV3TVRBMU1Dd2lhblJwSWpvaU0yRXpZMk5pWWpBdFlUbGtOaTAwTm1Ga0xUbG1ObUl0WmpKak5EUTVabVkwWXpZM0lpd2lWRzlyWlc0aU9pSWlmUS5weTFNamFRQXg5X0lyTVdqektyVWRPaU9ZZWl4UkxhNmVqbmFqcGprS3luY0VqMDJwUTdrVEFfY3VLc0ZQaVd2cnRWemw5OXhXcW5LLV9iOGItTUtCZXZKQ0dDTEZmcmV2c3VXRnM0amhxWC14VGl6Qm1WODVLTkg0NGR4bFZzQlhpOXVpLXFJc2Q5R1VGX3M5T1FyblMwWE5scW9VRFpjWFNOakRfZThBaUkiLCJBUEktS0VZIjoieUpicm5ua3giLCJYLU9MRC1BUEktS0VZIjp0cnVlLCJpYXQiOjE3NjMxMDEyMzAsImV4cCI6MTc2MzE0NTAwMH0.yzO3Ka-9N0-Ta96mop8yiwLBpASR7AiMEDtPmqYjE4jpSP2GuMWjA3yTXuLP5ey7_m5OHHznuLeZNOnTqESt1A'
     
    var config = {
      method: 'get',
      url: 'https://apiconnect.angelone.in/rest/secure/angelbroking/user/v1/getProfile',
      headers : {
         'Authorization': `Bearer ${token}`,
          // 'Authorization': `Bearer ${token}`,
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


// ====================== profile controller end ==========================
