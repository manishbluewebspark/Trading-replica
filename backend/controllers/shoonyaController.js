import crypto from "crypto";
import { shoonyaPost } from "../utils/shoonyaPost.js";
import User from "../models/userModel.js"
import { createHash } from 'crypto';
import axios from 'axios'; 

const SHOONYA_BASE_URL = "https://api.shoonya.com/NorenWClientTP";


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


// -------------------------------
// POST FUNDS CONTROLLER
// -------------------------------
export const getShoonyaFunds = async (req, res) => {
  try {
    const { uid, susertoken } = req.body;

    if (!uid  || !susertoken) {
      return res.status(400).json({
        status: false,
        message: "uid, actid and susertoken are required",
      });
    }

    const url = `${SHOONYA_BASE_URL}/Limits`;

    // 👇 This object will become the JSON in jData
    const jData = {
      uid,    // e.g. "FN169676"
      acti:uid,  // e.g. "FN169676"
      // Optional: prd, seg, exch, etc.
      // prd: "C",
      // seg: "CM",
      // exch: "NSE",
    };



    // ✅ Build raw x-www-form-urlencoded string like in their curl examples
    const body = `jKey=${susertoken}&jData=${JSON.stringify(jData)}`;

    const response = await axios.post(url, body, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    const data = response?.data;

    if (!data || data.stat !== "Ok") {
      return res.status(400).json({
        status: false,
        message: data?.emsg || "Unable to fetch funds",
        raw: data,
      });
    }

    return res.json({
      status: true,
      message: "Funds (Limits) fetched successfully",
      funds: data,
    });
  } catch (error) {
    console.error("Shoonya Funds Error:", error?.response?.data || error);

    return res.status(500).json({
      status: false,
      message: "Shoonya funds fetch failed",
      error: error?.response?.data || error.message,
    });
  }
};


// -------------------------------
// POST ORDERS CONTROLLER
// -------------------------------
export const getShoonyaOrders = async (req, res) => {
  try {
    const { uid, susertoken } = req.body;

    if (!uid || !susertoken) {
      return res.status(400).json({
        status: false,
        message: "uid and susertoken are required",
      });
    }

    const url = `${SHOONYA_BASE_URL}/OrderBook`;

    const jData = { uid };

    const body = `jKey=${susertoken}&jData=${JSON.stringify(jData)}`;

    console.log("Shoonya /OrderBook body =>", body);

    const response = await axios.post(url, body, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    const data = response?.data;
    console.log("Finvasia orders raw:", data);

    if (!data) {
      return res.status(400).json({
        status: false,
        message: "No response from Shoonya OrderBook",
      });
    }

    // 🔹 Case A: "no data" → treat as success with empty orders
    if (
      !Array.isArray(data) &&
      data.stat === "Not_Ok" &&
      typeof data.emsg === "string" &&
      data.emsg.toLowerCase().includes("no data")
    ) {
      return res.json({
        status: true,
        message: "No orders found",
        count: 0,
        orders: [],
        raw: data,
      });
    }

    // 🔹 Case B: other errors from Shoonya
    if (!Array.isArray(data) && data.stat && data.stat !== "Ok") {
      return res.status(400).json({
        status: false,
        message: data?.emsg || "Unable to fetch orders",
        raw: data,
      });
    }

    // 🔹 Case C: Success – data is array or wrapped
    let orders = [];

    if (Array.isArray(data)) {
      orders = data;
    } else if (Array.isArray(data?.orders)) {
      orders = data.orders;
    }

    return res.json({
      status: true,
      message: "Orders fetched successfully",
      count: orders.length,
      orders,
      raw: data,
    });
  } catch (error) {
    console.error("Shoonya Orders Error:", error?.response?.data || error);

    return res.status(500).json({
      status: false,
      message: "Shoonya orders fetch failed",
      error: error?.response?.data || error.message,
    });
  }
};



// -------------------------------
// POST Trades CONTROLLER
// -------------------------------
export const getShoonyaTrades = async (req, res) => {
  try {
    // 🔹 Now expecting actid also
    const { uid, susertoken } = req.body;

     let actid = uid

    if (!uid || !actid || !susertoken) {
      return res.status(400).json({
        status: false,
        message: "uid, actid and susertoken are required",
      });
    }

   

    const url = `${SHOONYA_BASE_URL}/TradeBook`;

    // jData MUST have uid + actid
    const jData = {
      uid,   // e.g. "FN169676"
      actid, // e.g. "FN169676"
      // Optional filters if you want later:
      // exch: "NSE",
      // prd: "C",
      // seg: "CM",
    };

    // raw x-www-form-urlencoded (Shoonya style)
    const body = `jKey=${susertoken}&jData=${JSON.stringify(jData)}`;

    console.log("Shoonya /TradeBook body =>", body);

    const response = await axios.post(url, body, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    const data = response?.data;
    console.log("Finvasia trades raw:", data);

    if (!data) {
      return res.status(400).json({
        status: false,
        message: "No response from Shoonya TradeBook",
      });
    }

    // 🔹 Case A: "no data" → no trades
    if (
      !Array.isArray(data) &&
      data.stat === "Not_Ok" &&
      typeof data.emsg === "string" &&
      data.emsg.toLowerCase().includes("no data")
    ) {
      return res.json({
        status: true,
        message: "No trades found",
        count: 0,
        trades: [],
        raw: data,
      });
    }

    // 🔹 Case B: some other Shoonya error
    if (!Array.isArray(data) && data.stat && data.stat !== "Ok") {
      return res.status(400).json({
        status: false,
        message: data?.emsg || "Unable to fetch trades",
        raw: data,
      });
    }

    // 🔹 Case C: success – usually an array of trades
    let trades = [];

    if (Array.isArray(data)) {
      trades = data;
    } else if (Array.isArray(data?.trades)) {
      trades = data.trades;
    }

    return res.json({
      status: true,
      message: "Trades fetched successfully",
      count: trades.length,
      trades,
      raw: data,
    });
  } catch (error) {
    console.error("Shoonya Trades Error:", error?.response?.data || error);

    return res.status(500).json({
      status: false,
      message: "Shoonya trades fetch failed",
      error: error?.response?.data || error.message,
    });
  }
};