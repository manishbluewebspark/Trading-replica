import { fyersModel } from "fyers-api-v3";
import Order from "../models/orderModel.js"; // update your model path
import User from "../models/userModel.js"; // update your model path


export const updateFyersToken = async (req, res) => {
  try {
    const { userId, angelToken } = req.body;

    if (!userId || !angelToken) {
      return res.status(400).json({
        status: false,
        message: "userId and angelToken are required",
      });
    }

    // 1️⃣ Find user by ID
    const user = await User.findOne({ where: { id: userId } });

    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found",
      });
    }

    // 2️⃣ Update required fields
    user.authToken = angelToken;
    user.angelLoginUser = true;

    // 3️⃣ Save changes
    await user.save();

    return res.status(200).json({
      status: true,
      message: "Angel token updated successfully",
      data: user,
    });
  } catch (err) {
    return res.status(500).json({
      status: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

export const fyersLogin = async (req, res) => {
  try {
    const client_id = process.env.fyers_app_id; 
    const redirect_uri = process.env.fyers_redirect_uri;

    const fyers = new fyersModel({
            path: "logs/",
            enableLogging: true,
            });


    // Set app config
    fyers.setAppId(client_id);
    fyers.setRedirectUrl(redirect_uri);

     const url = fyers.generateAuthCode();

    
      // Return JSON response instead of redirect
    return res.status(200).json({
      status: true,
      message: "Fyers login URL generated successfully",
      data: {
        loginUrl: url
      }
    });
  } catch (e) {
    console.log("Fyers error:", e);
    return res.status(500).json({ error: e.message });
  }
};


export const callbackFyers = async (req, res, next) => {
  try {
    const client_id = process.env.fyers_app_id;
    const secret_key = process.env.fyers_secret_key;


    const { auth_code } = req.query;

    if (!auth_code) {

      return res.status(400).json({ message: "auth_code missing" });
    }

    // Initialize
    const fyers = new fyersModel({
      path: "logs/",
      enableLogging: true,
    });

    // REQUIRED — Set APP ID & Redirect URI
    fyers.setAppId(client_id);
    // fyers.setRedirectUrl(redirect_uri);

    // Now call access token API
    const response = await fyers.generate_access_token({
      client_id: client_id,
      secret_key: secret_key,
      auth_code: auth_code,
    });

    if (response.s === "ok") {
      // Set token in SDK
      fyers.setAccessToken(response.access_token);



       return res.redirect(
      `${process.env.FRONTEND_URL}/dashboard?access_token=${response.access_token}`
    );

    } else {
      return res.status(400).json({
        status: false,
        message: "Failed to generate access token",
        error: response,
      });
    }
  } catch (error) {
    
    return res.status(500).json({ error: error.message });
  }
};


export const fyersProfile = async (req, res) => {
  try {

    const accessToken = req.headers.angelonetoken
    
    if (!accessToken) {
      return res.status(400).json({ error: "Access token missing" });
    }

    const fyers = new fyersModel({
      path: "logs/",
      enableLogging: true,
    });

    fyers.setAppId(process.env.fyers_app_id);
    fyers.setAccessToken(accessToken);

    const profile = await fyers.get_profile();

    console.log(profile,'fyers profile');

    return res.status(200).json({
      status: true,
      message: "Fyers profile fetched successfully",
      data: profile,
    });

  } catch (e) {
    console.log("Fyers error:", e);
    return res.status(500).json({ error: e.message });
  }
};


export const fyersFunds = async (req, res) => {
  try {

      const accessToken = req.headers.angelonetoken

      // const accessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOlsiZDoxIiwiZDoyIiwieDowIiwieDoxIiwieDoyIl0sImF0X2hhc2giOiJnQUFBQUFCcEpWR0hXY3ZhRmluVlVNOHVJMUw0b0xuNVduNzNLckRfY2EyLXlUR1lGbnpMYkdDRnZpUV9XZVd4aDFYS0E4R0pqaWZxNEtWN3dqU2FrbHVEeWRDM2Y0SFJBNlVwSWNmMWxiWVhUM21ESS0xdzdJVT0iLCJkaXNwbGF5X25hbWUiOiIiLCJvbXMiOiJLMSIsImhzbV9rZXkiOiIwNDQ2OWY0NWUwZmRiMDExODdiMTIxNzMzOTgxMjk5ZWE2YzMxYTBkN2YzZjRiMjllNzBjYjNmZiIsImlzRGRwaUVuYWJsZWQiOiJOIiwiaXNNdGZFbmFibGVkIjoiTiIsImZ5X2lkIjoiWU0yNDMwMCIsImFwcFR5cGUiOjEwMCwiZXhwIjoxNzY0MTE3MDAwLCJpYXQiOjE3NjQwNTMzODMsImlzcyI6ImFwaS5meWVycy5pbiIsIm5iZiI6MTc2NDA1MzM4Mywic3ViIjoiYWNjZXNzX3Rva2VuIn0.tSyq_90UnlnP3sRRxFYNw9mw1MSNuCRGKLHzKCQU5D4'

    if (!accessToken) {
      return res.status(400).json({ error: "Access token missing" });
    }

    const fyers = new fyersModel({
      path: "logs/",
      enableLogging: true,
    });

    fyers.setAppId(process.env.fyers_app_id);
    fyers.setAccessToken(accessToken);

    const funds = await fyers.get_funds();

   
    
     // 5️⃣ Final response
    return res.json({
      status: true,
      statusCode: 200,
      message: "Funds & orders retrieved successfully",
      data: {
        raw: funds,
        availablecash: funds.fund_limit[0].equityAmount,
      },
      totalOrders: [],   // full order list
      recentOrders: [], // last 5
    });

  } catch (error) {

    console.log("FYERS FUND ERROR:", error);

    return res.status(500).json({ error: error.message });
  }
};


export const getTradeDataForFyersDashboard = async (req, res) => {
  try {
    
    let totalBuyLength = 0;

    const fyersToken = req.headers.angelonetoken

    if (!fyersToken) {
      return res.json({
        status: false,
        statusCode: 401,
        message: "Login in Broker Account (FYERS)",
        error: null,
      });
    }

    // INIT FYERS
    const fyers = new fyersModel({
      path: "logs/",
      enableLogging: true,
    });

    fyers.setAppId(process.env.fyers_app_id);
    fyers.setAccessToken(fyersToken);

    // 📌 GET FYERS TRADEBOOK (Completed orders)
    const tradeRes = await fyers.get_tradebook();

    if (tradeRes.s !== "ok" || !tradeRes.data) {
      return res.json({
        status: true,
        statusCode: 200,
        message: "No FYERS trades found",
        data: [],
        pnl: 0,
        totalTraded: 0,
        totalOpen: 0,
      });
    }

    const trades = tradeRes.data;

    // If no trades
    if (!Array.isArray(trades) || trades.length === 0) {
      return res.json({
        status: true,
        statusCode: 200,
        message: "No FYERS trades found",
        data: [],
        pnl: 0,
        totalTraded: 0,
        totalOpen: 0,
      });
    }

    // UTILITY
    const toMoney = (n) => Math.round(n * 100) / 100;

    // ----------------------------------------------
    // 💹 PNL CALCULATION EXACT LIKE KITE
    // ----------------------------------------------
    function calculatePnL(orders) {
      const grouped = {};

      for (const t of orders) {
        if (!grouped[t.symbol]) grouped[t.symbol] = [];
        grouped[t.symbol].push(t);
      }

      const results = [];

      for (const [symbol, list] of Object.entries(grouped)) {
        const buys = list.filter((o) => o.side === 1);  // BUY
        const sells = list.filter((o) => o.side === -1); // SELL

        let totalBuyQty = 0,
          totalBuyValue = 0;
        buys.forEach((b) => {
          totalBuyQty += b.qty;
          totalBuyValue += b.qty * b.tradedPrice;
        });

        let totalSellQty = 0,
          totalSellValue = 0;
        sells.forEach((s) => {
          totalSellQty += s.qty;
          totalSellValue += s.qty * s.tradedPrice;
        });

        if (totalBuyQty > 0 && totalSellQty > 0) {
          const matchedQty = Math.min(totalBuyQty, totalSellQty);
          const buyAvg = totalBuyValue / totalBuyQty;
          const sellAvg = totalSellValue / totalSellQty;
          const pnl = (sellAvg - buyAvg) * matchedQty;

          results.push({
            label: symbol,
            win: toMoney(buyAvg),
            loss: toMoney(sellAvg),
            quantity: matchedQty,
            pnl: toMoney(pnl),
          });
        }
      }

      return results;
    }

    const pnlData = calculatePnL(trades);

    // ----------------------------------------------
    // 🔢 TOTAL BUY & SELL VALUE
    // ----------------------------------------------
    let totalBuy = 0,
      totalSell = 0;

    trades.forEach((t) => {
      if (t.side === 1) {
        totalBuy += t.qty * t.tradedPrice;
        totalBuyLength++;
      } else if (t.side === -1) {
        totalSell += t.qty * t.tradedPrice;
      }
    });

    // ----------------------------------------------
    // 🔥 OPEN ORDERS COUNT FROM LOCAL DB
    // ----------------------------------------------
    const openCount = await Order.count({
      where: {
        userId: req.userId,
        orderstatuslocaldb: "OPEN",
      },
    });

    return res.json({
      status: true,
      statusCode: 200,
      broker: "Fyers",
      message: "Fyers tradebook fetched",
      data: pnlData,
      pnl: totalSell - totalBuy,
      totalTraded: totalBuyLength,
      totalOpen: openCount,
    });

  } catch (error) {
    console.error("FYERS Dashboard error:", error);
    return res.json({
      status: false,
      statusCode: 500,
      message: "Internal server error",
      error: error.message,
    });
  }
};




export const getFyersUserHolding = async (req, res) => {
  try {
    const token = req.headers.angelonetoken;

    if (!token) {
      return res.json({
        status: false,
        statusCode: 401,
        message: "Kite access token missing in header (angelonetoken)",
        error: null,
      });
    }

    return res.json({
      status: true,
      statusCode: 200,
      data: [], // ✅ only yesterday+old positions
      message: "No Holding Found",
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