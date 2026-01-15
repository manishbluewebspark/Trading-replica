import axios from "axios";
import Order from "../models/orderModel.js";
import { logSuccess, logError } from "../utils/loggerr.js";
import { setFyersAccessToken, fyers } from "../utils/fyersClient.js";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat.js";
import utc from "dayjs/plugin/utc.js";


dayjs.extend(customParseFormat);
dayjs.extend(utc);

// ====================================================
// 🌐 Helpers Inline
// ====================================================

function getFyersProductCode(type) {
  if (!type) return "INTRADAY"; // default Fyers product

  switch (type.toUpperCase()) {
    case "DELIVERY":
      return "CNC";        // Delivery (Cash & Carry)

    case "CARRYFORWARD":
      return "MARGIN";     // Carryforward F&O

    case "MARGIN":
      return "MTF";        // Margin Trading Facility

    case "INTRADAY":
      return "INTRADAY";   // Intraday

    case "BO":
      return "BO";         // Bracket Order

    default:
      return type.toUpperCase(); // fallback
  }
}

const normalizeStatus = (status = "") =>
  status.toUpperCase().replace(/\s+/g, "").trim();

const fetchFyersOrderDetailsWithRetry = async ({ orderid, attempts = 3 }) => {
  for (let i = 0; i < attempts; i++) {
    try {
      const resp = await fyers.get_orders({});
      const found = resp?.orderBook?.find(o => o.id === orderid);
      if (found) return found;
    } catch { /* ignore */ }
    await new Promise(r => setTimeout(r, 300));
  }
  return null;
};

const fetchFyersTradebookWithRetry = async ({ orderid, expectedQty, attempts = 3 }) => {
  let lastTrades = []; // store whatever we got in each attempt

  for (let i = 0; i < attempts; i++) {
    try {
      const resp = await fyers.get_trades({});
      let trades = resp?.tradeBook?.filter(t => t.orderNumber === orderid) || [];

      // store the trades found in this attempt
      lastTrades = trades;

      if (expectedQty) {
        // check for trades matching the expected quantity
        const matchingTrades = trades.filter(t => t.tradedQty||t.quantity === expectedQty);

        if (matchingTrades.length) return matchingTrades; // exact match found
      }
    } catch (err) {
      console.error("Error fetching trades:", err);
    }

    // wait 300ms before next retry
    await new Promise(r => setTimeout(r, 300));
  }

  // after all retries, return whatever trades we got (partial or empty)
  return lastTrades;
};


// ====================================================
// 🚀 Main Function
// ====================================================
export const placeFyersOrder = async (user, reqInput, req, isLocalDbFlow = true) => {
  let newOrder = null;
  const nowISOError = new Date().toISOString();

  try {
    const transactionType = (reqInput.transactiontype || "").toUpperCase();

     const fyersProductType = getFyersProductCode(reqInput.productType);

    if (!user?.authToken) {
      return { result: "ERROR", message: "FYERS token missing" };
    }

    // ------------------------------------
    // 0️⃣ Apply Token
    // ------------------------------------
    await setFyersAccessToken(user.authToken);

    // ------------------------------------
    // 1️⃣ Detect Same Order (BUY only)
    // ------------------------------------
    let existingBuyOrder = null;
    if (transactionType === "BUY") {
      existingBuyOrder = await Order.findOne({
        where: {
          userId: user.id,
          ordertype: reqInput.orderType,
          producttype: fyersProductType,
          tradingsymbol: reqInput.fyersSymbol||reqInput.symbol,
          transactiontype: "BUY",
          orderstatuslocaldb: "OPEN",
        },
      });
    }

    // ------------------------------------
    // 2️⃣ Create Pending Order Locally
    // ------------------------------------
    const orderData = {
      variety: reqInput.variety || "NORMAL",
      tradingsymbol: reqInput.reqInput.fyersSymbol||reqInput.symbol,
      transactiontype: transactionType,
      exchange: reqInput.exchange || reqInput.exch_seg || "NSE",
      ordertype: reqInput.orderType,
      quantity: reqInput.quantity,
      producttype: fyersProductType,
      price: reqInput.price,
      orderstatuslocaldb: "PENDING",
      userId: user.id,
      broker: "fyers",
      userNameId: user.username,
      strategyName: reqInput.groupName || "",
      strategyUniqueId: reqInput.strategyUniqueId || "",
      buyOrderId: reqInput.buyOrderId || null,
      angelOneSymbol: reqInput.angelOneSymbol || reqInput.symbol,
      angelOneToken: reqInput.angelOneToken || reqInput.token,
    };

    newOrder = await Order.create(orderData);

    // ------------------------------------
    // 3️⃣ FYERS API Payload
    // ------------------------------------
   
    const fyersTypeMap = { LIMIT: 1, MARKET: 2, SL: 3, "SL-M": 4 };

    const payload = {
      symbol:reqInput.fyersSymbol||reqInput.symbol,
      qty: Number(reqInput.quantity),
      type: fyersTypeMap[reqInput.orderType] || 2,
      side: transactionType === "BUY" ? 1 : -1,
      productType: fyersProductType,
      limitPrice: reqInput.orderType === "MARKET" ? 0 : Number(reqInput.price || 0),
      stopPrice: reqInput.triggerPrice || 0,
      validity: reqInput.duration || "DAY",
      disclosedQty: 0,
      orderTag:"softwaresetu",
      offlineOrder: false,
    };

    // ------------------------------------
    // 4️⃣ Place Fyers Order
    // ------------------------------------
    let placeRes;
    try {
      placeRes = await fyers.place_order(payload);
    } catch (err) {
      await newOrder.update({
        orderstatuslocaldb: "FAILED",
        positionStatus: "FAILED",
        status: "FAILED",
        text: err.message,
        filltime: nowISOError,
      });
      return { result: "BROKER_ERROR", message: err.message };
    }

    if (!placeRes || placeRes.s !== "ok" || !placeRes.id) {
      await newOrder.update({ orderstatuslocaldb: "FAILED", positionStatus: "FAILED", status: "FAILED",filltime: nowISOError, });
      return { result: "BROKER_REJECTED" };
    }

    const orderid = placeRes.id;
    await newOrder.update({ orderid });

    // ------------------------------------
    // 5️⃣ OrderBook Status Check
    // ------------------------------------
    const orderDetails = await fetchFyersOrderDetailsWithRetry({ orderid });
    if (orderDetails) {
      const stat = normalizeStatus(orderDetails.report_type||orderDetails.status);

      if (stat.includes("REJECT")||stat.includes("REJECTED")) {
        await newOrder.update({ 
          orderstatuslocaldb: "REJECTED", positionStatus: "REJECTED",
          status: "REJECTED",  filltime: nowISOError,
          text:orderDetails?.oms_msg||""
           });
        return { result: "BROKER_REJECTED" };
      }
      if (["CANCEL", "CANCELLED"].includes(stat)) {
        await newOrder.update({ 
           orderstatuslocaldb: "CANCELLED",positionStatus: "CANCELLED",
           status: "CANCELLED",  filltime: nowISOError,
           text:orderDetails?.oms_msg||""
           });
        return { result: "OPEN" };
      }
      if (["OPEN", "PENDING"].includes(stat)) {
        await newOrder.update({ 
           orderstatuslocaldb: "OPEN",positionStatus: "OPEN",
           status: "OPEN",  filltime: nowISOError,
           text:orderDetails?.oms_msg||""
           });
        return { result: "OPEN" };
      }
    }

    // ------------------------------------
    // 6️⃣ Tradebook Final Fill
    // ------------------------------------
    const trades = await fetchFyersTradebookWithRetry({
      orderid,
      expectedQty: reqInput.quantity,
    });

    if (!trades.length) {
      await newOrder.update({ orderstatuslocaldb: "OPEN",positionStatus: "OPEN", status: "OPEN",  filltime: nowISOError, });
      return { result: "OPEN" };
    }

    let totalQty = 0;
    let totalValue = 0;
    trades.forEach(t => {
      totalQty += Number(t.tradedQty||t.qty);
      totalValue += Number(t.tradedQty||t.qty) * Number(t.tradePrice||t.price);
    });
    const avgPrice = totalValue / totalQty;

    // ------------------------------------
    // 7️⃣ SELL PNL / BUY MERGE
    // ------------------------------------
    let buyOrder = null;

    if (transactionType === "SELL" && reqInput.buyOrderId) {
      buyOrder = await Order.findOne({
        where: { userId: user.id, orderid: reqInput.buyOrderId, status: "COMPLETE" },
      });
      const originalQty = Number(buyOrder?.fillsize || buyOrder?.quantity);
      const remaining = originalQty - totalQty;
      if (buyOrder) {
        if (remaining > 0) {
          await buyOrder.update({ fillsize: remaining, quantity: remaining,tradedValue:remaining*buyOrder.fillprice });

          await Order.create({
             ...buyOrder.toJSON(),
              id: undefined,
              fillsize: totalQty,
              quantity: totalQty,
              tradedValue:totalQty*buyOrder.fillprice,
              orderstatuslocaldb: "COMPLETE",
              status: "COMPLETE",
              postionStauts: "COMPLETE"
              });
        } else {
          await buyOrder.update({ orderstatuslocaldb: "COMPLETE", postionStauts: "COMPLETE" });
        }
      }
    }

    const pnl = transactionType === "SELL" && buyOrder
      ? (avgPrice - Number(buyOrder.fillprice || 0)) * totalQty
      : 0;

    await newOrder.update({
      fillprice: avgPrice,
      price: avgPrice,
      quantity:totalQty,
      fillsize: totalQty,
      tradedValue: totalValue,
      fillid: trades[0]?.row||"",
      uniqueorderid: trades[0]?.exchangeOrderNo||"",
      status: "COMPLETE",
      orderstatuslocaldb: transactionType === "SELL" ? "COMPLETE" : "OPEN",
      postionStauts: transactionType === "SELL" ? "COMPLETE" : "OPEN",
      pnl,
      buyOrderId: buyOrder?.orderid || null,
      buyprice: buyOrder?.fillprice||0,
      buyTime: buyOrder?.filltime||0,
      buysize: buyOrder ? totalQty : 0,
      buyvalue: totalQty*buyOrder?.fillprice||0,
      positionStatus,


    });

    // ------------------------------------
    // 8️⃣ MERGE BUY (Same Order Found)
    // ------------------------------------
    if (transactionType === "BUY" && existingBuyOrder) {
      const mergedQty = Number(existingBuyOrder.fillsize || 0) + totalQty;
      const mergedVal = Number(existingBuyOrder.tradedValue || 0) + totalValue;
      await existingBuyOrder.update({
        fillsize: mergedQty,
        quantity: mergedQty,
        tradedValue: mergedVal,
        fillprice: mergedVal / mergedQty,
        price: mergedVal / mergedQty
      });

      await newOrder.destroy();

      return { result: "SUCCESS", mergedInto: existingBuyOrder.id };
    }

    return { result: "SUCCESS", orderid };

  } catch (err) {
    await newOrder?.update({
      orderstatuslocaldb: "FAILED",
      status: "FAILED",
      positionStatus: "FAILED",
      filltime: nowISOError,
      text: err.message,
    });
    return { result: "BROKER_ERROR", message: err.message };
  }
};








// // services/fyers/placeFyersOrder.js

// import { setFyersAccessToken, fyers } from "../utils/fyersClient.js";
// import Order from "../models/orderModel.js";
// import { logSuccess, logError } from "../utils/loggerr.js";


// function getFyersProductCode(type) {
//   if (!type) return "INTRADAY"; // default Fyers product

//   switch (type.toUpperCase()) {
//     case "DELIVERY":
//       return "CNC";        // Delivery (Cash & Carry)

//     case "CARRYFORWARD":
//       return "MARGIN";     // Carryforward F&O

//     case "MARGIN":
//       return "MTF";        // Margin Trading Facility

//     case "INTRADAY":
//       return "INTRADAY";   // Intraday

//     case "BO":
//       return "BO";         // Bracket Order

//     default:
//       return type.toUpperCase(); // fallback
//   }
// }


// function mapFyersOrderType(orderType) {
//   if (!orderType) return 1; // default LIMIT

//   switch (orderType.toUpperCase()) {
//     case "LIMIT":
//       return 1;      // LIMIT

//     case "MARKET":
//       return 2;      // MARKET

//     case "STOPLOSS_LIMIT":
//     case "SL":
//       return 3;      // Stoploss LIMIT

//     case "STOPLOSS_MARKET":
//     case "SL-M":
//       return 4;      // Stoploss MARKET

//     default:
//       return 1;      // fallback LIMIT
//   }
// }


// // ===========old workig code =============================
// export const placeFyersOrder = async (user, reqInput, startOfDay, endOfDay) => {
//   try {
//     // 1) Set Fyers access token (per user)
//     await setFyersAccessToken(user.authToken);

//     const fyersProductType = getFyersProductCode(reqInput.productType);

//     const fyersOrderType = mapFyersOrderType(reqInput.orderType);

//     const isLimitType  = fyersOrderType === 1 || fyersOrderType === 3; // LIMIT, SL
//     const isMarketType = fyersOrderType === 2 || fyersOrderType === 4; // MARKET, SL-M

//     // Fyers rules:
//     const limitPrice =
//       isLimitType ? Number(reqInput.price || 0) : 0;   // LIMIT/SL need limitPrice, MARKET/SL-M must be 0

//     const stopPrice =
//       (fyersOrderType === 3 || fyersOrderType === 4)
//         ? Number(reqInput.triggerPrice || 0)          // SL / SL-M must have stopPrice
//         : 0;


//     // Build Fyers symbol: "NSE:SBIN-EQ"
//      // Build Fyers symbol: "NSE:SBIN-EQ"
//     const fyersSymbol =
//        `${reqInput.exch_seg}:${reqInput.symbol}`;


//     // ----------------------------------------
//     // 2) CREATE LOCAL PENDING ORDER (similar to Kite)
//     // ----------------------------------------
//     const orderData = {
//       symboltoken: reqInput.token,
//       variety: reqInput.variety || "NORMAL",
//       tradingsymbol: reqInput.symbol,
//       duration:reqInput?.duration,
//       instrumenttype: reqInput.instrumenttype,
//       transactiontype: reqInput.transactiontype, // BUY / SELL
//       exchange: reqInput.exch_seg,              // NSE / NFO etc.
//       ordertype: reqInput.orderType,            // LIMIT / MARKET / SL / SL-M
//       quantity: reqInput.quantity,
//       product: fyersProductType,                // INTRADAY / CNC / MTF
//       price: reqInput.price,
//       orderstatuslocaldb: "PENDING",
//       totalPrice: reqInput.totalPrice,
//       actualQuantity: reqInput.actualQuantity,
//       userId: user.id,
//       userNameId: user.username,
//       angelOneSymbol:reqInput.angelOneSymbol||reqInput.symbol,
//       angelOneToken:reqInput.angelOneToken||reqInput.token,
//       broker: "fyers",
//       buyOrderId:reqInput?.buyOrderId
//     };


    

//     const newOrder = await Order.create(orderData);

//     // ----------------------------------------
//     // 3) FYERS ORDER PAYLOAD
//     // ----------------------------------------
//     const fyersReqBody = {
//       symbol: fyersSymbol,                       // "NSE:SBIN-EQ"
//       qty: Number(reqInput.quantity),
//       type: fyersOrderType,                      // 1,2,3,4
//       side: reqInput.transactiontype === "BUY" ? 1 : -1,     // 1 = BUY, -1 = SELL
//       productType: fyersProductType,             // "INTRADAY", "CNC", ...
//       limitPrice,                              // ✅ now correct per order type
//       stopPrice,                               // ✅ only non-zero for SL / SL-M
//       disclosedQty: 0,
//       validity: reqInput?.duration,                           // or IOC, GTC etc.
//       offlineOrder: false,
//       stopLoss: 0,
//       takeProfit: 0,
//       orderTag: reqInput.orderTag || `U${user.id}`, // you can customize
//     };

//     // ----------------------------------------
//     // 4) PLACE ORDER IN FYERS
//     // ----------------------------------------
//     let placeRes;
//     try {

//       console.log(fyersReqBody,'fyersReqBody');
      
//       placeRes = await fyers.place_order(fyersReqBody);

//       if (!placeRes || placeRes.s !== "ok") {
//         const msg = placeRes?.message || "Fyers order placement failed";

//         await newOrder.update({
//           orderstatuslocaldb: "FAILED",
//           status: "FAILED",
//           text: msg,
//           //  filltime: new Date().toISOString().replace(/\.\d+Z$/, ".000Z"),
//             buyTime:new Date().toISOString().replace(/\.\d+Z$/, ".000Z"),
//         });

//         return {
//           userId: user.id,
//           broker: "Fyers",
//           result: "BROKER_REJECTED",
//           message: msg,
//         };
//       }
//     } catch (err) {
//       console.log("Fyers place_order error:", err);

//       await newOrder.update({
//         orderstatuslocaldb: "FAILED",
//         status: "FAILED",
//         text: err.message,
//       });

//       return {
//         userId: user.id,
//         broker: "Fyers",
//         result: "BROKER_REJECTED",
//         message: err.message,
//       };
//     }

//     const orderid = placeRes.id; // e.g. "52104097616"

//     // Save order id
//     await newOrder.update({ orderid });

//     // ----------------------------------------
//     // 5) HANDLE BUY / SELL LOGIC (same as Kite)
//     // ----------------------------------------
//     let finalStatus = "OPEN";
//     let buyOrder;

//     if (reqInput.transactiontype === "SELL") {
//       // find today's OPEN BUY to close
//       buyOrder = await Order.findOne({
//         where: {


//            userId: user.id,
//             status:"COMPLETE",
//             orderstatuslocaldb: "OPEN",
//             orderid:String(reqInput?.buyOrderId)
//         },
//         raw: true,
//       });

//       if (buyOrder) {
//         await Order.update(
//           { orderstatuslocaldb: "COMPLETE" },
//           { where: { id: buyOrder.id } }
//         );
//       }

//       finalStatus = "COMPLETE";
//     }

//     // ----------------------------------------
//     // 6) GET TRADEBOOK (DETAILS + PNL)
//     // ----------------------------------------
//     let tradeForThisOrder = null;

//     try {
//       const tradeRes = await fyers.get_tradebook(); // full tradebook

//       if (tradeRes && tradeRes.s === "ok" && Array.isArray(tradeRes.tradeBook)) {
//         // Filter trades for this orderNumber (same as placeRes.id)
//         const tradesForOrder = tradeRes.tradeBook.filter(
//           (t) => t.orderNumber === orderid
//         );

//         if (tradesForOrder.length > 0) {
//           // Take the last trade for details
//           tradeForThisOrder = tradesForOrder[tradesForOrder.length - 1];
//         }
//       }
//     } catch (err) {
//       console.log("Fyers get_tradebook error:", err);
//     }

//     // Default details (if no trade yet)
//     let detailsData = {};
//     let tradedQty = 0;
//     let tradedPrice = 0;
//     let tradedValue = 0;

//     if (tradeForThisOrder) {
//       tradedQty = tradeForThisOrder.tradedQty || 0;
//       tradedPrice = tradeForThisOrder.tradePrice || 0;
//       tradedValue = tradeForThisOrder.tradeValue || tradedQty * tradedPrice;

//       detailsData = {
//         exchangeOrderNo: tradeForThisOrder.exchangeOrderNo,
//         orderDateTime: tradeForThisOrder.orderDateTime,
//         productType: tradeForThisOrder.productType,
//         tradedQty,
//         tradedPrice,
//         tradedValue,
//       };
//     }

//     // ----------------------------------------
//     // 7) CALCULATE PNL (if we have trade + previous BUY)
//     // ----------------------------------------
//     let buyPrice = 0;
//     let buySize = 0;
//     let buyValue = 0;
//      let buyTime  = 'NA'
//     let pnl = 0;

//     if (buyOrder) {
//       buyPrice = buyOrder?.fillprice || 0;
//       buySize = buyOrder?.fillsize || 0;
//       buyValue = buyOrder?.tradedValue || 0;
//       buyTime = buyOrder?.filltime ||0
//     }

//     if (tradeForThisOrder) {
//       pnl = tradedQty * tradedPrice - buyPrice * buySize;

//       // For BUY leg, keep PNL 0 until SELL happens
//       if (reqInput.transactiontype === "BUY") {
//         pnl = 0;
//         buyTime  = 'NA';
//       }
//     }

//     // ----------------------------------------
//     // 8) UPDATE LOCAL ORDER WITH FINAL STATUS + DETAILS
//     // ----------------------------------------
//     await newOrder.update({
//       // Map to your DB columns similar to Kite
//       uniqueorderid: detailsData.exchangeOrderNo || orderid,
//       exchorderupdatetime: detailsData.orderDateTime || null,
//       exchtime: detailsData.orderDateTime || null,
//       updatetime: detailsData.orderDateTime || null,
//       text: placeRes.message || "",
//       averageprice: tradedPrice || reqInput.price || 0,
//       lotsize: tradedQty || reqInput.quantity,
//       symboltoken: reqInput.token,
//       disclosedquantity: 0,
//       triggerprice: Number(reqInput.triggerPrice || 0),
//       price: reqInput.price,
//       duration: "DAY",
//       producttype: detailsData.productType || fyersProductType,
//       orderstatuslocaldb: finalStatus,
//       status:"COMPLETE",
//       // Trade / PNL fields
//       tradedValue: tradedValue,
//       fillprice: tradedPrice,
//       fillsize: tradedQty,
//       fillid: tradeForThisOrder?.tradeNumber || null,
//       pnl,
//       buyTime:buyTime,
//       buyprice: buyPrice,
//       buysize: buySize,
//       buyvalue: buyValue,
//     });

//     return {
//       userId: user.id,
//       broker: "Fyers",
//       result: "SUCCESS",
//       orderid,
//     };
//   } catch (err) {
//     console.log("placeFyersOrder ERROR:", err);

//     return {
//       userId: user.id,
//       broker: "Fyers",
//       result: "ERROR",
//       message: err.message,
//     };
//   }
// };
