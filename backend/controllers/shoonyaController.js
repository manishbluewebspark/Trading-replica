





import { shoonyaPost } from "../utils/shoonyaPost.js";
import User from "../models/userModel.js"
import unzipper from "unzipper";
import axios from 'axios'; 
import Order from "../models/orderModel.js"
import { Op } from "sequelize";
import { createHash } from "crypto";
import speakeasy from "speakeasy";

const SHOONYA_BASE_URL = "https://api.shoonya.com/NorenWClientTP";



export const shoonyaLoginWithTotp = async (req, res) => {
  try {

    // 1️⃣ Fetch user from database
    const user = await User.findOne({
      where: { id:req.userId },
      raw: true,
    });

    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found",
      });
    }

    // Extract values from user table
    const uid = user.kite_client_id;       // Shoonya Login ID
    const password = user.kite_pin;        // Shoonya password
    const totpSecret = user.kite_secret;   // Shoonya TOTP Base32 secret

    if (!uid || !password || !totpSecret) {
      return res.status(400).json({
        status: false,
        message: "Shoonya credentials missing in user profile",
      });
    }

    // 2️⃣ Generate 6-digit TOTP from Base32 secret
    const factor2 = speakeasy.totp({
      secret: totpSecret,
      encoding: "base32",
      digits: 6,
    });


    console.log('=============factor2============',factor2);
    



    // 3️⃣ Compute SHA-256 hashed password (Shoonya requirement)
    const pwdHash = createHash("sha256").update(password).digest("hex");

    // 4️⃣ Compute Shoonya appkey (uid|apiKey)
    const apiKey = user.kite_key
    const appkeyRaw = `${uid}|${apiKey}`;
    const appkey = createHash("sha256").update(appkeyRaw).digest("hex");

    const vc = user.finavacia_vendor_code;
    const imei = user.finavacia_imei;

    // 5️⃣ Create payload for QuickAuth
    const loginPayload = {
      apkversion: "1.0.0",
      uid,
      pwd: pwdHash,
      factor2,
      vc,
      imei,
      source: "API",
      appkey,
    };

    // 6️⃣ POST request to Shoonya QuickAuth
    const jData = `jData=${JSON.stringify(loginPayload)}`;


    console.log('============jData==========',jData);
    

    const response = await axios.post(
      "https://api.shoonya.com/NorenWClientTP/QuickAuth",
      jData,
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    const data = response.data;


    console.log(data);
    


    // 7️⃣ Handle errors
    if (data.stat !== "Ok") {
      return res.status(400).json({
        status: false,
        message: data.emsg || "Shoonya login failed",
        data,
      });
    }

    // 8️⃣ Save susertoken to DB
   let updateUser =  await User.update(
      { 
        authToken: data.susertoken,
        angelLoginUser:true,
        angelLoginExpiry:new Date(Date.now() + 10 * 60 * 60 * 1000), // 10 hours

       },
      { where: { id: req.userId} }
    );

    return res.json({
      status: true,
      brokerName:'finvasia',
      message: "Shoonya login successful",
      token: data.susertoken,
      actid: data.actid,
      username: data.uname,
    });

  } catch (err) {
    console.error("Shoonya login error:", err);
    return res.status(500).json({
      status: false,
      message: "Unexpected error during Shoonya login",
      error: err.message,
    });
  }
};



export const finvasiaAppCredential = async (req, res) => {
  try {
    const userId = req.userId; // set by auth middleware

    const {
      clientId,    // Shoonya API KEY
      totpSecret,  // Shoonya TOTP secret
      apiKey,      // Shoonya UID (login id, e.g. FN169676)
      pin,         // Shoonya password / PIN
      imei,        // IMEI
      vc,          // Vendor code
    } = req.body;

    console.log("Finvasia credential payload:", req.body);

    // 1️⃣ Basic validation
    if (!userId) {
      return res.json({
        status: false,
        statusCode: 400,
        message: "Unauthorized: userId is missing",
      });
    }

    if (!clientId || !totpSecret || !apiKey) {
      return res.json({
        status: false,
        statusCode: 400,
        message: "clientId, apiKey (UID) and totpSecret are required",
      });
    }

    // 2️⃣ Find user by id
    const user = await User.findByPk(userId);

    if (!user) {
      return res.json({
        status: false,
        statusCode: 404,
        message: "User not found",
      });
    }

    // 3️⃣ Map frontend → DB fields

    user.kite_key = apiKey;           
    user.kite_client_id = clientId;  
    user.kite_pin = pin || null;    
    user.kite_secret = totpSecret;
   
    user.finavacia_imei = imei || null;
    user.finavacia_vendor_code = vc || null;

    await user.save();

    // 4️⃣ Response
    return res.json({
      status: true,
      statusCode: 200,
      message: "Finvasia (Shoonya) credentials saved successfully",
      data: {
        id: user.id,
        broker: "finvasia",
        uid: user.shoonya_uid,
        hasTotpSecret: !!user.shoonya_totp_secret,
        hasApiKey: !!user.shoonya_api_key,
      },
    });
  } catch (error) {
    console.error("finvasiaAppCredential error:", error);

    return res.json({
      status: false,
      statusCode: 500,
      message: "Failed to save Finvasia (Shoonya) app credentials",
      error: error.message,
    });
  }
};

export const getFinvasiaAppCredential = async (req, res) => {
  try {
    const userId = req.userId; // set by auth middleware

    if (!userId) {
      return res.json({
        status: false,
        statusCode: 400,
        message: "Unauthorized: userId missing",
      });
    }

    // 1️⃣ Find user
    const user = await User.findByPk(userId);

    if (!user) {
      return res.json({
        status: false,
        statusCode: 404,
        message: "User not found",
      });
    }

    // 2️⃣ Build response object
    const data = {
      clientId: user.kite_client_id || "",  // API key entered in form 1st
      totpSecret: user.kite_secret || "",  // Secret
      apiKey: user.kite_key || "",         // UID (login id)
      pin: user.kite_pin || "",            // PIN/Pwd
      imei: user.finavacia_imei || "",
      vc: user.finavacia_vendor_code || "",
    };

    const isEmpty =
      !data.clientId && !data.totpSecret && !data.apiKey && !data.pin &&
      !data.imei && !data.vc;

    return res.json({
      status: true,
      statusCode: 200,
      message: isEmpty
        ? "No Finvasia credential found"
        : "Finvasia credential loaded successfully",
      data,
    });
  } catch (error) {
    console.error("getFinavasiaAppCredential error:", error);

    return res.json({
      status: false,
      statusCode: 500,
      message: "Failed to fetch Finvasia (Shoonya) credentials",
      error: error.message,
    });
  }
};




export const getFinvasiaTradesDataUserPosition = async function (req, res) {
  try {

    const userId = req.userId; // assuming middleware se aa raha hai

    let userData = await User.findOne({
      where:{
        id:userId
      },
      raw:true
    })

    const uid = userData.kite_client_id; // Finvasia UID

    let finvasiaToken = userData.authToken
    
    const BASE_URL = process.env.SHOONYA_BASE_URL;

    /* -------------------------------
       COMMON API CALL HELPER
    --------------------------------*/
    const callShoonyaAPI = async (endpoint, payload) => {

        const body = `jKey=${finvasiaToken}&jData=${JSON.stringify({
          uid,
          actid: uid,
        })}`;

      const res = await axios.post(`${BASE_URL}/${endpoint}`, body, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });
      return res.data;
    };

    /* -------------------------------
       FETCH POSITIONS / ORDERS / TRADES
    --------------------------------*/
    const positionsRes = await callShoonyaAPI("PositionBook", {
      uid,
      actid: uid,
    });

    const ordersRes = await callShoonyaAPI("OrderBook", {
      uid,
    });

    const tradesRes = await callShoonyaAPI("TradeBook", {
      uid,
    });

    let positions = Array.isArray(positionsRes) ? positionsRes : [];
    const orders = Array.isArray(ordersRes) ? ordersRes : [];
    let trades = Array.isArray(tradesRes) ? tradesRes : [];


      const now = new Date();

      // IST time nikalna
      const hours = now.getHours();
      const minutes = now.getMinutes();

      // 3:20 PM ke baad condition
      const isAfter320 =
        hours > 15 || (hours === 15 && minutes >= 20);

        positions = isAfter320 ? [] : positions;

    if (!positions.length) {
      return res.json({
        status: true,
        statusCode: 200,
        message: "No Trade in User Position",
        onlineTrades: [],
        error: null,
      });
    }    

    /* -------------------------------
       BUILD ORDER → TRADE MAP
    --------------------------------*/
    const tradeMap = {};
    for (const t of trades) {
      if (!tradeMap[t.orderno]) {
        tradeMap[t.orderno] = t;
      }
    }

    /* -------------------------------
       MAP POSITIONS
    --------------------------------*/
    const mappedTrades = [];

    for (const p of positions) {
      const netQty = Number(p.netqty || 0);
      if (netQty === 0) continue;

      const quantity = Math.abs(netQty);
      const transaction_type = netQty > 0 ? "BUY" : "SELL";

      const matchedOrder = orders.find(
        (o) =>
          o.tsym === p.tsym &&
          o.trantype === transaction_type &&
          o.status === "COMPLETE"
      );

      const matchedTrade = matchedOrder
        ? tradeMap[matchedOrder.orderno]
        : null;

      mappedTrades.push({
        tradingsymbol: p.tsym || "-",
        exchange: p.exch || "-",
        transaction_type,
        product: p.prd || "-",
        average_price: Number(p.netavgprc || 0),
        quantity,
        order_id: matchedOrder?.orderno || "",
        trade_id: matchedTrade?.tradeid || "",
        uniqueorderid: matchedOrder?.orderno || "",
        transactiontype: transaction_type,
        ordertype: matchedOrder?.prctyp || "MARKET",
        producttype: p.prd || "-",
        fillprice: String(p.netavgprc || ""),
        price: String(p.netavgprc || ""),
        pnl: String(p.pnl || ""),
        cmp: String(p.ltp || ""),
        fillsize: quantity,
        orderid: matchedOrder?.orderno || "",
        status: "COMPLETE",
        instrumenttype: p.instname || "",
        orderstatus: matchedOrder?.status || "COMPLETE",
        text: "",
        updatetime:
          matchedTrade?.norentm ||
          matchedOrder?.exch_tm ||
          "",

        symboltoken: String(p.token || ""),
        createdAt: null,
        updatedAt: null,
      });
    }

    return res.json({
      status: true,
      statusCode: 200,
      message: "User Position Trades (Finvasia)",
      onlineTrades: mappedTrades,
    });
  } catch (error) {
    console.error("Finvasia Dashboard error:", error);
    return res.json({
      status: false,
      statusCode: 500,
      message: "Internal server error",
      error: error.message,
    });
  }
};



// -------------------------------
// POST FUNDS CONTROLLER
// -------------------------------
export const getShoonyaFunds = async (req, res) => {
  try {

    let susertoken = req.headers.angelonetoken;

    // 1️⃣ Fetch user from database
    const user = await User.findOne({
      where: { id: req.userId },
      raw: true,
    });

    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found",
      });
    }

    // Extract values from user table
    const uid = user.kite_client_id;       // Shoonya Login ID
  
    const url = `${SHOONYA_BASE_URL}/Limits`;

    // 👇 This object will become the JSON in jData
    const jData = {
      uid,    // e.g. "FN169676"
      actid:uid,  // e.g. "FN169676"
    };



    // ✅ Build raw x-www-form-urlencoded string like in their curl examples
    // const body = `jKey=${susertoken}&jData=${JSON.stringify(jData)}`;
   const body = `jKey=${user.authToken}&jData=${JSON.stringify(jData)}`;

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

  // const availableBalance =
  // Number(data.mr_eqt_a || 0) +
  // Number(data.mr_der_a || 0);
  //   console.log(availableBalance)

  const availableBalance = Number(data?.cash || 0) + Number(data?.payin || 0)

  let cashFund = {
  availablecash:   availableBalance  
};

    return res.json({
      status: true,
      message: "Funds (Limits) fetched successfully",
      // data: cashFund,
      data:cashFund
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







export const getShoonyaUserHolding = async (req, res) => {
  try {
    const token = req.headers.angelonetoken;

    // if (!token) {
    //   return res.json({
    //     status: false,
    //     statusCode: 401,
    //     message: "Finavasia access token missing in header ",
    //     error: null,
    //   });
    // }

    // 2️⃣ Compute start of TODAY in IST, convert to UTC ISO for string comparison
    const nowUtc = new Date();
    const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // +05:30

    // Convert current UTC -> IST
    const istNow = new Date(nowUtc.getTime() + IST_OFFSET_MS);
    istNow.setHours(0, 0, 0, 0); // start of day in IST (00:00:00)

    // Convert IST start-of-day back to UTC
    const startOfTodayUtc = new Date(istNow.getTime() - IST_OFFSET_MS);
    const startOfTodayIso = startOfTodayUtc.toISOString(); // e.g. "2025-12-10T00:00:00.000Z"

    console.log("🕒 startOfTodayUtc ISO:", startOfTodayIso);

    // 3️⃣ Get local COMPLETE orders older than today using filltime (stored as ISO string)
    const localOldOrders = await Order.findAll({
      where: {
        userId: req.userId,
        orderstatuslocaldb: "OPEN",
        filltime: {
          [Op.lt]: startOfTodayIso,  // only yesterday & older
        },
       
      },
       raw:true
    });

    return res.json({
      status: true,
      statusCode: 200,
      data: localOldOrders,
      message:
        "Successfully fetched holdings matching local COMPLETE orders (excluding today's filltime)",
    });

  } catch (error) {
    console.error("❌ getKiteHolding error:", error);
    return res.json({
      status: false,
      statusCode: 500,
      message: "Unexpected error occurred. Please try again.",
      data: null,
      error: error.message,
    });
  }
};









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
export const getShoonyaFunds1 = async (req, res) => {
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
      actid:uid,  // e.g. "FN169676"
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

     const uid = 'FN169676'
     const susertoken = "bd891d999db82152011ef31d99cddc3054d07d96b51d525e2f0cdcb3f66df310"


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
    

     let orderDetails = data.find((o) => String(o.norenordno) === '25121500600217');

     console.log("Finvasia orders raw:", orderDetails);

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
   
     const uid = 'FN169676'
     const susertoken = "b52d7d821bfdfef87e4e8cea09756353a78789e37d73222126c21136b1911f6f"

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

export const getShoonyaHoldings = async (req, res) => {
  try {
    const uid = "FN169676";
    const susertoken = "bd891d999db82152011ef31d99cddc3054d07d96b51d525e2f0cdcb3f66df310";
    const actid = uid;

    if (!uid || !actid || !susertoken) {
      return res.status(400).json({
        status: false,
        message: "uid, actid and susertoken are required",
      });
    }

    const url = `${SHOONYA_BASE_URL}/Holdings`;

    const jData = {
      uid,
      actid,
      prd: "C",    // 👈 MANDATORY FIELD FOR HOLDINGS
    };

    const body = `jKey=${susertoken}&jData=${JSON.stringify(jData)}`;

    console.log("Shoonya /Holdings body =>", body);

    const response = await axios.post(url, body, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    const data = response?.data;
    console.log("Finvasia holdings raw:", data);

    if (!data) {
      return res.status(400).json({
        status: false,
        message: "No response from Shoonya Holdings",
      });
    }

    if (!Array.isArray(data) && data.stat && data.stat !== "Ok") {
      return res.status(400).json({
        status: false,
        message: data?.emsg || "Unable to fetch holdings",
        raw: data,
      });
    }

    const holdings = Array.isArray(data) ? data : data?.holdingdata || [];

    return res.json({
      status: true,
      message: "Holdings fetched successfully",
      count: holdings.length,
      holdings,
      raw: data,
    });
  } catch (error) {
    console.error("Shoonya Holdings Error:", error?.response?.data || error);

    return res.status(500).json({
      status: false,
      message: "Shoonya holdings fetch failed",
      error: error?.response?.data || error.message,
    });
  }
};


export const getShoonyaPositions = async (req, res) => {
  try {
    const uid = "FN169676";
    const susertoken = "bd891d999db82152011ef31d99cddc3054d07d96b51d525e2f0cdcb3f66df310";
    const actid = uid;

    if (!uid || !actid || !susertoken) {
      return res.status(400).json({
        status: false,
        message: "uid, actid and susertoken are required",
      });
    }

    const url = `${SHOONYA_BASE_URL}/Positions`;

    const jData = {
      uid,
      actid,
    };

    const body = `jKey=${susertoken}&jData=${JSON.stringify(jData)}`;

    console.log("Shoonya /Positions body =>", body);

    const response = await axios.post(url, body, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    const data = response?.data;
    console.log("Finvasia positions raw:", data);

    if (!data) {
      return res.status(400).json({
        status: false,
        message: "No response from Shoonya Positions",
      });
    }

    if (!Array.isArray(data) && data.stat && data.stat !== "Ok") {
      return res.status(400).json({
        status: false,
        message: data?.emsg || "Unable to fetch positions",
        raw: data,
      });
    }

    const positions = Array.isArray(data) ? data : data?.positiondata || [];

    return res.json({
      status: true,
      message: "Positions fetched successfully",
      count: positions.length,
      positions,
      raw: data,
    });
  } catch (error) {
    console.error("Shoonya Positions Error:", error?.response?.data || error);

    return res.status(500).json({
      status: false,
      message: "Shoonya positions fetch failed",
      error: error?.response?.data || error.message,
    });
  }
};



export const getShoonyaTrades2 = async (req, res) => {
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

export const getShoonyaOrders2 = async (req, res) => {
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




// const SYMBOL_MASTER_URLS = {
//   NSE: "https://api.shoonya.com/NSE_symbols.txt",
//   BSE: "https://api.shoonya.com/BSE_symbols.txt",
//   NFO: "https://api.shoonya.com/NFO_symbols.txt",
//   MCX: "https://api.shoonya.com/MCX_symbols.txt",
// };

// const cache = new Map();
// const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

// function parseCSVToObjects(csv) {
//   const lines = csv
//     .split("\n")
//     .map(l => l.trim())
//     .filter(Boolean);

//   const headers = lines.shift().split(",");

//   return lines.map(line => {
//     const values = line.split(",");

//     const obj = {};
//     headers.forEach((header, index) => {
//       const key = header.trim();

//       let value = values[index]?.trim() ?? "";

//       // auto type conversion
//       if (!isNaN(value) && value !== "") {
//         value = Number(value);
//       }

//       obj[key] = value;
//     });

//     return obj;
//   });
// }

// async function loadInstruments(exch) {
//   const now = Date.now();
//   const cached = cache.get(exch);
//   if (cached && now - cached.at < CACHE_TTL_MS) return cached.data;

//   const res = await axios.get(SYMBOL_MASTER_URLS[exch], {
//     responseType: "text",
//     timeout: 60000,
//   });


//   const data = parseCSVToObjects(res.data);
//   // cache.set(exch, { at: now, data });
//   return data;
// }

// export const getShoonyaInstrumentsFull = async (req, res) => {
//   try {

//     console.log("=============finavasia instrument");
    
//     const exch = String(req.query.exch || "NSE").toUpperCase();
//     const instruments = await loadInstruments(exch);

//     // ✅ PURE LIST RESPONSE
//     return res.json(instruments);
//   } catch (err) {
//     return res.status(500).json({
//       error: err?.message || "Failed to load Finvasia instruments",
//     });
//   }
// };




const SYMBOL_MASTER_URLS = {
  NSE: "https://api.shoonya.com/NSE_symbols.txt.zip",
  BSE: "https://api.shoonya.com/BSE_symbols.txt.zip",
  NFO: "https://api.shoonya.com/NFO_symbols.txt.zip",
  MCX: "https://api.shoonya.com/MCX_symbols.txt.zip",
};

function parseCSVToObjects(csv) {
  const lines = csv
    .split("\n")
    .map(l => l.trim())
    .filter(Boolean);

  const headers = lines.shift().split(",");

  return lines.map(line => {
    const values = line.split(",");

    const obj = {};
    headers.forEach((header, index) => {
      const key = header.trim();

      let value = values[index]?.trim() ?? "";

      // auto type conversion
      if (!isNaN(value) && value !== "") {
        value = Number(value);
      }

      obj[key] = value;
    });

    return obj;
  });
}


async function downloadAndUnzipText(url) {
  // download zip as buffer
  const zipRes = await axios.get(url, {
    responseType: "arraybuffer",
    timeout: 120000,
  });

  // unzip: take first file in archive
  const directory = await unzipper.Open.buffer(Buffer.from(zipRes.data));
  const file = directory.files.find((f) => !f.path.endsWith("/") && f.path.includes(".txt"));

  if (!file) throw new Error(`No .txt found inside zip: ${url}`);

  const content = await file.buffer();
  return content.toString("utf-8");
}

async function loadInstruments(exch) {
  const url = SYMBOL_MASTER_URLS[exch];
  if (!url) throw new Error(`Unsupported exch '${exch}'. Use NSE/BSE/NFO/MCX`);

  const txt = await downloadAndUnzipText(url);
  return parseCSVToObjects(txt).map((row) => ({ exch, ...row }));
}

export const getShoonyaInstrumentsFull = async (req, res) => {
  try {
    const exch = req.query.exch ? String(req.query.exch).toUpperCase() : null;

    // If exch provided -> single file
    if (exch) {
      const instruments = await loadInstruments(exch);
      return res.json(instruments);
    }

    // Else -> all 4 files
    const results = await Promise.all(
      Object.keys(SYMBOL_MASTER_URLS).map((k) => loadInstruments(k))
    );

    return res.json(results.flat());
  } catch (err) {
    console.error("Finvasia instrument error:", err?.message);
    return res.status(500).json({
      status: false,
      message: err?.message || "Failed to load Finvasia instruments",
    });
  }
};