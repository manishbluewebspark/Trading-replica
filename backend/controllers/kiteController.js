
import Order from "../models/orderModel.js"
import User from "../models/userModel.js"
import { kite, setKiteAccessToken } from "../utils/kiteClient.js";



export const kiteLogin = (req, res) => {
  try {

    const loginUrl = kite.getLoginURL();

    console.log(loginUrl,'loginUrl');
    

    // Return JSON response instead of redirect
    return res.status(200).json({
      status: true,
      message: "Kite login URL generated successfully",
      data: {
        loginUrl: loginUrl
      }
    });
    
  } catch (error) {
    console.error('Kite login URL generation error:', error);
    return res.status(500).json({
      status: false,
      message: "Failed to generate login URL",
      error: error.message
    });
  }
};

export const kiteCallback = async (req, res) => {
  
  const { request_token } = req.query;

  console.log(request_token,'request_token kiteCallback');
  

  if (!request_token) {

    return res.status(400).json({ 
      status: false,
      message: "Missing request_token" 
    });
  }

  try {
    
    const session = await kite.generateSession(
      request_token,
      process.env.KITE_API_SECRET
    );


    console.log(session,'kite user login session');
    

   
    // 1️⃣ Find user by email
    const user = await User.findOne({
      where: { email:session.email }
    });

     if (!user) {

       return res.redirect(
      `${process.env.FRONTEND_URL}/kite-login-failed?error : User not found`
    );
    }

    // 2️⃣ Update tokens
    await user.update({
      authToken:session.access_token,
      feedToken:session.public_token,
      refreshToken:session.enctoken
    });
    
    // Redirect to frontend success page
    return res.redirect(
      `${process.env.FRONTEND_URL}/dashboard?access_token=${session.access_token}`
    );
    
  } catch (err) {
    console.error("❌ Zerodha Auth Error:", err);
    return res.redirect(
      `${process.env.FRONTEND_URL}/kite-login-failed?error=${err.message}`
    );
  }
};

export const getKiteAllInstruments = async (req, res) => {
    try {
   
    const instruments = await kite.getInstruments();

        return res.json({
            status: true,
            statusCode:200,
            data: instruments,
            message:'successfully fetch data'
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


export const getKiteFunds = async (req, res) => {
  try {
    
    let token = req.headers.angelonetoken;

    //  let token = 'B9XoC71zzoJ3J56xVPSUEHUWLGlUugMU'

    await setKiteAccessToken(token);

    // 1️⃣ Get Funds
    const funds = await kite.getMargins();


    const availableCash =
      (funds?.equity?.net || 0) 

    // 2️⃣ Get all orders
    let orders = await kite.getOrders();

    // Sort → latest first
    orders.sort(
      (a, b) => new Date(b.order_timestamp) - new Date(a.order_timestamp)
    );

    // 3️⃣ Map Zerodha fields → your frontend structure
    const mappedOrders = orders.map((o) => ({
      tradingsymbol: o.tradingsymbol,
      orderid: o.order_id,
      transactiontype: o.transaction_type,
      lotsize: o.quantity,
      averageprice: o.average_price,
      orderstatus: o.status,
      ordertime: o.order_timestamp,
    }));

    // 4️⃣ Get last 5 for dashboard
    const recentFiveOrders = mappedOrders.slice(0, 5);

    // 5️⃣ Final response
    return res.json({
      status: true,
      statusCode: 200,
      message: "Funds & orders retrieved successfully",
      data: {
        raw: funds,
        availablecash: availableCash,
      },
      totalOrders: mappedOrders,   // full order list
      recentOrders: recentFiveOrders, // last 5
    });

  } catch (error) {

    return res.json({
      status: false,
      statusCode: 500,
      message: "Error fetching kite funds & orders",
      error: error.message,
    });
  }
};

export const getTradeDataForKiteDeshboard = async function (req, res, next) {
  try {

    let totalBuyLength = 0;

    const kiteToken = req.headers.angelonetoken;
    
    if (!kiteToken) {
      return res.json({
        status: false,
        statusCode: 401,
        message: "Login in Broker Account (AngelOne or Kite)",
        error: null,
      });
    }

   
      await setKiteAccessToken(kiteToken);

      const trades = await kite.getTrades();

      if (!Array.isArray(trades) || trades.length === 0) {
        return res.json({
          status: true,
          statusCode: 200,
          message: "No Kite trades found",
          data: [],
          pnl: 0,
          totalTraded: 0,
          totalOpen: 0,
        });
      }

      const toMoney = (n) => Math.round(n * 100) / 100;

      function calculatePnL(orders) {
        const grouped = {};

        for (const t of orders) {
          if (!grouped[t.tradingsymbol]) grouped[t.tradingsymbol] = [];
          grouped[t.tradingsymbol].push(t);
        }

        const results = [];

        for (const [symbol, list] of Object.entries(grouped)) {
          const buys = list.filter((o) => o.transaction_type === "BUY");
          const sells = list.filter((o) => o.transaction_type === "SELL");

          let totalBuyQty = 0,
            totalBuyValue = 0;
          buys.forEach((b) => {
            totalBuyQty += b.quantity;
            totalBuyValue += b.quantity * b.average_price;
          });

          let totalSellQty = 0,
            totalSellValue = 0;
          sells.forEach((s) => {
            totalSellQty += s.quantity;
            totalSellValue += s.quantity * s.average_price;
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

      let totalBuy = 0,
        totalSell = 0;

      trades.forEach((t) => {
        if (t.transaction_type === "BUY") {
          totalBuy += t.quantity * t.average_price;
          totalBuyLength++;
        } else if (t.transaction_type === "SELL") {
          totalSell += t.quantity * t.average_price;
        }
      });

      const openCount = await Order.count({
        where: {
          userId: req.userId,
          orderstatuslocaldb: "OPEN",
        },
      });

      return res.json({
        status: true,
        statusCode: 200,
        broker: "Kite",
        message: "Kite tradebook fetched",
        data: pnlData,
        pnl: totalSell - totalBuy,
        totalTraded: totalBuyLength,
        totalOpen: openCount,
      });
    

  } catch (error) {
    console.error("Dashboard error:", error);
    return res.json({
      status: false,
      statusCode: 500,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const getKiteAllOrders = async (req, res) => {
    try {

       const token = req.headers.angelonetoken;
   
        await setKiteAccessToken(token);

        const orders = await kite.getOrders();

        return res.json({
            status: true,
            statusCode:200,
            data: orders,
            message:'successfully fetch data'
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

export const getKiteProfile = async (req, res) => {
  try {

    const token = req.headers.angelonetoken;

    await setKiteAccessToken(token);

    // Get funds / margin details
    const profile = await kite.getProfile(); // or getMargins("equity")  

    return res.json({
      status: true,
      statusCode: 200,
      message: "Profile retrieved successfully",
      data: profile,
    });

  } catch (error) {
    return res.json({
      status: false,
      statusCode: 500,
      message: "Error fetching funds",
      error: error.message,
    });
  }
};

export const getKiteProfile2 = async function (req,res,next) {
    try {

    const token = req.headers.angelonetoken;

      let apiKey = 'veh80gz86tmw4e9v'

        const response = await axios.get('https://api.kite.trade/user/profile', {
            headers: {
                'X-Kite-Version': '3',
                'Authorization': `token ${apiKey}:${token}`
            }
        });

  return res.json({
      status: true,
      statusCode: 200,
      message: "Profile retrieved successfully",
      data: response.data.data,
    });


    } catch (error) {
        console.error('Error fetching profile:', error.response?.data || error.message);
        throw error;
    }
}

export const getKiteTradesData = async (req, res) => {
  try {

      const token = req.headers.angelonetoken;

    await setKiteAccessToken(token);

    const orders = await kite.getOrders();

    // Fetch trades for each order
    const ordersWithTrades = await Promise.all(
      orders.map(async (order) => {
        let trades = [];
        try {
          trades = await kite.getOrderTrades(order.order_id); // fetch trade data
        } catch (err) {
          console.log(`Failed to fetch trades for ${order.order_id}`, err.message);
        }
        return { ...order, trades };
      })
    );

    return res.json({
      status: true,
      statusCode: 200,
      data: ordersWithTrades,
      message: 'Successfully fetched orders with trades',
    });

  } catch (error) {
    return res.json({
      status: false,
      statusCode: 500,
      message: "Unexpected error occurred. Please try again.",
      data: null,
      error: error.message,
    });
  }
};

export const placeKiteAllOrders = async (req, res) => {
    try {

       const token = req.headers.angelonetoken;
   
        await setKiteAccessToken(token);

        const {
          exchange = "NSE",
          tradingsymbol,          // e.g. "SBIN"
          transaction_type,       // "BUY" | "SELL"
          quantity,               // e.g. 1, 10, etc.
          product = "CNC",        // CNC / MIS / NRML
          order_type = "MARKET",  // MARKET / LIMIT / SL / SL-M
          price = 0,              // required for LIMIT
          validity = "DAY",       // DAY / IOC
          disclosed_quantity = 0,
          trigger_price = 0,
          squareoff = 0,
          stoploss = 0,
          trailing_stoploss = 0,
          variety = "regular",    // regular / amo / bo / co (if enabled)
        } = req.body;

        if (!tradingsymbol || !transaction_type || !quantity) {
      return res.status(400).json({
        status: false,
        message: "tradingsymbol, transaction_type and quantity are required",
      });
    }

    const orderParams = {
      exchange,
      tradingsymbol,
      transaction_type,
      quantity,
      product,
      order_type,
      price,
      validity,
      disclosed_quantity,
      trigger_price,
      squareoff,
      stoploss,
      trailing_stoploss,
    };

    console.log("🔹 Placing Zerodha order:", { variety, orderParams });

    const response = await kite.placeOrder(variety, orderParams);

  
    return res.json({
      statusCode:200,
      status: true,
      message: "Order placed successfully",
      data: response, // contains order_id, etc.
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