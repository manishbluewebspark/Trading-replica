import crypto from "crypto";
import { shoonyaPost } from "../utils/shoonyaPost.js";
import User from "../models/userModel.js"


import { createHash } from 'crypto';
import axios from 'axios'; // or use your `axiosRequest` utility

export const shoonyaLogin = async (req, res) => {
  try {
    const { userId, password, otp } = req.body;
    const vc = process.env.SHOONYA_VENDOR_CODE;
    const apiKey = process.env.SHOONYA_API_KEY;
    const imei = process.env.SHOONYA_IMEI;

    // 1. Hash the password (SHA-256)
    const pwdHash = createHash('sha256').update(password).digest('hex');

    // 2. Generate appkey (SHA-256 of "uid|apiKey")
    const appkeyRaw = `${userId}|${apiKey}`;
    const appkey = createHash('sha256').update(appkeyRaw).digest('hex');


    console.log(appkey,'appkey');
    

    // 3. Prepare login payload
    const loginPayload = {
      apkversion: '1.0.0',
      uid: userId,
      pwd: pwdHash, // Use hashed password
      factor2: otp,
      vc,
      imei,
      source: 'API',
      appkey,
    };

    // 4. Stringify and format as "jData=<payload>"
    const jData = `jData=${JSON.stringify(loginPayload)}`;

    // 5. Send POST request to Shoonya login endpoint
    const response = await axios.post(
      'https://api.shoonya.com/NorenWClientTP/QuickAuth',
      jData,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const data = response.data;

    // 6. Check response status
    if (data.stat !== 'Ok') {
      return res.status(401).json({
        status: false,
        message: data.emsg || 'Shoonya login failed',
        data,
      });
    }

    // 7. Save `susertoken` to your database (mapped to your platform user)
    // Example: await User.update({ shoonyaToken: data.susertoken }, { where: { id: req.user.id } });

    // 8. Return success response
    return res.json({
      status: true,
      message: 'Shoonya login successful',
      data,
    });
  } catch (err) {
    console.error('Shoonya login error:', err);
    return res.status(500).json({
      status: false,
      message: 'Unexpected error in Shoonya login',
      error: err.message,
    });
  }
};



export const shoonyaLogin1 = async (req, res) => {
  try {
    
    const { userId, password, otp } = req.body;

       
    const vc = process.env.SHOONYA_VENDOR_CODE;
    const apiKey = process.env.SHOONYA_API_KEY;
    const imei = process.env.SHOONYA_IMEI

    // appkey = sha256("uid|api_key")
    const appkeyRaw = `${userId}|${apiKey}`;
    const appkey = crypto
      .createHash("sha256")
      .update(appkeyRaw)
      .digest("hex");

    const loginPayload = {
      apkversion: "1.0.0",
      uid: userId,
      pwd: password,      // or hashed, follow docs
      factor2: otp,       // OTP/TOTP from app
      vc,
      appkey,
      imei: imei,
      source: "API",
    };

        console.log('google');

    const data = await shoonyaPost("/QuickAuth", loginPayload);

    console.log(data,'ascascasca');
    


    if (data.stat !== "Ok") {
      return res.status(401).json({
        status: false,
        message: data.emsg || "Shoonya login failed",
        data,
      });
    }

    // save susertoken in DB mapped to your platform user
    
    

    return res.json({
      status: true,
      message: "Shoonya login success",
      data,
    });
  } catch (err) {
    console.error("Shoonya login error", err);
    return res.status(500).json({
      status: false,
      message: "Unexpected error in Shoonya login",
      error: err.message,
    });
  }
};