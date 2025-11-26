import crypto from "crypto";
import { shoonyaPost } from "../utils/shoonyaPost.js";
import User from "../models/userModel.js"


export const shoonyaLogin = async (req, res) => {
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

    const data = await shoonyaPost("/QuickAuth", loginPayload);

    console.log(data,'login Finvasia');

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