// services/fyers/placeFyersOrder.js

import { setFyersAccessToken, fyers } from "../utils/fyersClient.js";
import Order from "../models/orderModel.js";
import { Op } from "sequelize";


/**
 * Map your generic productType to Fyers productType
 * Fyers examples: "INTRADAY", "CNC", "MTF", etc.
 */
function getFyersProductCode(type) {
  if (!type) return "INTRADAY";

  switch (type.toUpperCase()) {
    case "INTRADAY":
      return "INTRADAY"; // as per your sample
    case "DELIVERY":
      return "CNC";      // delivery / cash-n-carry
    case "CNC":
    case "MTF":
      return type.toUpperCase();
    default:
      return type;
  }
}

/**
 * Map your orderType ("LIMIT", "MARKET", "SL", "SL-M") to Fyers numeric `type`
 * From Fyers docs:
 * 1 = LIMIT, 2 = MARKET, 3 = SL, 4 = SL-M
 */
function mapFyersOrderType(orderType) {
  if (!orderType) return 1;

  switch (orderType.toUpperCase()) {
    case "LIMIT":
      return 1;
    case "MARKET":
      return 2;
    case "SL":
      return 3;
    case "SL-M":
      return 4;
    default:
      return 1;
  }
}

/**
 * Main Fyers place-order flow (parallel to placeKiteOrder)
 */
export const placeFyersOrder = async (user, reqInput, startOfDay, endOfDay) => {
  try {
    // 1) Set Fyers access token (per user)
    await setFyersAccessToken(user.authToken);

    const fyersProductType = getFyersProductCode(reqInput.productType);

    const fyersOrderType = mapFyersOrderType(reqInput.orderType);

    const isLimitType  = fyersOrderType === 1 || fyersOrderType === 3; // LIMIT, SL
    const isMarketType = fyersOrderType === 2 || fyersOrderType === 4; // MARKET, SL-M

    // Fyers rules:
    const limitPrice =
      isLimitType ? Number(reqInput.price || 0) : 0;   // LIMIT/SL need limitPrice, MARKET/SL-M must be 0

    const stopPrice =
      (fyersOrderType === 3 || fyersOrderType === 4)
        ? Number(reqInput.triggerPrice || 0)          // SL / SL-M must have stopPrice
        : 0;


    // Build Fyers symbol: "NSE:SBIN-EQ"
     // Build Fyers symbol: "NSE:SBIN-EQ"
    const fyersSymbol =
       `${reqInput.exch_seg}:${reqInput.symbol}`;


    // ----------------------------------------
    // 2) CREATE LOCAL PENDING ORDER (similar to Kite)
    // ----------------------------------------
    const orderData = {
      symboltoken: reqInput.token,
      variety: reqInput.variety || "NORMAL",
      tradingsymbol: reqInput.symbol,
      instrumenttype: reqInput.instrumenttype,
      transactiontype: reqInput.transactiontype, // BUY / SELL
      exchange: reqInput.exch_seg,              // NSE / NFO etc.
      ordertype: reqInput.orderType,            // LIMIT / MARKET / SL / SL-M
      quantity: reqInput.quantity,
      product: fyersProductType,                // INTRADAY / CNC / MTF
      price: reqInput.price,
      orderstatuslocaldb: "PENDING",
      userId: user.id,
      userNameId: user.username,
      totalPrice: reqInput.totalPrice,
      actualQuantity: reqInput.actualQuantity,
      broker: "Fyers",
    };


    

    const newOrder = await Order.create(orderData);

    // ----------------------------------------
    // 3) FYERS ORDER PAYLOAD
    // ----------------------------------------
    const fyersReqBody = {
      symbol: fyersSymbol,                       // "NSE:SBIN-EQ"
      qty: Number(reqInput.quantity),
      type: fyersOrderType,                      // 1,2,3,4
      side: reqInput.transactiontype === "BUY" ? 1 : -1,     // 1 = BUY, -1 = SELL
      productType: fyersProductType,             // "INTRADAY", "CNC", ...
      limitPrice,                              // ✅ now correct per order type
      stopPrice,                               // ✅ only non-zero for SL / SL-M
      disclosedQty: 0,
      validity: "DAY",                           // or IOC, GTC etc.
      offlineOrder: false,
      stopLoss: 0,
      takeProfit: 0,
      orderTag: reqInput.orderTag || `U${user.id}`, // you can customize
    };

    // ----------------------------------------
    // 4) PLACE ORDER IN FYERS
    // ----------------------------------------
    let placeRes;
    try {

      console.log(fyersReqBody,'fyersReqBody');
      
      placeRes = await fyers.place_order(fyersReqBody);

      if (!placeRes || placeRes.s !== "ok") {
        const msg = placeRes?.message || "Fyers order placement failed";

        await newOrder.update({
          orderstatuslocaldb: "FAILED",
          status: "FAILED",
          text: msg,
        });

        return {
          userId: user.id,
          broker: "Fyers",
          result: "BROKER_REJECTED",
          message: msg,
        };
      }
    } catch (err) {
      console.log("Fyers place_order error:", err);

      await newOrder.update({
        orderstatuslocaldb: "FAILED",
        status: "FAILED",
        text: err.message,
      });

      return {
        userId: user.id,
        broker: "Fyers",
        result: "BROKER_REJECTED",
        message: err.message,
      };
    }

    const orderid = placeRes.id; // e.g. "52104097616"

    // Save order id
    await newOrder.update({ orderid });

    // ----------------------------------------
    // 5) HANDLE BUY / SELL LOGIC (same as Kite)
    // ----------------------------------------
    let finalStatus = "OPEN";
    let buyOrder;

    if (reqInput.transactiontype === "SELL") {
      // find today's OPEN BUY to close
      buyOrder = await Order.findOne({
        where: {
          userId: user.id,
          tradingsymbol: reqInput.symbol,
          exchange: reqInput.exch_seg,
          transactiontype: "BUY",
          orderstatuslocaldb: "OPEN",
          createdAt: { [Op.between]: [startOfDay, endOfDay] },
        },
        raw: true,
      });

      if (buyOrder) {
        await Order.update(
          { orderstatuslocaldb: "COMPLETE" },
          { where: { id: buyOrder.id } }
        );
      }

      finalStatus = "COMPLETE";
    }

    // ----------------------------------------
    // 6) GET TRADEBOOK (DETAILS + PNL)
    // ----------------------------------------
    let tradeForThisOrder = null;

    try {
      const tradeRes = await fyers.get_tradebook(); // full tradebook

      if (tradeRes && tradeRes.s === "ok" && Array.isArray(tradeRes.tradeBook)) {
        // Filter trades for this orderNumber (same as placeRes.id)
        const tradesForOrder = tradeRes.tradeBook.filter(
          (t) => t.orderNumber === orderid
        );

        if (tradesForOrder.length > 0) {
          // Take the last trade for details
          tradeForThisOrder = tradesForOrder[tradesForOrder.length - 1];
        }
      }
    } catch (err) {
      console.log("Fyers get_tradebook error:", err);
    }

    // Default details (if no trade yet)
    let detailsData = {};
    let tradedQty = 0;
    let tradedPrice = 0;
    let tradedValue = 0;

    if (tradeForThisOrder) {
      tradedQty = tradeForThisOrder.tradedQty || 0;
      tradedPrice = tradeForThisOrder.tradePrice || 0;
      tradedValue = tradeForThisOrder.tradeValue || tradedQty * tradedPrice;

      detailsData = {
        exchangeOrderNo: tradeForThisOrder.exchangeOrderNo,
        orderDateTime: tradeForThisOrder.orderDateTime,
        productType: tradeForThisOrder.productType,
        tradedQty,
        tradedPrice,
        tradedValue,
      };
    }

    // ----------------------------------------
    // 7) CALCULATE PNL (if we have trade + previous BUY)
    // ----------------------------------------
    let buyPrice = 0;
    let buySize = 0;
    let buyValue = 0;
    let pnl = 0;

    if (buyOrder) {
      buyPrice = buyOrder.fillprice || 0;
      buySize = buyOrder.fillsize || 0;
      buyValue = buyOrder.tradedValue || 0;
    }

    if (tradeForThisOrder) {
      pnl = tradedQty * tradedPrice - buyPrice * buySize;

      // For BUY leg, keep PNL 0 until SELL happens
      if (reqInput.transactiontype === "BUY") {
        pnl = 0;
      }
    }

    // ----------------------------------------
    // 8) UPDATE LOCAL ORDER WITH FINAL STATUS + DETAILS
    // ----------------------------------------
    await newOrder.update({
      // Map to your DB columns similar to Kite
      uniqueorderid: detailsData.exchangeOrderNo || orderid,
      exchorderupdatetime: detailsData.orderDateTime || null,
      exchtime: detailsData.orderDateTime || null,
      updatetime: detailsData.orderDateTime || null,
      text: placeRes.message || "",
      averageprice: tradedPrice || reqInput.price || 0,
      lotsize: tradedQty || reqInput.quantity,
      symboltoken: reqInput.token,
      disclosedquantity: 0,
      triggerprice: Number(reqInput.triggerPrice || 0),
      price: reqInput.price,
      duration: "DAY",
      producttype: detailsData.productType || fyersProductType,
      orderstatuslocaldb: finalStatus,
      status:"COMPLETE",
      // Trade / PNL fields
      tradedValue: tradedValue,
      fillprice: tradedPrice,
      fillsize: tradedQty,
      fillid: tradeForThisOrder?.tradeNumber || null,
      pnl,
      buyprice: buyPrice,
      buysize: buySize,
      buyvalue: buyValue,
    });

    return {
      userId: user.id,
      broker: "Fyers",
      result: "SUCCESS",
      orderid,
    };
  } catch (err) {
    console.log("placeFyersOrder ERROR:", err);

    return {
      userId: user.id,
      broker: "Fyers",
      result: "ERROR",
      message: err.message,
    };
  }
};
