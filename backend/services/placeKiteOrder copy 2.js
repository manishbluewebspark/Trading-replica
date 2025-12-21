// services/kite/placeKiteOrder.js

import { getKiteClientForUserId } from "../services/userKiteBrokerService.js";
import Order from "../models/orderModel.js";

import { logSuccess, logError } from "../utils/loggerr.js";



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






// ==============update logger code ==============================
export const placeKiteOrder = async (user, reqInput, startOfDay, endOfDay, req) => {
  try {
    logSuccess(req, { msg: "Kite order flow started", reqInput });

    // 1️⃣ Kite instance
    const kite = await getKiteClientForUserId(user.id);
    logSuccess(req, { msg: "Kite client created", userId: user.id });

    // 2️⃣ Mappings
    const kiteProductType = await getKiteProductCode(reqInput.productType);
    logSuccess(req, { msg: "Mapped product type", kiteProductType });

    const kiteVariety = await mapVarietyToKite(reqInput.variety);
    logSuccess(req, { msg: "Mapped order variety", kiteVariety });

    // 3️⃣ Create LOCAL pending order
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
      userId: user.id,
      broker: "kite",
      userNameId: user.username,
    };

    logSuccess(req, { msg: "Prepared local order object", orderData });

    const newOrder = await Order.create(orderData);
    logSuccess(req, { msg: "Local order saved", orderId: newOrder.id });

    // 4️⃣ Kite order payload
    const orderParams = {
      exchange: reqInput.exch_seg,
      tradingsymbol: reqInput.kiteSymbol || reqInput.symbol,
      transaction_type: reqInput.transactiontype,
      quantity: Number(reqInput.quantity),
      product: kiteProductType,
      order_type: reqInput.orderType,
      price: reqInput.price,
      market_protection: 5,
    };

    logSuccess(req, { msg: "Prepared Kite payload", orderParams });

    // 5️⃣ Place order on Kite
    let placeRes;
    try {
      placeRes = await kite.placeOrder(orderData.variety, orderParams);
      logSuccess(req, { msg: "Kite order placed", placeRes });
    } catch (err) {
      logError(req, err, { msg: "Kite order placement failed" });

      await newOrder.update({
        orderstatuslocaldb: "FAILED",
        status: "FAILED",
        text: err.message,
      });

      return { result: "BROKER_REJECTED", message: err.message };
    }

    const orderid = placeRes.order_id;
    await newOrder.update({ orderid });
    logSuccess(req, { msg: "Order ID saved locally", orderid });

    // 6️⃣ Fetch trade details (may be empty)
    let trade = null;
    try {
      const trades = await kite.getOrderTrades(orderid);
      logSuccess(req, { msg: "Fetched order trades", tradesCount: trades?.length });

      if (Array.isArray(trades) && trades.length > 0) {
        trade = trades[0];
        logSuccess(req, { msg: "Using first trade record", trade });
      }
    } catch (e) {
      logError(req, e, { msg: "Trade fetch failed (non-fatal)" });
    }

    // 7️⃣ BUY/SELL handling
    let buyOrder = null;
    let finalStatus = "OPEN";

    if (reqInput.transactiontype === "SELL") {
      buyOrder = await Order.findOne({
        where: {
          userId: user.id,
          transactiontype: "BUY",
          orderstatuslocaldb: "OPEN",
        },
        raw: true,
      });

      logSuccess(req, { msg: "Fetched matching BUY order", buyOrder });

      if (buyOrder) {
        await Order.update(
          { orderstatuslocaldb: "COMPLETE" },
          { where: { id: buyOrder.id } }
        );
        logSuccess(req, { msg: "BUY order marked COMPLETE", buyOrderId: buyOrder.id });
      }

      finalStatus = "COMPLETE";
    }

    // 8️⃣ Final local update
    if (trade) {
      const buyPrice = buyOrder?.fillprice || 0;
      const buyQty = buyOrder?.fillsize || 0;

      let pnl = trade.average_price * trade.quantity - buyPrice * buyQty;
      if (trade.transaction_type === "BUY") pnl = 0;

      logSuccess(req, { msg: "Calculated PnL", pnl });

      await newOrder.update({
        tradedValue: trade.average_price * trade.quantity,
        fillprice: trade.average_price,
        fillsize: trade.quantity,
        fillid: trade.trade_id,
        filltime: trade.fill_timestamp?.toISOString() || null,
        status: "COMPLETE",
        pnl,
        orderstatuslocaldb: finalStatus,
        buyprice: buyPrice,
        buysize: buyQty,
      });

      logSuccess(req, { msg: "Final order updated in DB", orderid });
    }

    logSuccess(req, { msg: "Kite order flow completed successfully", orderid });

    return {
      result: "SUCCESS",
      orderid,
    };
  } catch (err) {
    logError(req, err, { msg: "Unexpected Kite order failure" });
    return { result: "ERROR", message: err.message };
  }
};

// ==============update logger code ==============================
export const placeKiteOrderLocalDb = async (user, reqInput, startOfDay, endOfDay, req) => {
  try {
    logSuccess(req, { msg: "Kite LocalDB order flow started", reqInput });

    // 1️⃣ Kite client
    const kite = await getKiteClientForUserId(user.id);
    logSuccess(req, { msg: "Kite client created", userId: user.id });

    // 2️⃣ Create local pending order
    const orderData = {
      symboltoken: reqInput.kiteToken || reqInput.token,
      variety: reqInput.variety || "regular",
      tradingsymbol: reqInput.kiteSymbol || reqInput.symbol,
      instrumenttype: reqInput.instrumenttype,
      transactiontype: reqInput.transactiontype,
      exchange: reqInput.exch_seg,
      ordertype: reqInput.orderType,
      quantity: reqInput.quantity,
      producttype: reqInput.productType,
      price: reqInput.price,
      orderstatuslocaldb: "PENDING",
      userId: user.id,
      broker: "kite",
      userNameId: user.username,
      buyOrderId: reqInput?.buyOrderId,
    };

    logSuccess(req, { msg: "Prepared local order object", orderData });

    const newOrder = await Order.create(orderData);
    logSuccess(req, { msg: "Local order saved", localOrderId: newOrder.id });

    // 3️⃣ Kite payload
    const orderParams = {
      exchange: reqInput.exch_seg,
      tradingsymbol: reqInput.kiteSymbol || reqInput.symbol,
      transaction_type: reqInput.transactiontype,
      quantity: Number(reqInput.quantity),
      product: reqInput.productType,
      order_type: reqInput.orderType,
      price: reqInput.price,
      market_protection: 5,
    };

    logSuccess(req, { msg: "Prepared Kite payload", orderParams });

    // 4️⃣ Place order on Kite
    let placeRes;
    try {
      placeRes = await kite.placeOrder(orderData.variety, orderParams);
      logSuccess(req, { msg: "Kite order placed successfully", placeRes });
    } catch (err) {
      logError(req, err, { msg: "Kite order placement failed" });

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

    const orderid = placeRes.order_id;
    await newOrder.update({ orderid });
    logSuccess(req, { msg: "Order ID saved locally", orderid });

    // 5️⃣ Fetch order trades (may be empty)
    let trade = null;
    try {
      const trades = await kite.getOrderTrades(orderid);
      logSuccess(req, { msg: "Fetched order trades", tradesCount: trades?.length });

      if (Array.isArray(trades) && trades.length > 0) {
        trade = trades[0];
        logSuccess(req, { msg: "Using first trade record", trade });
      }
    } catch (e) {
      logError(req, e, { msg: "Trade fetch failed (non-fatal)" });
    }

    // 6️⃣ BUY / SELL logic
    let finalStatus = "OPEN";
    let buyOrder = null;

    if (reqInput.transactiontype === "SELL") {
      buyOrder = await Order.findOne({
        where: {
          userId: user.id,
          orderid: String(reqInput?.buyOrderId),
          orderstatuslocaldb: "OPEN",
        },
        raw: true,
      });

      logSuccess(req, { msg: "Fetched matching BUY order", buyOrder });

      if (buyOrder) {
        await Order.update(
          { orderstatuslocaldb: "COMPLETE" },
          { where: { orderid: reqInput?.buyOrderId } }
        );
        logSuccess(req, {
          msg: "BUY order marked COMPLETE",
          buyOrderId: reqInput?.buyOrderId,
        });
      }

      finalStatus = "COMPLETE";
    }

    // 7️⃣ Update local order basic status
    await newOrder.update({
      uniqueorderid: trade?.exchange_order_id || null,
      averageprice: trade?.average_price || null,
      lotsize: trade?.quantity || null,
      triggerprice: trade?.average_price || null,
      price: trade?.average_price || null,
      orderstatuslocaldb: finalStatus,
    });

    logSuccess(req, { msg: "Local order updated with status", finalStatus });

    // 8️⃣ Final trade update (PnL)
    if (trade) {
      const buyPrice = buyOrder?.fillprice || 0;
      const buyQty = buyOrder?.fillsize || 0;
      let buyTime = buyOrder?.filltime || "NA";

      let pnl =
        Number(reqInput.quantity) * trade.average_price -
        buyPrice * buyQty;

      if (trade.transaction_type === "BUY") {
        pnl = 0;
        buyTime = "NA";
      }

      logSuccess(req, { msg: "Calculated PnL", pnl });

      await newOrder.update({
        tradedValue: trade.average_price * Number(reqInput.quantity),
        fillprice: trade.average_price,
        fillsize: Number(reqInput.quantity),
        fillid: trade.trade_id,
        filltime: trade.fill_timestamp?.toISOString() || null,
        status: "COMPLETE",
        pnl,
        buyTime,
        buyprice: buyPrice,
        buysize: buyQty,
      });

      logSuccess(req, { msg: "Final trade data saved in DB", orderid });
    }

    logSuccess(req, {
      msg: "Kite LocalDB order flow completed successfully",
      orderid,
    });

    return {
      userId: user.id,
      broker: "Kite",
      result: "SUCCESS",
      orderid,
    };
  } catch (err) {
    logError(req, err, { msg: "Unexpected LocalDB Kite order error" });

    return {
      userId: user.id,
      broker: "Kite",
      result: "ERROR",
      message: err.message,
    };
  }
};

// old code working



// export const placeKiteOrder1 = async (user, reqInput, startOfDay, endOfDay,req) => {
//   try {

//     // 1) Set access token
//   let kite = await getKiteClientForUserId(user.id)

//   logSuccess(req, {kite:kite,msg:"kite instance "});

//   const kiteProductType = await getKiteProductCode( reqInput.productType);

//   logSuccess(req, {kiteProductType:kiteProductType,msg:"kite ProductType "});

//   const kiteVerity = await mapVarietyToKite(reqInput.variety)

//    logSuccess(req, {kiteVerity:kiteVerity,msg:"kite verity type"});

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


//     logSuccess(req, {orderData:orderData,msg:"before save local object"});
    

//     const newOrder = await Order.create(orderData);

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

//     logSuccess(req, {orderid:orderid,msg:"kite place order"});

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


// export const placeKiteOrderLocalDb = async (user, reqInput, startOfDay, endOfDay) => {
//   try {

//     // 1) Set access token
//     let kite = await getKiteClientForUserId(user.id)

//     // ----------------------------------------
//     // 2) CREATE LOCAL PENDING ORDER
//     // ----------------------------------------
//     const orderData = {
//       symboltoken:reqInput.kiteToken||reqInput.token,
//       variety:reqInput.variety || "regular",    // mistage in fields 
//       tradingsymbol:reqInput.kiteSymbol|| reqInput.symbol,
//       instrumenttype:reqInput.instrumenttype,
//       transactiontype: reqInput.transactiontype,
//       exchange: reqInput.exch_seg,
//       ordertype: reqInput.orderType,
//       quantity: reqInput.quantity,
//       producttype: reqInput.productType,
//       price: reqInput.price,
//       orderstatuslocaldb: "PENDING",
//       totalPrice: reqInput.totalPrice,
//       actualQuantity: reqInput.actualQuantity,
//       userId: user.id,
//       broker:'kite',
//       angelOneSymbol:reqInput.angelOneSymbol||reqInput.symbol,
//       angelOneToken:reqInput.angelOneToken||reqInput.token,
//       userNameId: user.username,
//       buyOrderId:reqInput?.buyOrderId
//     };


//     console.log(orderData,'orderData');
    

//     const newOrder = await Order.create(orderData);


//     // ----------------------------------------
//     // 3) KITE PAYLOAD
//     // ----------------------------------------
//     const orderParams = {
//       exchange: reqInput.exch_seg,
//       tradingsymbol: reqInput.kiteSymbol|| reqInput.symbol,
//       transaction_type: reqInput.transactiontype,
//       quantity: Number(reqInput.quantity),
//       product:reqInput.productType,  // DELIVERY.                // mistake in fields 
//       order_type: reqInput.orderType,
//       price: reqInput.price,
//       market_protection: 5 // protection points
//     };

//      console.log(orderParams,' db orderParams done');

//     // ----------------------------------------
//     // 4) PLACE ORDER IN KITE
//     // ----------------------------------------
//     let placeRes;
//     try {

//     placeRes = await kite.placeOrder(orderData.variety, orderParams);

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

//     // save order id
//     await newOrder.update({ orderid });

//     // ----------------------------------------
//     // 5) GET ORDER DETAILS FROM KITE
//     // ----------------------------------------
//     let detailsData = {};
//     try {
        
//        const detailRes = await kite.getOrderTrades(orderid);
    

//       if (Array.isArray(detailRes) && detailRes.length > 0) {

//         detailsData = detailRes[0]; // fallback
       
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
//             status:"COMPLETE",
//             orderstatuslocaldb: "OPEN",
//             orderid:String(reqInput?.buyOrderId)
//               },
//               raw: true
//             });
            

//         if (buyOrder) {

//         await Order.update(
//           { orderstatuslocaldb: "COMPLETE" },
//           { where: { orderid: reqInput?.buyOrderId } }
//         );

//       }

//       finalStatus = "COMPLETE";
//     }

//     // ----------------------------------------
//     // 7) UPDATE LOCAL ORDER WITH FINAL STATUS
//     // ----------------------------------------

//     await newOrder.update({
//       uniqueorderid:detailsData.exchange_order_id,
//       averageprice:detailsData.average_price,
//       lotsize:detailsData.quantity,
//       symboltoken:reqInput.kiteToken||reqInput.token,
//       triggerprice:detailsData.average_price,
//       price:detailsData.average_price,
//       orderstatuslocaldb: finalStatus,
//     });

//     // ----------------------------------------
//     // 8) (OPTIONAL) TRADES FETCH
//     // ----------------------------------------
//     try {
//       const trades = await kite.getOrderTrades(orderid);

    
      

//       if (Array.isArray(trades) && trades.length > 0) {
        
//         const t = await trades[0];

//         const buyPrice  = buyOrder?.fillprice     || 0;
//         const buySize   = buyOrder?.fillsize      || 0;
//         const buyValue  = buyOrder?.tradedValue   || 0;
//          let buyTime  =   buyOrder?.filltime|| 0;

//         // Calculate PNL safely
//         let  pnl = ( Number(reqInput.quantity) * t.average_price) - (buyPrice * buySize);

           
//          if(t.transaction_type==='BUY') {
//              pnl = 0 ;
//              buyTime = "NA";
//          }

//          console.log(t,'trade data');
         
         

//           // Update order
//           await newOrder.update({
//             tradedValue: t.average_price * Number(reqInput.quantity),
//             fillprice: t.average_price,
//             fillsize: Number(reqInput.quantity),
//             fillid: t.trade_id,
//             filltime: t?.fill_timestamp.toISOString(),
//             status: "COMPLETE",
//             pnl: pnl,
//             buyTime:buyTime,
//             buyprice: buyPrice,
//             buysize: buySize,
//             buyvalue: buyValue,
//           });
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

//     console.log(err,'err');
    
//     return {
//       userId: user.id,
//       broker: "Kite",
//       result: "ERROR",
//       message: err.message,
//     };
//   }
// };









