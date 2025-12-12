// services/kite/placeKiteOrder.js

import { getKiteClientForUserId } from "../services/userKiteBrokerService.js";
import Order from "../models/orderModel.js";
import { Op } from "sequelize";
import { logSuccess, logError } from "../utils/loggerr.js";


const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const clean = (obj) =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));



function getKiteProductCode(type) {
  
  if (!type) return "";

  switch (type.toUpperCase()) {
    case "DELIVERY":
      return "CNC";     // Cash & Carry for equity

    case "CARRYFORWARD":
      return "NRML";    // F&O Carryforward (Normal)

    case "MARGIN":
      return "MTF";     // Margin Trading Facility (MTF)

    case "INTRADAY":
      return "MIS";     // MIS Intraday

    case "BO":
      return "MIS";     // Bracket orders use MIS internally

    default:
      return type.toUpperCase(); // fallback, safe
  }
}


function mapVarietyToKite(variety) {
  if (!variety) return "regular"; // default

  switch (variety.toUpperCase()) {
    case "NORMAL":
      return "regular"; // Regular order
    case "STOPLOSS":
      return "co"; // Cover order (SL)
    case "ROBO":
      return "iceberg"; // Bracket order (ROBO)
    default:
      return "regular"; // fallback
  }
}


export const placeKiteOrderTest = async (req,res,next) => {
  try {

    // 1) Set access token
  let kite = await getKiteClientForUserId(15)

    // ----------------------------------------
    // 4) PLACE ORDER IN KITE
    // ----------------------------------------
    let placeRes = {
      order_id:"1998326319347163136"
    }

    let newOrder = await Order.findOne(
      { where: { orderid: placeRes.order_id }}
    )

    console.log(newOrder,'newOrder');
    

    const orderid = placeRes.order_id;

    // ----------------------------------------
    // 5) GET ORDER DETAILS FROM KITE
    // ----------------------------------------
    let detailsData = {};
    try {
        
      const detailRes = await kite.getOrderTrades(orderid);

      console.log(detailRes,'detailRes');
      
    

      if (Array.isArray(detailRes) && detailRes.length > 0) {

       detailsData = await detailRes[0]
       
      }
    } catch (err) {
      
    return res.json({
      status: false,
      data: null,
      message: err.message,
      error:'1'
    });

    }

    // ----------------------------------------
    // 6) HANDLE BUY / SELL LOGIC
    // ----------------------------------------
    let finalStatus = "OPEN";
    let buyOrder
    let pnl = 0
    let buyTime = ''
    
    console.log(detailsData,'detailsData');
    
    let updateDB =  await newOrder.update({
      uniqueorderid:detailsData.exchange_order_id,
      averageprice:detailsData.average_price,
      lotsize:detailsData.quantity,
      symboltoken:newOrder.symboltoken,
      triggerprice:detailsData.average_price,
      price:detailsData.average_price,
      orderstatuslocaldb: finalStatus,
    });


    
    

    // ----------------------------------------
    // 8) (OPTIONAL) TRADES FETCH
    // ----------------------------------------
    try {
      const trades = await kite.getOrderTrades(orderid);

      console.log(trades,'trades');
      

      if (Array.isArray(trades) && trades.length > 0) {
        
        const t = await trades[0];

        console.log(t,'t');
        
         if(t.transaction_type==='BUY') {
             pnl = 0 ;
             buyTime = "NA";
         }

         console.log(t?.fill_timestamp,'this');
         

           // Update order
          await newOrder.update({
            tradedValue: t.average_price * Number(newOrder.quantity),
            fillprice: t.average_price,
            fillsize: newOrder.quantity,
            fillid: t.trade_id,
            filltime: t?.fill_timestamp
              ? new Date(t.fill_timestamp).toISOString()
              : null,
            status: "COMPLETE",
            pnl: pnl,

          });

    return res.json({
      status: true,
      data: null,
      message: 'update done',
  })
      }else{

        
      }

    } catch (err) {
    return res.json({
      status: false,
      data: null,
      message: err.message,
       error:'2'
    });
        
    }

  } catch (err) {

  return res.json({
      status: false,
      data: null,
      message: err.message,
      error:'3'
  })

  }
};


async function getKiteOrderSnapshot(kite, orderid) {
  // 1️⃣ Fetch order status (reliable even when no trades)
  const orders = await kite.getOrders();
  const order = Array.isArray(orders)
    ? orders.find((o) => String(o.order_id) === String(orderid))
    : null;

  if (!order) return null;

  // 2️⃣ Trades may be empty (not an error)
  let trades = [];
  try {
    const tr = await kite.getOrderTrades(orderid);
    if (Array.isArray(tr)) trades = tr;
  } catch {
    // ignore trades error for snapshot
  }

  // 3️⃣ Compute avg price & filled qty safely
  let avgPrice = Number(order.average_price || 0);
  let filledQty = Number(order.filled_quantity || 0);

  if (trades.length > 0) {
    const totalValue = trades.reduce(
      (s, t) => s + Number(t.price || t.average_price || 0) * Number(t.quantity || 0),
      0
    );
    const totalQty = trades.reduce((s, t) => s + Number(t.quantity || 0), 0);
    if (totalQty > 0) avgPrice = totalValue / totalQty;
    filledQty = totalQty;
  }

  return {
    status: order.status, // OPEN | COMPLETE | REJECTED | CANCELLED
    exchange_order_id: order.exchange_order_id ?? null,
    average_price: avgPrice,
    filled_quantity: filledQty,
    trigger_price: Number(order.trigger_price || 0),
    order,
    trades,
  };
}

// new code for testing
export const placeKiteOrder = async (user, reqInput, startOfDay, endOfDay, req) => {
  try {
    // -------------------------------
    // 1️⃣ Create Kite instance
    // -------------------------------
    const kite = await getKiteClientForUserId(user.id);
    logSuccess(req, { msg: "kite instance created" });

    // -------------------------------
    // 2️⃣ Resolve mappings
    // -------------------------------
    const kiteProductType = await getKiteProductCode(reqInput.productType);
    const kiteVariety = await mapVarietyToKite(reqInput.variety);

    logSuccess(req, {
      kiteProductType,
      kiteVariety,
      msg: "kite mappings resolved",
    });

    // -------------------------------
    // 3️⃣ Save local PENDING order
    // -------------------------------
    const orderData = {
      symboltoken: reqInput.kiteToken || reqInput.token,
      variety: kiteVariety || "regular",
      tradingsymbol: reqInput.kiteSymbol || reqInput.symbol,
      instrumenttype: reqInput.instrumenttype,
      transactiontype: reqInput.transactiontype,
      exchange: reqInput.exch_seg,
      ordertype: reqInput.orderType,
      quantity: reqInput.quantity,
      producttype: kiteProductType,
      price: reqInput.price,
      orderstatuslocaldb: "PENDING",
      totalPrice: reqInput.totalPrice,
      actualQuantity: reqInput.actualQuantity,
      userId: user.id,
      broker: "kite",
      angelOneSymbol: reqInput.angelOneSymbol || reqInput.symbol,
      angelOneToken: reqInput.angelOneToken || reqInput.token,
      userNameId: user.username,
    };

    logSuccess(req, { orderData, msg: "before local save" });

    const newOrder = await Order.create(orderData);

    logSuccess(req, { localOrderId: newOrder.id, msg: "local order saved" });

    // -------------------------------
    // 4️⃣ Build Kite order payload
    // -------------------------------
    const orderParams = {
      exchange: reqInput.exch_seg,
      tradingsymbol: reqInput.kiteSymbol || reqInput.symbol,
      transaction_type: reqInput.transactiontype,
      quantity: Number(reqInput.quantity),
      product: kiteProductType,
      order_type: reqInput.orderType,
      price: reqInput.orderType === "MARKET" ? 0 : Number(reqInput.price || 0),
      market_protection: 5,
    };

    logSuccess(req, { orderParams, msg: "kite place payload ready" });

    // -------------------------------
    // 5️⃣ Place order in Kite
    // -------------------------------
    let placeRes;
    try {
      placeRes = await kite.placeOrder(orderData.variety, orderParams);
      logSuccess(req, { placeRes, msg: "kite placeOrder success" });
    } catch (err) {
      logError(req, err, { msg: "kite placeOrder failed" });

      await newOrder.update({
        orderstatuslocaldb: "FAILED",
        status: "FAILED",
        text: err.message,
        buyTime: new Date().toISOString(),
      });

      return {
        userId: user.id,
        broker: "Kite",
        result: "BROKER_REJECTED",
        message: err.message,
      };
    }

    const orderid = placeRes?.order_id;
    await newOrder.update({ orderid });

    logSuccess(req, { orderid, msg: "local updated with orderid" });

    // -------------------------------
    // 6️⃣ Snapshot (order status) with retry
    // -------------------------------
    let snapshot = null;
    for (let i = 0; i < 3; i++) {
      snapshot = await getKiteOrderSnapshot(kite, orderid);
      if (snapshot) break;
      await sleep(700);
    }

    if (!snapshot) {
      logSuccess(req, { orderid, msg: "snapshot not found yet, keeping PENDING" });
      return {
        userId: user.id,
        broker: "Kite",
        result: "SUCCESS",
        orderid,
      };
    }

    // Map Kite status → local status
    const kiteStatus = (snapshot.status || "").toUpperCase();
    const localStatus =
      kiteStatus === "COMPLETE" ? "COMPLETE" :
      kiteStatus === "REJECTED" || kiteStatus === "CANCELLED" ? "FAILED" :
      "OPEN";

    // -------------------------------
    // 7️⃣ Update local order from snapshot (safe)
    // -------------------------------
    await newOrder.update(
      clean({
        uniqueorderid: snapshot.exchange_order_id,
        averageprice: snapshot.average_price,
        lotsize: snapshot.filled_quantity,
        triggerprice: snapshot.trigger_price,
        price: snapshot.average_price,
        status: kiteStatus || null,
        orderstatuslocaldb: localStatus,
      })
    );

    logSuccess(req, {
      orderid,
      kiteStatus,
      localStatus,
      filledQty: snapshot.filled_quantity,
      msg: "local updated from kite snapshot",
    });

    // -------------------------------
    // 8️⃣ Optional: If trade exists, store fill details
    // -------------------------------
    if (Array.isArray(snapshot.trades) && snapshot.trades.length > 0) {
      const t = snapshot.trades[0];

      await newOrder.update(
        clean({
          tradedValue: Number(snapshot.average_price || 0) * Number(snapshot.filled_quantity || 0),
          fillprice: snapshot.average_price,
          fillsize: snapshot.filled_quantity,
          fillid: t.trade_id,
          filltime: t.fill_timestamp ? new Date(t.fill_timestamp).toISOString() : undefined,
        })
      );

      logSuccess(req, { orderid, msg: "local updated with trade info" });
    }

    return {
      userId: user.id,
      broker: "Kite",
      result: "SUCCESS",
      orderid,
    };
  } catch (err) {
    logError(req, err, { msg: "placeKiteOrder unexpected error" });

    return {
      userId: user.id,
      broker: "Kite",
      result: "ERROR",
      message: err.message,
    };
  }
};



// old code working

// export const placeKiteOrder = async (user, reqInput, startOfDay, endOfDay,req) => {
//   try {

//     console.log('req kite req ',reqInput);
//       console.log('req kite user ',user);

//     // 1) Set access token
//   let kite = await getKiteClientForUserId(user.id)

//   logSuccess(req, {kite:kite,msg:"kite instance "});

//   const kiteProductType = await getKiteProductCode( reqInput.productType);

//   logSuccess(req, {kiteProductType:kiteProductType,msg:"kite ProductType "});


//   const kiteVerity = await mapVarietyToKite(reqInput.variety)

//    logSuccess(req, {kiteVerity:kiteVerity,msg:"kite verity type"});


//    console.log('kiteVerity check point');
   


//     // ----------------------------------------
//     // 2) CREATE LOCAL PENDING ORDER
//     // ----------------------------------------
//     const orderData = {
//       symboltoken:reqInput.kiteToken||reqInput.token,
//       variety:kiteVerity || "regular",    // mistage in fields 
//       tradingsymbol:reqInput.kiteSymbol|| reqInput.symbol,
//       instrumenttype:reqInput.instrumenttype,
//       transactiontype: reqInput.transactiontype,
//       exchange: reqInput.exch_seg,
//       ordertype: reqInput.orderType,
//       quantity: reqInput.quantity,
//       producttype: kiteProductType,
//       price: reqInput.price,
//       orderstatuslocaldb: "PENDING",
//       totalPrice: reqInput.totalPrice,
//       actualQuantity: reqInput.actualQuantity,
//       userId: user.id,
//       broker:'kite',
//       angelOneSymbol:reqInput.angelOneSymbol||reqInput.symbol,
//       angelOneToken:reqInput.angelOneToken||reqInput.token,
//       userNameId: user.username,
//     };


//       logSuccess(req, {orderData:orderData,msg:"before save local object"});
    

//     const newOrder = await Order.create(orderData);

//        console.log('caldb save check point');


//    logSuccess(req, {newOrder:newOrder,msg:"local db save object"});
    

//     // ----------------------------------------
//     // 3) KITE PAYLOAD
//     // ----------------------------------------
//     const orderParams = {
//       exchange: reqInput.exch_seg,
//       tradingsymbol: reqInput.kiteSymbol|| reqInput.symbol,
//       transaction_type: reqInput.transactiontype,
//       quantity: Number(reqInput.quantity),
//       product:kiteProductType,  // DELIVERY.                // mistake in fields 
//       order_type: reqInput.orderType,
//       price: reqInput.price,
//       market_protection: 5 // protection points
//     };

//      logSuccess(req, {orderParams:orderParams,msg:"kite place object"});

//     // ----------------------------------------
//     // 4) PLACE ORDER IN KITE
//     // ----------------------------------------
//     let placeRes;
//     try {

//     placeRes = await kite.placeOrder(orderData.variety, orderParams);

//      logSuccess(req, {placeRes:placeRes,msg:"kite place order done"});

//     console.log(placeRes,'kite place order');
    

//     } catch (err) {

//       console.log(err,'kite place order');
      

//       await newOrder.update({ orderstatuslocaldb: "FAILED",status:"FAILED",text:err.message,
//         // filltime: new Date().toISOString().replace(/\.\d+Z$/, ".000Z"),
//         buyTime:new Date().toISOString().replace(/\.\d+Z$/, ".000Z"),
//        });

//       return {
//         userId: user.id,
//         broker: "Kite",
//         result: "BROKER_REJECTED",
//         message: err.message,
//       };
//     }

//     const orderid = placeRes.order_id;

//        logSuccess(req, {orderid:orderid,msg:"kite place order"});

//     // save order id
//     await newOrder.update({ orderid });


//     logSuccess(req, {msg:"local db with update orderid"});

//     // ----------------------------------------
//     // 5) GET ORDER DETAILS FROM KITE
//     // ----------------------------------------
//     let detailsData = {};
//     try {
        
//       const detailRes = await kite.getOrderTrades(orderid);
//         console.log('---------detailRes',orderid,detailRes)
//        logSuccess(req, {detailRes:detailRes,msg:"get order trade data"});
      
    

//       if (Array.isArray(detailRes) && detailRes.length > 0) {

//        detailsData = detailRes[0]

//        logSuccess(req, {detailsData:detailsData,msg:"get perticular order trade data"});
       
//       }
//     } catch (e) {
//        console.log(e,'get order histry');
//       // details optional
//     }

//     // ----------------------------------------
//     // 6) HANDLE BUY / SELL LOGIC
//     // ----------------------------------------
//     let finalStatus = "OPEN";
//     let buyOrder
    
//     // If SELL → close all BUY orders today
//     if (reqInput.transactiontype === "SELL") {

//        buyOrder = await Order.findOne({
//           where: {
//             userId: user.id,
//             tradingsymbol: reqInput.kiteSymbol|| reqInput.symbol,
//             exchange: reqInput.exch_seg,
//             quantity:reqInput.quantity,
//             transactiontype: "BUY",
//             status:"COMPLETE",
//             orderstatuslocaldb: "OPEN",
//             // createdAt: { [Op.between]: [startOfDay, endOfDay] },
//               },
//               raw: true
//             });
            

//         if (buyOrder) {

//         await Order.update(
//           { orderstatuslocaldb: "COMPLETE" },
//           { where: { id: buyOrder.id } }
//         );

//       }

//       finalStatus = "COMPLETE";
//     }


     
    

//     // ----------------------------------------
//     // 7) UPDATE LOCAL ORDER WITH FINAL STATUS
//     // ----------------------------------------


//     let objUpdate1 = await newOrder.update({
//       uniqueorderid:detailsData.exchange_order_id,
//       averageprice:detailsData.average_price,
//       lotsize:detailsData.quantity,
//       symboltoken:reqInput.kiteToken||reqInput.token,
//       triggerprice:detailsData.average_price,
//       price:detailsData.average_price,
//       orderstatuslocaldb: finalStatus,
//     });

//     logSuccess(req, {localdbUpdate:objUpdate1,msg:"local db update object"});
    

//     // ----------------------------------------
//     // 8) (OPTIONAL) TRADES FETCH
//     // ----------------------------------------
//     try {
//       const trades = await kite.getOrderTrades(orderid);

//        logSuccess(req, {trades:trades,msg:"get trade object"});
      

//       if (Array.isArray(trades) && trades.length > 0) {
        
//         const t = await trades[0];

//          logSuccess(req, {t:t,msg:"get trade t object"});
        

//         const buyPrice  = buyOrder?.fillprice     || 0;

//          logSuccess(req, {buyPrice:buyPrice,msg:"get buyPrice"});

//         const buySize   = buyOrder?.fillsize      || 0;

//         logSuccess(req, {buySize:buySize,msg:"get buySize"});

//         const buyValue  = buyOrder?.tradedValue   || 0;

//           logSuccess(req, {buyValue:buyValue,msg:"get buyValue"});

//          let buyTime  =   buyOrder?.filltime|| 'NA';

//           logSuccess(req, {buyTime:buyTime,msg:"get buyTime"});


          

//         // Calculate PNL safely
//         let  pnl = ( Number(reqInput.quantity) * t.average_price) - (buyPrice * buySize);

//         logSuccess(req, {pnl:pnl,msg:"get pnl"});

           
//          if(t.transaction_type==='BUY') {
//              pnl = 0 ;
//              buyTime = "NA";
//          }

       
         
         

//           // Update order
//         let updateObj2 =   await newOrder.update({
//             tradedValue: t.average_price * Number(reqInput.quantity),
//             fillprice: t.average_price,
//              fillprice: t.average_price,
//             fillsize: Number(reqInput.quantity),
//             fillid: t.trade_id,
//             price:t.average_price,
//             filltime: t?.fill_timestamp
//               ? t?.fill_timestamp.toISOString()
//               : null,
//             status: "COMPLETE",
//             pnl: pnl,
//             buyTime:buyTime,
//             buyprice: buyPrice,
//             buysize: buySize,
//             buyvalue: buyValue,
//           });

//         logSuccess(req, {updateObj2:updateObj2,msg:"local db final update"});
//       }else{

//           console.log(trades,'hhhy');
          

//       }

//     } catch (e) {
//         console.log(e,'get order trade');
        
//     }

//     return {
//       userId: user.id,
//       broker: "Kite",
//       result: "SUCCESS",
//       orderid,
//     };
//   } catch (err) {

   
//     console.log(err);
    
    
//     return {
//       userId: user.id,
//       broker: "Kite",
//       result: "ERROR",
//       message: err.message,
//     };
//   }
// };

export const placeKiteOrderLocalDb = async (user, reqInput, startOfDay, endOfDay) => {
  try {

    // 1) Set access token
    let kite = await getKiteClientForUserId(user.id)

    // ----------------------------------------
    // 2) CREATE LOCAL PENDING ORDER
    // ----------------------------------------
    const orderData = {
      symboltoken:reqInput.kiteToken||reqInput.token,
      variety:reqInput.variety || "regular",    // mistage in fields 
      tradingsymbol:reqInput.kiteSymbol|| reqInput.symbol,
      instrumenttype:reqInput.instrumenttype,
      transactiontype: reqInput.transactiontype,
      exchange: reqInput.exch_seg,
      ordertype: reqInput.orderType,
      quantity: reqInput.quantity,
      producttype: reqInput.productType,
      price: reqInput.price,
      orderstatuslocaldb: "PENDING",
      totalPrice: reqInput.totalPrice,
      actualQuantity: reqInput.actualQuantity,
      userId: user.id,
      broker:'kite',
      angelOneSymbol:reqInput.angelOneSymbol||reqInput.symbol,
      angelOneToken:reqInput.angelOneToken||reqInput.token,
      userNameId: user.username,
      buyOrderId:reqInput?.buyOrderId
    };


    console.log(orderData,'orderData');
    

    const newOrder = await Order.create(orderData);


    // ----------------------------------------
    // 3) KITE PAYLOAD
    // ----------------------------------------
    const orderParams = {
      exchange: reqInput.exch_seg,
      tradingsymbol: reqInput.kiteSymbol|| reqInput.symbol,
      transaction_type: reqInput.transactiontype,
      quantity: Number(reqInput.quantity),
      product:reqInput.productType,  // DELIVERY.                // mistake in fields 
      order_type: reqInput.orderType,
      price: reqInput.price,
      market_protection: 5 // protection points
    };

     console.log(orderParams,' db orderParams done');

    // ----------------------------------------
    // 4) PLACE ORDER IN KITE
    // ----------------------------------------
    let placeRes;
    try {

    placeRes = await kite.placeOrder(orderData.variety, orderParams);

    console.log(placeRes,'kite place order');
    

    } catch (err) {

      console.log(err,'kite place order');
      

      await newOrder.update({ orderstatuslocaldb: "FAILED",status:"FAILED",text:err.message,
        // filltime: new Date().toISOString().replace(/\.\d+Z$/, ".000Z"),
        buyTime:new Date().toISOString().replace(/\.\d+Z$/, ".000Z"),
       });

      return {
        userId: user.id,
        broker: "Kite",
        result: "BROKER_REJECTED",
        message: err.message,
      };
    }

    const orderid = placeRes.order_id;

    // save order id
    await newOrder.update({ orderid });

    // ----------------------------------------
    // 5) GET ORDER DETAILS FROM KITE
    // ----------------------------------------
    let detailsData = {};
    try {
        
       const detailRes = await kite.getOrderTrades(orderid);
    

      if (Array.isArray(detailRes) && detailRes.length > 0) {

        detailsData = detailRes[0]; // fallback
       
      }
    } catch (e) {
       console.log(e,'get order histry');
      // details optional
    }

    // ----------------------------------------
    // 6) HANDLE BUY / SELL LOGIC
    // ----------------------------------------
    let finalStatus = "OPEN";
    let buyOrder


    // If SELL → close all BUY orders today
    if (reqInput.transactiontype === "SELL") {

       buyOrder = await Order.findOne({
          where: {
            userId: user.id,
            status:"COMPLETE",
            orderstatuslocaldb: "OPEN",
            orderid:String(reqInput?.buyOrderId)
              },
              raw: true
            });
            

        if (buyOrder) {

        await Order.update(
          { orderstatuslocaldb: "COMPLETE" },
          { where: { orderid: reqInput?.buyOrderId } }
        );

      }

      finalStatus = "COMPLETE";
    }

    // ----------------------------------------
    // 7) UPDATE LOCAL ORDER WITH FINAL STATUS
    // ----------------------------------------

    await newOrder.update({
      uniqueorderid:detailsData.exchange_order_id,
      averageprice:detailsData.average_price,
      lotsize:detailsData.quantity,
      symboltoken:reqInput.kiteToken||reqInput.token,
      triggerprice:detailsData.average_price,
      price:detailsData.average_price,
      orderstatuslocaldb: finalStatus,
    });

    // ----------------------------------------
    // 8) (OPTIONAL) TRADES FETCH
    // ----------------------------------------
    try {
      const trades = await kite.getOrderTrades(orderid);

    
      

      if (Array.isArray(trades) && trades.length > 0) {
        
        const t = await trades[0];

        const buyPrice  = buyOrder?.fillprice     || 0;
        const buySize   = buyOrder?.fillsize      || 0;
        const buyValue  = buyOrder?.tradedValue   || 0;
         let buyTime  =   buyOrder?.filltime|| 0;

        // Calculate PNL safely
        let  pnl = ( Number(reqInput.quantity) * t.average_price) - (buyPrice * buySize);

           
         if(t.transaction_type==='BUY') {
             pnl = 0 ;
             buyTime = "NA";
         }

         console.log(t,'trade data');
         
         

          // Update order
          await newOrder.update({
            tradedValue: t.average_price * Number(reqInput.quantity),
            fillprice: t.average_price,
            fillsize: Number(reqInput.quantity),
            fillid: t.trade_id,
            filltime: t?.fill_timestamp.toISOString(),
            status: "COMPLETE",
            pnl: pnl,
            buyTime:buyTime,
            buyprice: buyPrice,
            buysize: buySize,
            buyvalue: buyValue,
          });
      }else{

          console.log(trades,'hhhy');
          

      }

    } catch (e) {
        console.log(e,'get order trade');
        
    }

    return {
      userId: user.id,
      broker: "Kite",
      result: "SUCCESS",
      orderid,
    };
  } catch (err) {

    console.log(err,'err');
    
    return {
      userId: user.id,
      broker: "Kite",
      result: "ERROR",
      message: err.message,
    };
  }
};









export const testLocalSell = async (req,res,next) => {

  let array = {
  symboltoken: '532648',
  variety: 'regular',
  tradingsymbol: 'YESBANK',
  instrumenttype: '',
  transactiontype: 'SELL',
  exchange: 'BSE',
  ordertype: 'MARKET',
  quantity: '1',
  producttype: 'MIS',
  price: 22.11,
  orderstatuslocaldb: 'PENDING',
  totalPrice: null,
  actualQuantity: null,
  userId: 3,
  broker: 'kite',
  angelOneSymbol: 'YESBANK',
  angelOneToken: '532648',
  userNameId: '02439',
  buyOrderId: '251210170353170'
}


  let buyOrder = await Order.findOne({
          where: {
            userId: array.userId,
            status:"COMPLETE",
            orderstatuslocaldb: "OPEN",
            orderid:String(array?.buyOrderId)
              },
              raw: true
            });



            console.log(buyOrder);
            
  
}