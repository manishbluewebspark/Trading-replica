// services/fyers/placeFyersOrder.js

import { setFyersAccessToken, fyers } from "../utils/fyersClient.js";
import Order from "../models/orderModel.js";
import { Op } from "sequelize";


/**
 * Map your generic productType to Fyers productType
 * Fyers examples: "INTRADAY", "CNC", "MTF", etc.
 */

// function getFyersProductCode(type) {
//   if (!type) return "INTRADAY";

//   switch (type.toUpperCase()) {
//     case "INTRADAY":
//       return "INTRADAY"; // as per your sample
//     case "DELIVERY":
//       return "CNC";      // delivery / cash-n-carry
//     case "CNC":
//     case "MTF":
//       return type.toUpperCase();
//     default:
//       return type;
//   }
// }


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

/**
 * Map your orderType ("LIMIT", "MARKET", "SL", "SL-M") to Fyers numeric `type`
 * From Fyers docs:
 * 1 = LIMIT, 2 = MARKET, 3 = SL, 4 = SL-M
 */


// function mapFyersOrderType(orderType) {
//   if (!orderType) return 1;

//   switch (orderType.toUpperCase()) {
//     case "LIMIT":
//       return 1;
//     case "MARKET":
//       return 2;
//     case "SL":
//       return 3;
//     case "SL-M":
//       return 4;
//     default:
//       return 1;
//   }
// }

function mapFyersOrderType(orderType) {
  if (!orderType) return 1; // default LIMIT

  switch (orderType.toUpperCase()) {
    case "LIMIT":
      return 1;      // LIMIT

    case "MARKET":
      return 2;      // MARKET

    case "STOPLOSS_LIMIT":
    case "SL":
      return 3;      // Stoploss LIMIT

    case "STOPLOSS_MARKET":
    case "SL-M":
      return 4;      // Stoploss MARKET

    default:
      return 1;      // fallback LIMIT
  }
}


// ==============update logger code ==============================
export const placeFyersOrder = async (user, reqInput, startOfDay, endOfDay, req) => {
  try {
    logSuccess(req, { msg: "Fyers order flow started", userId: user?.id, reqInput });

    // 1️⃣ Set Fyers access token (per user)
    try {
      await setFyersAccessToken(user.authToken);
      logSuccess(req, { msg: "Fyers access token set successfully" });
    } catch (e) {
      logError(req, e, { msg: "Failed to set Fyers access token" });
      return {
        userId: user.id,
        broker: "Fyers",
        result: "ERROR",
        message: "Failed to set Fyers token",
      };
    }

    const fyersProductType = getFyersProductCode(reqInput.productType);
    const fyersOrderType = mapFyersOrderType(reqInput.orderType);

    logSuccess(req, {
      msg: "Resolved Fyers mappings",
      fyersProductType,
      fyersOrderType,
    });

    const isLimitType = fyersOrderType === 1 || fyersOrderType === 3; // LIMIT, SL
    const isMarketType = fyersOrderType === 2 || fyersOrderType === 4; // MARKET, SL-M

    const limitPrice = isLimitType ? Number(reqInput.price || 0) : 0;
    const stopPrice =
      fyersOrderType === 3 || fyersOrderType === 4
        ? Number(reqInput.triggerPrice || 0)
        : 0;

    logSuccess(req, {
      msg: "Computed order prices",
      isLimitType,
      isMarketType,
      limitPrice,
      stopPrice,
    });

    // Build Fyers symbol: "NSE:SBIN-EQ"
    const fyersSymbol = `${reqInput.exch_seg}:${reqInput.symbol}`;
    logSuccess(req, { msg: "Built fyersSymbol", fyersSymbol });

    // 2️⃣ CREATE LOCAL PENDING ORDER
    const orderData = {
      symboltoken: reqInput.token,
      variety: reqInput.variety || "NORMAL",
      tradingsymbol: reqInput.symbol,
      duration: reqInput?.duration,
      instrumenttype: reqInput.instrumenttype,
      transactiontype: reqInput.transactiontype,
      exchange: reqInput.exch_seg,
      ordertype: reqInput.orderType,
      quantity: reqInput.quantity,
      product: fyersProductType,
      price: reqInput.price,
      orderstatuslocaldb: "PENDING",
      totalPrice: reqInput.totalPrice,
      actualQuantity: reqInput.actualQuantity,
      userId: user.id,
      userNameId: user.username,
      angelOneSymbol: reqInput.angelOneSymbol || reqInput.symbol,
      angelOneToken: reqInput.angelOneToken || reqInput.token,
      broker: "fyers",
      buyOrderId: reqInput?.buyOrderId,
    };

    logSuccess(req, { msg: "Prepared local pending order object", orderData });

    const newOrder = await Order.create(orderData);
    logSuccess(req, { msg: "Local order created", localOrderId: newOrder.id });

    // 3️⃣ FYERS ORDER PAYLOAD
    const fyersReqBody = {
      symbol: fyersSymbol,
      qty: Number(reqInput.quantity),
      type: fyersOrderType,
      side: reqInput.transactiontype === "BUY" ? 1 : -1,
      productType: fyersProductType,
      limitPrice,
      stopPrice,
      disclosedQty: 0,
      validity: reqInput?.duration,
      offlineOrder: false,
      stopLoss: 0,
      takeProfit: 0,
      orderTag: reqInput.orderTag || `U${user.id}`,
    };

    logSuccess(req, { msg: "Prepared Fyers place_order payload", fyersReqBody });

    // 4️⃣ PLACE ORDER IN FYERS
    let placeRes;
    try {
      placeRes = await fyers.place_order(fyersReqBody);
      logSuccess(req, { msg: "Fyers place_order response", placeRes });
    } catch (err) {
      logError(req, err, { msg: "Fyers place_order API failed" });

      await newOrder.update({
        orderstatuslocaldb: "FAILED",
        status: "FAILED",
        text: err?.message || "Fyers place_order failed",
        buyTime: new Date().toISOString().replace(/\.\d+Z$/, ".000Z"),
      });

      return {
        userId: user.id,
        broker: "Fyers",
        result: "BROKER_REJECTED",
        message: err?.message || "Fyers place_order failed",
      };
    }

    if (!placeRes || placeRes.s !== "ok") {
      const msg = placeRes?.message || "Fyers order placement failed";
      logSuccess(req, { msg: "Fyers rejected order", reason: msg, raw: placeRes });

      await newOrder.update({
        orderstatuslocaldb: "FAILED",
        status: "FAILED",
        text: msg,
        buyTime: new Date().toISOString().replace(/\.\d+Z$/, ".000Z"),
      });

      return {
        userId: user.id,
        broker: "Fyers",
        result: "BROKER_REJECTED",
        message: msg,
      };
    }

    const orderid = placeRes.id;
    await newOrder.update({ orderid });

    logSuccess(req, { msg: "Saved Fyers orderid locally", orderid });

    // 5️⃣ HANDLE BUY / SELL LOGIC
    let finalStatus = "OPEN";
    let buyOrder = null;

    if (reqInput.transactiontype === "SELL") {
      buyOrder = await Order.findOne({
        where: {
          userId: user.id,
          status: "COMPLETE",
          orderstatuslocaldb: "OPEN",
          orderid: String(reqInput?.buyOrderId),
        },
        raw: true,
      });

      logSuccess(req, { msg: "Fetched BUY order for SELL matching", buyOrder });

      if (buyOrder) {
        await Order.update(
          { orderstatuslocaldb: "COMPLETE" },
          { where: { id: buyOrder.id } }
        );
        logSuccess(req, { msg: "BUY order marked COMPLETE", buyOrderId: buyOrder.id });
      }

      finalStatus = "COMPLETE";
    }

    // 6️⃣ GET TRADEBOOK
    let tradeForThisOrder = null;

    try {
      const tradeRes = await fyers.get_tradebook();
      logSuccess(req, { msg: "Fyers tradebook response", tradeRes });

      if (tradeRes?.s === "ok" && Array.isArray(tradeRes.tradeBook)) {
        const tradesForOrder = tradeRes.tradeBook.filter(
          (t) => String(t.orderNumber) === String(orderid)
        );

        logSuccess(req, {
          msg: "Filtered trades for this order",
          orderid,
          tradesCount: tradesForOrder.length,
        });

        if (tradesForOrder.length > 0) {
          tradeForThisOrder = tradesForOrder[tradesForOrder.length - 1];
          logSuccess(req, { msg: "Selected last trade entry", tradeForThisOrder });
        }
      }
    } catch (err) {
      logError(req, err, { msg: "Fyers get_tradebook failed (non-fatal)" });
    }

    // Defaults (if no trade yet)
    let detailsData = {};
    let tradedQty = 0;
    let tradedPrice = 0;
    let tradedValue = 0;

    if (tradeForThisOrder) {
      tradedQty = Number(tradeForThisOrder.tradedQty || 0);
      tradedPrice = Number(tradeForThisOrder.tradePrice || 0);
      tradedValue = Number(tradeForThisOrder.tradeValue || tradedQty * tradedPrice);

      detailsData = {
        exchangeOrderNo: tradeForThisOrder.exchangeOrderNo,
        orderDateTime: tradeForThisOrder.orderDateTime,
        productType: tradeForThisOrder.productType,
        tradedQty,
        tradedPrice,
        tradedValue,
      };
    }

    logSuccess(req, {
      msg: "Trade snapshot computed",
      tradedQty,
      tradedPrice,
      tradedValue,
      detailsData,
    });

    // 7️⃣ PNL
    let buyPrice = 0,
      buySize = 0,
      buyValue = 0,
      buyTime = "NA",
      pnl = 0;

    if (buyOrder) {
      buyPrice = Number(buyOrder?.fillprice || 0);
      buySize = Number(buyOrder?.fillsize || 0);
      buyValue = Number(buyOrder?.tradedValue || 0);
      buyTime = buyOrder?.filltime || "NA";
    }

    if (tradeForThisOrder) {
      pnl = tradedQty * tradedPrice - buyPrice * buySize;

      if (reqInput.transactiontype === "BUY") {
        pnl = 0;
        buyTime = "NA";
      }
    }

    logSuccess(req, {
      msg: "Calculated PnL",
      pnl,
      buyPrice,
      buySize,
      tradedQty,
      tradedPrice,
    });

    // 8️⃣ UPDATE LOCAL ORDER
    await newOrder.update({
      uniqueorderid: detailsData.exchangeOrderNo || orderid,
      exchorderupdatetime: detailsData.orderDateTime || null,
      exchtime: detailsData.orderDateTime || null,
      updatetime: detailsData.orderDateTime || null,
      text: placeRes.message || "",
      averageprice: tradedPrice || Number(reqInput.price || 0),
      lotsize: tradedQty || Number(reqInput.quantity || 0),
      symboltoken: reqInput.token,
      disclosedquantity: 0,
      triggerprice: Number(reqInput.triggerPrice || 0),
      price: reqInput.price,
      duration: "DAY",
      producttype: detailsData.productType || fyersProductType,
      orderstatuslocaldb: finalStatus,
      status: "COMPLETE",

      tradedValue,
      fillprice: tradedPrice,
      fillsize: tradedQty,
      fillid: tradeForThisOrder?.tradeNumber || null,
      pnl,
      buyTime,
      buyprice: buyPrice,
      buysize: buySize,
      buyvalue: buyValue,
    });

    logSuccess(req, { msg: "Final local DB update done", orderid, finalStatus });

    return {
      userId: user.id,
      broker: "Fyers",
      result: "SUCCESS",
      orderid,
    };
  } catch (err) {
    logError(req, err, { msg: "placeFyersOrder unexpected error" });

    return {
      userId: user.id,
      broker: "Fyers",
      result: "ERROR",
      message: err.message,
    };
  }
};


// ===========old workig code =============================
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
