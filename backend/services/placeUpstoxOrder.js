import axios from "axios";
import { Op } from "sequelize";
import Order from "../models/orderModel.js";


// Helper: map your productType to Upstox product code: I / D / MTF
async function getUpstoxProductCode(productType) {
  // Reuse your existing mapping if same as Kite (I / D etc.)
  // Example:
  switch ((productType || "").toUpperCase()) {
    case "INTRADAY":
    case "MIS":
    case "I":
      return "I";
    case "DELIVERY":
    case "CNC":
    case "D":
      return "D";
    case "MTF":
      return "MTF";
    default:
      return "D";
  }
}

// If you want to store variety-style info, you can still map it
function mapVarietyToUpstox(variety) {
  // Upstox doesn’t have "regular / amo" in the same way as Kite.
  // Keep as tag or internal field if you want.
  return variety || "REGULAR";
}


//
export const placeUpstoxOrder = async (user, reqInput, startOfDay, endOfDay, ) => {
  try {

    let upstoxAccessToken = await user.accessToken
   
    // 1) Map product / variety
    const upstoxProductType = await getUpstoxProductCode(reqInput.productType);
    const upstoxVariety = await mapVarietyToUpstox(reqInput.variety);



    // 2) CREATE LOCAL PENDING ORDER (same as Kite, broker=upstox)
    const instrumentToken =  `${reqInput.exch_seg || "NSE"}|${reqInput.token}`;
     

    const orderData = {
      symboltoken: reqInput.kiteToken || reqInput.token,
      variety: upstoxVariety,
      tradingsymbol: reqInput.kiteSymbol || reqInput.symbol,
      instrumenttype: reqInput.instrumenttype,
      transactiontype: reqInput.transactiontype, // BUY / SELL
      exchange: reqInput.exch_seg,
      ordertype: reqInput.orderType,            // MARKET / LIMIT / SL / SL-M
      quantity: reqInput.quantity,
      producttype: upstoxProductType,           // I / D / MTF
      price: reqInput.price,
      orderstatuslocaldb: "PENDING",
      totalPrice: reqInput.totalPrice,
      actualQuantity: reqInput.actualQuantity,
      userId: user.id,
      broker: "upstox",
      upstoxInstrumentToken: instrumentToken,
      upstoxSymbol: reqInput.kiteSymbol || reqInput.symbol,
      angelOneSymbol: reqInput.angelOneSymbol || reqInput.symbol, // keep if useful for your UI
      angelOneToken: reqInput.angelOneToken || reqInput.token,
      userNameId: user.username,
    };

    const newOrder = await Order.create(orderData);

    // 3) UPSTOX ORDER PAYLOAD (HFT V3)
    const placePayload = {
      quantity: Number(reqInput.quantity),
      product: upstoxProductType,           // I / D / MTF
      validity: "DAY",                      // or IOC if you support
      price: Number(reqInput.price) || 0,   // for MARKET, can be 0
      tag: `${user.id}_${Date.now()}`,      // optional tracking tag
      instrument_token: instrumentToken,    // e.g. "NSE_FO|43919"
      order_type: reqInput.orderType,       // MARKET / LIMIT / SL / SL-M
      transaction_type: 'BUY', // BUY / SELL
      disclosed_quantity: 0,
      trigger_price: 0,
      is_amo: false,                        // ignored by Upstox in live hours
      slice: true,                          // enable auto-slicing
    };


    const upstoxUrl = "https://api-hft.upstox.com/v3";

    const headersHft = {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${upstoxAccessToken}`,
    };

    const headersV2 = {
      Accept: "application/json",
      Authorization: `Bearer ${upstoxAccessToken}`,
    };

    // 4) PLACE ORDER IN UPSTOX
    let placeRes;
    try {
      const placeResp = await axios.post(
        `${upstoxUrl}/order/place`,
        placePayload,
        { headers: headersHft }
      );

      placeRes = placeResp.data;

      console.log(placeRes, "upstox place order");
    } catch (err) {
      console.log(
        "Upstox place order error:",
        err?.response?.data || err.message
      );

      await newOrder.update({
        orderstatuslocaldb: "FAILED",
        status: "FAILED",
        text: err?.response?.data?.errors?.[0]?.message || err.message,
        buyTime: new Date().toISOString().replace(/\.\d+Z$/, ".000Z"),
      });

      return {
        userId: user.id,
        broker: "Upstox",
        result: "BROKER_REJECTED",
        message: err?.response?.data?.errors?.[0]?.message || err.message,
      };
    }

    const orderid =
      placeRes?.data?.order_ids?.[0] || placeRes?.data?.order_id;

    if (!orderid) {
      throw new Error("Upstox did not return order_id");
    }

    // save order id
    await newOrder.update({ orderid });

    // 5) GET ORDER DETAILS FROM UPSTOX (v2 /order/details)
    let detailsData = {};
    try {
      const detailResp = await axios.get(
        `${upstoxUrl}/order/details`,
        {
          headers: headersV2,
          params: { order_id: orderid },
        }
      );

      detailsData = detailResp.data?.data || {};
      console.log(detailsData, "Upstox order details");
    } catch (e) {
      console.log(e?.response?.data || e.message, "get order details (upstox)");
      // details optional
    }

    // 6) HANDLE BUY / SELL LOGIC (same as Kite)
    let finalStatus = "OPEN";
    let buyOrder;

    if (reqInput.transactiontype === "SELL") {
      buyOrder = await Order.findOne({
        where: {
          userId: user.id,
          tradingsymbol: reqInput.kiteSymbol || reqInput.symbol,
          exchange: reqInput.exch_seg,
          quantity: reqInput.quantity,
          transactiontype: "BUY",
          status: "COMPLETE",
          orderstatuslocaldb: "OPEN",
          // createdAt: { [Op.between]: [startOfDay, endOfDay] },
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

    // 7) UPDATE LOCAL ORDER WITH BASIC DETAILS
    await newOrder.update({
      uniqueorderid: detailsData.exchange_order_id || null,
      averageprice: detailsData.average_price || detailsData.price || 0,
      lotsize: detailsData.quantity || Number(reqInput.quantity),
      symboltoken: instrumentToken,
      triggerprice: detailsData.trigger_price || 0,
      price: detailsData.price || Number(reqInput.price) || 0,
      orderstatuslocaldb: finalStatus,
      status: (detailsData.status || finalStatus).toUpperCase(),
      // keep timestamps as strings; Upstox uses "03-Aug-2017 15:03:42"
      exchorderupdatetime: detailsData.exchange_timestamp || null,
      exchtime: detailsData.exchange_timestamp || null,
      updatetime: detailsData.order_timestamp || null,
    });

    console.log("update in local db 2 (upstox)");

    // 8) TRADES FETCH (v2 /order/trades?order_id=)
    try {
      const tradesResp = await axios.get(
        `${upstoxBaseUrl}/order/trades`,
        {
          headers: headersV2,
          params: { order_id: orderid },
        }
      );

      const trades = tradesResp.data?.data || [];
      console.log(trades, "upstox trades");

      if (Array.isArray(trades) && trades.length > 0) {
        const t = trades[0];

        console.log(t, "t (upstox)");

        const buyPrice = buyOrder?.fillprice || 0;
        const buySize = buyOrder?.fillsize || 0;
        const buyValue = buyOrder?.tradedValue || 0;
        let buyTime = buyOrder?.filltime || 0;

        let pnl =
          Number(reqInput.quantity) * Number(t.average_price || 0) -
          buyPrice * buySize;

        if (t.transaction_type === "BUY") {
          pnl = 0;
          buyTime = "NA";
        }

        await newOrder.update({
          tradedValue: Number(t.average_price || 0) * Number(reqInput.quantity),
          fillprice: Number(t.average_price || 0),
          fillsize: Number(reqInput.quantity),
          fillid: t.trade_id,
          price: Number(t.average_price || 0),
          filltime: t.exchange_timestamp || t.order_timestamp || null,
          status: "COMPLETE",
          pnl: pnl,
          buyTime: buyTime,
          buyprice: buyPrice,
          buysize: buySize,
          buyvalue: buyValue,
        });

        console.log("update in local db 3 (upstox)");
      } else {
        console.log(trades, "no trades for upstox order");
      }
    } catch (e) {
      console.log(e?.response?.data || e.message, "get order trade (upstox)");
    }

    return {
      userId: user.id,
      broker: "Upstox",
      result: "SUCCESS",
      orderid,
    };
  } catch (err) {
    console.log(err, "err (upstox)");

    return {
      userId: user.id,
      broker: "Upstox",
      result: "ERROR",
      message: err.message,
    };
  }
};



export const placeUpstoxOrderLocalDb = async ( user,reqInput,startOfDay,endOfDay) => {
  try {

    // 1) Access token (from arg or user)
    const accessToken =  await user.accessToken

    const upstoxUrl = "https://api-hft.upstox.com/v3";

    const headersHft = {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
    };

    const headersV2 = {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
    };

    // ----------------------------------------
    // 2) CREATE LOCAL PENDING ORDER
    // ----------------------------------------
    const instrumentToken =
      reqInput.upstoxInstrumentToken ||
      reqInput.instrument_token ||
      `${reqInput.exch_seg || "NSE"}|${reqInput.token || reqInput.kiteToken}`;

    const orderData = {
      symboltoken: reqInput.kiteToken || reqInput.token,
      variety: reqInput.variety || "regular",
      tradingsymbol: reqInput.kiteSymbol || reqInput.symbol,
      instrumenttype: reqInput.instrumenttype,
      transactiontype: reqInput.transactiontype, // BUY / SELL
      exchange: reqInput.exch_seg,
      ordertype: reqInput.orderType, // MARKET / LIMIT / SL / SL-M
      quantity: reqInput.quantity,
      producttype: reqInput.productType, // you can map to I/D/MTF if needed
      price: reqInput.price,
      orderstatuslocaldb: "PENDING",
      totalPrice: reqInput.totalPrice,
      actualQuantity: reqInput.actualQuantity,
      userId: user.id,
      broker: "upstox",
      angelOneSymbol: reqInput.angelOneSymbol || reqInput.symbol,
      angelOneToken: reqInput.angelOneToken || reqInput.token,
      userNameId: user.username,
      buyOrderId: reqInput?.buyOrderId,
      upstoxInstrumentToken: instrumentToken,
    };

    console.log(orderData, "orderData (upstox)");

    const newOrder = await Order.create(orderData);

    // ----------------------------------------
    // 3) UPSTOX HFT PAYLOAD
    // ----------------------------------------
    const orderParams = {
      quantity: Number(reqInput.quantity),
      product: reqInput.productType, // you can ensure it's I / D / MTF from frontend
      validity: "DAY",
      price: Number(reqInput.price) || 0, // MARKET can be 0
      tag: `${user.id}_${Date.now()}`,
      instrument_token: instrumentToken, // e.g. "NSE_FO|43919"
      order_type: reqInput.orderType, // MARKET / LIMIT / SL / SL-M
      transaction_type: reqInput.transactiontype, // BUY / SELL
      disclosed_quantity: 0,
      trigger_price: 0,
      is_amo: false,
      slice: true,
    };

    console.log(orderParams, "db orderParams done (upstox)");

    // ----------------------------------------
    // 4) PLACE ORDER IN UPSTOX
    // ----------------------------------------
    let placeRes;
    try {
      const resp = await axios.post(
        `${upstoxUrl}/order/place`,
        orderParams,
        { headers: headersHft }
      );

      placeRes = resp.data;
      console.log(placeRes, "upstox place order");
    } catch (err) {
      console.log(err?.response?.data || err.message, "upstox place order");

      const msg =
        err?.response?.data?.errors?.[0]?.message ||
        err?.response?.data?.message ||
        err.message;

      await newOrder.update({
        orderstatuslocaldb: "FAILED",
        status: "FAILED",
        text: msg,
        buyTime: new Date().toISOString().replace(/\.\d+Z$/, ".000Z"),
      });

      return {
        userId: user.id,
        broker: "Upstox",
        result: "BROKER_REJECTED",
        message: msg,
      };
    }

    const orderid =
      placeRes?.data?.order_ids?.[0] || placeRes?.data?.order_id;

    if (!orderid) {
      throw new Error("Upstox did not return order_id");
    }

    // save order id
    await newOrder.update({ orderid });

    // ----------------------------------------
    // 5) GET ORDER TRADES (USED AS DETAILS)
    //    Upstox: GET /v2/order/trades?order_id=...
    // ----------------------------------------
    let detailsData = {};
    try {
      const tradesResp = await axios.get(
        `${upstoxUrl}/order/trades`,
        {
          headers: headersV2,
          params: { order_id: orderid },
        }
      );

      const trades = tradesResp.data?.data || [];

      if (Array.isArray(trades) && trades.length > 0) {
        detailsData = trades[0]; // first trade as "details"
      }
    } catch (e) {
      console.log(
        e?.response?.data || e.message,
        "get order history (upstox)"
      );
      // details optional
    }

    // ----------------------------------------
    // 6) HANDLE BUY / SELL LOGIC
    // ----------------------------------------
    let finalStatus = "OPEN";
    let buyOrder;

    if (reqInput.transactiontype === "SELL") {
      buyOrder = await Order.findOne({
        where: {
          userId: user.id,
          tradingsymbol: reqInput.kiteSymbol || reqInput.symbol,
          exchange: reqInput.exch_seg,
          quantity: reqInput.quantity,
          transactiontype: "BUY",
          status: "COMPLETE",
          orderstatuslocaldb: "OPEN",
          // createdAt: { [Op.between]: [startOfDay, endOfDay] },
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

    console.log(detailsData, "detailRes (upstox)");

    // ----------------------------------------
    // 7) UPDATE LOCAL ORDER WITH FINAL STATUS
    // ----------------------------------------
    const avgPrice = Number(detailsData.average_price || reqInput.price || 0);
    const qty = Number(detailsData.quantity || reqInput.quantity || 0);
    const exchTime =
      detailsData.exchange_timestamp ||
      detailsData.order_timestamp ||
      null;

    await newOrder.update({
      ...detailsData, // optional: only if you’re okay storing raw fields
      uniqueorderid: detailsData.exchange_order_id || null,
      exchorderupdatetime: exchTime,
      exchtime: exchTime,
      updatetime: exchTime,
      averageprice: avgPrice,
      lotsize: qty,
      symboltoken: instrumentToken,
      triggerprice: Number(detailsData.trigger_price || 0),
      price: avgPrice,
      orderstatuslocaldb: finalStatus,
    });

    // ----------------------------------------
    // 8) (OPTIONAL) TRADES FETCH FOR PNL (again)
    // ----------------------------------------
    try {
      const tradesResp = await axios.get(
        `${upstoxUrl}/order/trades`,
        {
          headers: headersV2,
          params: { order_id: orderid },
        }
      );

      const trades = tradesResp.data?.data || [];
      console.log(trades, "trades (upstox)");

      if (Array.isArray(trades) && trades.length > 0) {
        const t = trades[0];

        const tradeAvg = Number(t.average_price || avgPrice || 0);

        const buyPrice = buyOrder?.fillprice || 0;
        const buySize = buyOrder?.fillsize || 0;
        const buyValue = buyOrder?.tradedValue || 0;
        let buyTime = buyOrder?.filltime || 0;

        let pnl =
          Number(reqInput.quantity) * tradeAvg - buyPrice * buySize;

        if (t.transaction_type === "BUY") {
          pnl = 0;
          buyTime = "NA";
        }

        console.log(t, "trade data (upstox)");

        await newOrder.update({
          tradedValue: tradeAvg * Number(reqInput.quantity),
          fillprice: tradeAvg,
          fillsize: Number(reqInput.quantity),
          fillid: t.trade_id,
          filltime: t.exchange_timestamp || t.order_timestamp || exchTime,
          status: "COMPLETE",
          pnl: pnl,
          buyTime: buyTime,
          buyprice: buyPrice,
          buysize: buySize,
          buyvalue: buyValue,
        });
      } else {
        console.log(trades, "no trades (upstox)");
      }
    } catch (e) {
      console.log(
        e?.response?.data || e.message,
        "get order trade (upstox)"
      );
    }

    return {
      userId: user.id,
      broker: "Upstox",
      result: "SUCCESS",
      orderid,
    };
  } catch (err) {
    console.log(err, "err (upstox)");

    return {
      userId: user.id,
      broker: "Upstox",
      result: "ERROR",
      message: err.message,
    };
  }
};