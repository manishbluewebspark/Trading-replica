
import axios from 'axios';
import Instrument from "../models/instrumentPostgreModel.js"
import Order from "../models/orderModel.js"
import sequelize from "../config/db.js"; // ✅ your Sequelize instance
import { QueryTypes } from "sequelize";
import { kite, setKiteAccessToken } from "../utils/kiteClient.js";
export async function ensureInstrumentTextIndexes() {
    try {

  await sequelize.query(`DROP INDEX IF EXISTS instruments_fts_idx;`)
        
        // Optional but handy for fuzzy search, keep it anyway
  await sequelize.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm;`);

  // Full-text GIN index over name + symbol + SyNum
  await sequelize.query(`
    CREATE INDEX IF NOT EXISTS instruments_fts_idx
    ON "Instruments"
    USING GIN (
      to_tsvector('simple',
        coalesce("name",'') || ' ' ||
        coalesce("token",'') || ' ' ||
        coalesce("symbol",'') || ' ' ||
         coalesce("nameStrickType",'') || ' ' ||
        coalesce("SyNum",'')
      )
    );
  `);

//   await sequelize.query(`CREATE INDEX IF NOT EXISTS instruments_token_idx
// ON "Instruments" ("token");`)

  console.log('done index in instrument');

    } catch (error) {

        console.log(error);
        
        
    }
}

// ensureInstrumentTextIndexes()


export const getInstrumentPostgre = async (req, res) => {

    try {

    
         const startTime = Date.now();

        //  const data = await Instrument.findAll({});

        const data = await sequelize.query(
        'SELECT "id", "token", "symbol", "name","lotsize","exch_seg","SyNum","syType" FROM "Instruments";',
        { type: QueryTypes.SELECT, raw: true }
      );

        const endTime = Date.now();

     return res.json({
            status: true,
            statusCode:200,
            data: data,
            message:'successfully fetch data'
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

   



}



// export const searchInstrumentPostgre = async (req, res) => {

//     try {

//         let query = req.params.id

//     const startTime = Date.now();

//     // 🔍 Use Full-Text Search on name + symbol + SyNum
//     const sql = `
//       SELECT *,
//         ts_rank(
//           to_tsvector('simple',
//             coalesce("name",'') || ' ' ||
//             coalesce("symbol",'') || ' ' ||
//             coalesce("SyNum",'')
//           ),
//           plainto_tsquery('simple', :query)
//         ) AS rank
//       FROM "Instruments"
//       WHERE to_tsvector('simple',
//               coalesce("name",'') || ' ' ||
//               coalesce("symbol",'') || ' ' ||
//               coalesce("SyNum",'')
//             ) @@ plainto_tsquery('simple', :query)
//       ORDER BY rank DESC, "updatedAt" DESC
//       LIMIT :limit
//     `;

//     const data = await sequelize.query(sql, {
//       replacements: { query },
//     });

//     const endTime = Date.now();
//     console.log(`🕒 Query took ${endTime - startTime} ms`);


//     console.log(data,'data search ');
    

//     return res.json({
//       status: true,
//       statusCode: 200,
//       message: "Successfully fetched data",
//       data,
//     });


//     } catch (error) {

//         console.log(error);
        
        
//          return res.json({
//             status: false,
//             statusCode:500,
//             message: "Unexpected error occurred. Please try again.",
//             data:null,
//             error: error.message,
//         });

//     }

   



// }

// export const searchInstrumentPostgre = async (req, res) => {
//   try {
//     const q = (req.params.id || req.query.q || "").trim();
//     const limit = Math.min(parseInt(req.query.limit || "200", 10), 1000); // safe cap

//     if (!q) {
//       return res.status(400).json({
//         status: false,
//         statusCode: 400,
//         message: "Search query is required (use /:id or ?q=)",
//         data: null,
//       });
//     }

//     const startTime = Date.now();

//     const sql = `
//       SELECT *,
//         ts_rank(
//           to_tsvector('simple',
//             coalesce("name",'') || ' ' ||
//             coalesce("symbol",'') || ' ' ||
//             coalesce("SyNum",'')
//           ),
//           plainto_tsquery('simple', :q)
//         ) AS rank
//       FROM "Instruments"
//       WHERE to_tsvector('simple',
//               coalesce("name",'') || ' ' ||
//               coalesce("symbol",'') || ' ' ||
//               coalesce("SyNum",'')
//             ) @@ plainto_tsquery('simple', :q)
//       ORDER BY rank DESC, "updatedAt" DESC
//       LIMIT :limit
//     `;

//     const data = await sequelize.query(sql, {
//       replacements: { q, limit },        // ✅ provide both named params
//       type: QueryTypes.SELECT,           // ✅ get rows directly
//     });

//     const endTime = Date.now();
//     console.log(`🕒 Query took ${endTime - startTime} ms`);

//     return res.json({
//       status: true,
//       statusCode: 200,
//       message: "Successfully fetched data",
//       data,
//     });
//   } catch (error) {
//     console.error(error);
//     return res.json({
//       status: false,
//       statusCode: 500,
//       message: "Unexpected error occurred. Please try again.",
//       data: null,
//       error: error.message,
//     });
//   }
// };


export const searchInstrumentPostgre = async (req, res) => {
  try {

    const q = (req.params.id || req.query.q || "").trim();

    const limit = Math.min(parseInt(req.query.limit || "200", 10), 1000);

    if (!q) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: "Search query is required (use /:id or ?q=)",
        data: null,
      });
    }

    const startTime = Date.now();

    const sql = `
      SELECT *,
        ts_rank(
          to_tsvector('simple',
            coalesce("name",'') || ' ' ||
            coalesce("token",'') || ' ' ||        -- ✅ include token
            coalesce("symbol",'') || ' ' ||
             coalesce("nameStrickType",'') || ' ' ||
            coalesce("SyNum",'')
          ),
          plainto_tsquery('simple', :q)
        ) AS rank
      FROM "Instruments"
      WHERE
        -- ✅ FTS over name+token+symbol+SyNum (matches your GIN index expr)
        to_tsvector('simple',
          coalesce("name",'') || ' ' ||
          coalesce("token",'') || ' ' ||        -- ✅ include token
          coalesce("symbol",'') || ' ' ||
          coalesce("nameStrickType",'') || ' ' ||
          coalesce("SyNum",'')
        ) @@ plainto_tsquery('simple', :q)

        -- ✅ helpful fallbacks when searching pure token values
        OR "token" = :q
        OR "token" ILIKE '%' || :q || '%'
      ORDER BY rank DESC NULLS LAST, "updatedAt" DESC
      LIMIT :limit
    `;

    const data = await sequelize.query(sql, {
      replacements: { q, limit },
      type: QueryTypes.SELECT,
    });

    const endTime = Date.now();
  

    return res.json({ status: true, statusCode: 200, message: "Successfully fetched data", data });
  } catch (error) {
    console.error(error);
    return res.json({ status: false, statusCode: 500, message: "Unexpected error occurred. Please try again.", data: null, error: error.message });
  }
};


export const getPerticularInstruments = async (req, res) => {
    try {

        const reqData = JSON.stringify({
            "exchange": req.body.exchange,
            "tradingsymbol": req.body.tradingsymbol,
            "symboltoken": req.body.symboltoken,
        });

        var config = {
        method: 'post',
        url: 'https://apiconnect.angelone.in/order-service/rest/secure/angelbroking/order/v1/getLtpData',
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

        const {data} = await axios(config);

         if(data.status==true) {

            return res.json({
            status: true,
            statusCode:200,
            data: data.data,
            message:'successfully fetch data'
        });

         }else{

        return res.json({
            status: false,
            statusCode:data.errorcode,
            message: "Unexpected error occurred. Please try again.",
            data:null,
            error: data.message,
        });
    }
        
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


export const getAllInstruments = async (req, res) => {
    try {
  
        const start = Date.now();

        const response = await axios.get(
              "https://margincalculator.angelbroking.com/OpenAPI_File/files/OpenAPIScripMaster.json"
            );

    const end = Date.now();
    const duration = end - start;

   
    

        let data =  response.data 

        // data = data.slice(0, 100000);

        

        return res.json({
            status: true,
            statusCode:200,
            data: data,
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





// kite apis

export const getKiteTradesData = async (req, res) => {
  try {

     let token = 'Qu797V7FH5TyKfcZ1o7WJnnD18kY8rVw'

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

export const getKiteAllOrders = async (req, res) => {
    try {

      let token = 'Qu797V7FH5TyKfcZ1o7WJnnD18kY8rVw'
   
        await setKiteAccessToken(token);

        const orders = await kite.getOrders();

        console.log(orders,'kite orders');
        

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

export const placeKiteAllOrders = async (req, res) => {
    try {

      let token = 'FGSVWpSBt9ih95bv3g6yxzxYKdsHhrwi'
   
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

export const getKiteFunds = async (req, res) => {
  try {
    
    // let token = req.headers.angelonetoken;

     let token = 'Qu797V7FH5TyKfcZ1o7WJnnD18kY8rVw'

    await setKiteAccessToken(token);

    // 1️⃣ Get Funds
    const funds = await kite.getMargins();

    console.log(funds,'fund apis');
    

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

     console.log(error,'error fund apis');
    return res.json({
      status: false,
      statusCode: 500,
      message: "Error fetching kite funds & orders",
      error: error.message,
    });
  }
};


export const getKiteProfile = async (req, res) => {
  try {

   const token = '1v82ezGaMadU9UpHPtI4GfJA6zTDIzzp';

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

      let token = "FGSVWpSBt9ih95bv3g6yxzxYKdsHhrwi";

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