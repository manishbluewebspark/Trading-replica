

import axios from "axios";
import Order from "../models/orderModel.js";
import { logSuccess, logError } from "../utils/loggerr.js";
import { raw } from "express";


// -----------------------
// API ENDPOINTS
// -----------------------
const ANGEL_ONE_PLACE_URL =
  "https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/placeOrder";

const ANGEL_ONE_DETAILS_URL = (uniqueId) =>
  `https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/details/${uniqueId}`;

const ANGEL_ONE_TRADE_BOOK_URL =
  "https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/getTradeBook";

const ANGEL_ONE_POSITION_URL =
  "https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/getPosition";  

const ANGEL_ONE_ORDER_BOOK_URL =
  "https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/getOrderBook";










// -----------------------
// HEADERS
// -----------------------
const angelHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
  "Accept": "application/json",
  "X-UserType": "USER",
  "X-SourceID": "WEB",
  'X-ClientLocalIP': process.env.CLIENT_LOCAL_IP, 
  'X-ClientPublicIP': process.env.CLIENT_PUBLIC_IP, 
  'X-MACAddress': process.env.MAC_Address, 
  'X-PrivateKey': process.env.PRIVATE_KEY, 
});



// -----------------------
// HELPERS
// -----------------------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function extractBrokerError(err) {

  if (!err) return { status: null, msg: "Unknown error", data: null };

  const status = err?.response?.status || null;
  const data = err?.response?.data;

  const msg =
    (typeof data === "string" && data) ||
    data?.message ||
    data?.emsg ||
    err?.message ||
    "Unknown error";

  return { status, msg, data };
}





async function getDetailsWithPolling(user, uniqueOrderId, req) {
  const maxPolls = 6;

  for (let i = 0; i < maxPolls; i++) {
    try {
      const det = await axios.get(ANGEL_ONE_DETAILS_URL(uniqueOrderId), {
        headers: angelHeaders(user.authToken),
      });

      const st = det?.data?.data?.status;

      logSuccess(req, {
        msg: "AngelOne details poll",
        uniqueOrderId,
        poll: i + 1,
        status: st,
      });

      if (st === "complete" || st === "rejected" || st === "cancelled") {
        return det.data;
      }

      // open/pending/transit etc -> wait then retry
      await sleep(400 + i * 200);
    } catch (err) {
      const e = extractBrokerError(err);
      logError(req, err, { msg: "AngelOne details poll failed", extracted: e });

      // If rate limited, wait and retry
      if (e.status === 403 && String(e.msg).includes("exceeding access rate")) {
        await sleep(600 + i * 400);
        continue;
      }

      if (i === maxPolls - 1) throw err;
      await sleep(500 + i * 300);
    }
  }

  return null;
}


async function getTradebookWithRetry(
  user,
  orderid,
  expectedQty,
  req,
  maxTry = 5
) {
  let lastTradebook = null;

  for (let i = 0; i < maxTry; i++) {
    try {
      const tradeRes = await axios.get(ANGEL_ONE_TRADE_BOOK_URL, {
        headers: angelHeaders(user.authToken),
      });

      const trades = tradeRes?.data?.data || [];

      const orderTrades = trades.filter(t => String(t.orderid) === String(orderid));

      const totalQty = orderTrades.reduce((sum, t) => sum + Number(t?.fillsize || t?.quantity || 0), 0);

      logSuccess(req, {
        msg: "AngelOne tradebook retry",
        attempt: i + 1,
        tradesCount: trades.length,
        totalQty,
        expectedQty,
      });

      // ✅ FULL FILL CONFIRMED
      if (totalQty >= expectedQty) {
        return tradeRes.data;
      }

      lastTradebook = tradeRes.data;
    } catch (err) {
      const e = extractBrokerError(err);

      logError(req, err, {
        msg: "AngelOne tradebook retry failed",
        attempt: i + 1,
        extracted: e,
      });

      // rate limit
      if (e.status === 403 && String(e.msg).includes("exceeding access rate")) {
        await sleep(800 * Math.pow(2, i));
        continue;
      }

      // network error
      if (!e.status) {
        await sleep(600 * Math.pow(2, i));
        continue;
      }

      throw err;
    }

    // wait before next poll
    await sleep(500);
  }

  // ❗ retries exhausted → return best available snapshot
  return lastTradebook;
}



// =======================
// SINGLE placeAngelOrder (FULL UPDATED)
// =======================
export const placeAngelOrder = async (user, reqInput, req, sellQuantityPartial = 0) => {
  let tempOrder = null;          // NEW TEMP ORDER (BUY/SELL)
  let existingBuyOrder = null;   // OLD OPEN BUY
  const nowISOError = new Date().toISOString();

   logSuccess(req, {
      msg: `incoming data`,
      body:reqInput
    });

  try {
    
    // ====================================================
    // 1️⃣ READ existing BUY (NO UPDATE HERE)
    // ====================================================
    if ((reqInput.transactiontype || "").toUpperCase() === "BUY") {
      existingBuyOrder = await Order.findOne({
        where: {
          userId: user.id,
          ordertype: reqInput.orderType,
          producttype: reqInput.productType,
          tradingsymbol: reqInput.symbol,
          transactiontype: "BUY",
          orderstatuslocaldb: "OPEN",
          status:"COMPLETE",
        },
      });

      if (existingBuyOrder) {
        logSuccess(req, {
          msg: "Found existing OPEN BUY order for potential merge",
          orderid: existingBuyOrder.id,
        });
      }
    }

    // ====================================================
    // 2️⃣ ALWAYS CREATE NEW TEMP ORDER
    // ====================================================
    const orderData = {
      variety: reqInput.variety || "NORMAL",
      tradingsymbol: reqInput.symbol,
      instrumenttype: reqInput.instrumenttype,
      symboltoken: reqInput.token,
      transactiontype: reqInput.transactiontype,
      exchange: reqInput.exch_seg,
      ordertype: reqInput.orderType,
      quantity: String(reqInput.quantity),
      producttype: reqInput.productType,
      duration: reqInput.duration,
      price: reqInput.price || "0",
      triggerprice: reqInput.triggerprice || 0,
      squareoff: reqInput.squareoff || 0,
      stoploss: reqInput.stoploss || 0,
      orderstatuslocaldb: "PENDING",
      totalPrice: reqInput.totalPrice ?? null,
      actualQuantity: reqInput.actualQuantity ?? null,
      userId: user.id,
      userNameId: user.username,
      ordertag: "softwaresetu",
      broker: "angelone",
      buyOrderId: reqInput?.buyOrderId || null,
      strategyName: reqInput?.groupName || "",
      strategyUniqueId: reqInput?.strategyUniqueId || "",
      text: reqInput?.text||"",
      angelOneSymbol: reqInput.angelOneSymbol || reqInput.symbol,
      angelOneToken: reqInput.angelOneToken || reqInput.token,
    };

    tempOrder = await Order.create(orderData);
    
    logSuccess(req, {
      msg: `Temp ${reqInput.transactiontype} order created in DB`,
      tempOrderId: tempOrder.id,
      quantity: tempOrder.quantity,
    });

    // ====================================================
    // 3️⃣ PLACE BROKER ORDER
    // ====================================================
    let placeRes;
    try {
      placeRes = await axios.post(
        ANGEL_ONE_PLACE_URL,
        {
          variety: (reqInput.variety || "NORMAL").toUpperCase(),
          tradingsymbol: reqInput.symbol,
          symboltoken: String(reqInput.token),
          transactiontype: reqInput.transactiontype.toUpperCase(),
          exchange: reqInput.exch_seg,
          ordertype: reqInput.orderType.toUpperCase(),
          producttype: reqInput.productType.toUpperCase(),
          duration: "DAY",
          ordertag:"softwareetu",
          price: reqInput.price || 0,
          triggerprice: reqInput.triggerprice || 0,
          squareoff: reqInput.squareoff || 0,
          stoploss: reqInput.stoploss || 0,
          quantity: Number(reqInput.quantity),
        },
        { headers: angelHeaders(user.authToken) }
      );
      logSuccess(req, {
        msg: "AngelOne API call success: order placed",
        orderType: reqInput.transactiontype,
        tempOrderId: tempOrder.id,
      });
    } catch (err) {
      await tempOrder.update({
        orderstatuslocaldb: "FAILED",
        status: "FAILED",
        positionStatus: "FAILED",
        text: extractBrokerError(err).msg,
      });
      logSuccess(req, {
        msg: "AngelOne API call failed: order rejected",
        error: extractBrokerError(err).msg,
        tempOrderId: tempOrder.id,
      });
      return { result: "BROKER_REJECTED" };
    }

    if (!placeRes.data?.status) {
      await tempOrder.update({
        orderstatuslocaldb: "FAILED",
        status: "FAILED",
        positionStatus: "FAILED",
        text: placeRes.data?.message,
      });
      logSuccess(req, {
        msg: "AngelOne order rejected by broker",
        brokerMessage: placeRes.data?.message,
        tempOrderId: tempOrder.id,
      });
      return { result: "BROKER_REJECTED" };
    }

    const orderid = placeRes.data.data.orderid;
    const uniqueOrderId = placeRes.data.data.uniqueorderid;

    await tempOrder.update({ orderid, uniqueorderid: uniqueOrderId });
    logSuccess(req, {
      msg: "AngelOne order successfully registered in DB",
      orderid,
      uniqueOrderId,
    });

    // ====================================================
    // 4️⃣ DETAILS POLLING
    // ====================================================
    const detData = await getDetailsWithPolling(user, uniqueOrderId, req);
    const detailsStatus = detData?.data?.status;
    const detailsText = detData?.data?.text || "";

    if ([ 
        "open",
        "trigger pending",
        "rejected",
        "cancelled",
        "pending",
      ].includes(detailsStatus)) {
      await tempOrder.update({
        orderstatuslocaldb: detailsStatus.toUpperCase(),
        status: detailsStatus.toUpperCase(),
        positionStatus: detailsStatus.toUpperCase(),
        text: detailsText,
      });
      logSuccess(req, {
        msg: `AngelOne order ${detailsStatus.toUpperCase()}`,
        orderid,
        tempOrderId: tempOrder.id,
        brokerMessage: detailsText,
      });

      
      return { result: detailsStatus.toUpperCase() };
    }

    // ====================================================
    // 5️⃣ TRADEBOOK
    // ====================================================
    const tradeData = await getTradebookWithRetry(user, orderid,reqInput.quantity, req);
    const fills = tradeData?.data?.filter(t => String(t.orderid) === String(orderid));

    if (!fills?.length) {
      await tempOrder.update({
        orderstatuslocaldb: "OPEN",
        positionStatus: "OPEN",
        status: detailsStatus === "complete" ? "COMPLETE" : "OPEN",
        text: "TRADE_NOT_FOUND_YET ,MAYBE ORDER IS REJECTED !",
      });
      logSuccess(req, {
        msg: "Trade not found yet in AngelOne tradebook",
        tempOrderId: tempOrder.id,
      });
      return { result: "PENDING" };
    }

    let totalQty = 0;
    let totalValue = 0;
    fills.forEach(f => {
      totalQty += Number(f.fillsize);
      totalValue += Number(f.fillsize) * Number(f.fillprice);
    });

    const avgPrice = totalValue / totalQty;
    const matched = fills[0];

    // ====================================================
    // 6️⃣ SELL PAIRING + PARTIAL (SAFE)
    // ====================================================
    let finalStatus = "OPEN";
    let positionStatus = "OPEN";
    let buyOrder = null;

    if ((reqInput.transactiontype || "").toUpperCase() === "SELL") {
      buyOrder = await Order.findOne({
        where: { userId: user.id, orderid: reqInput.buyOrderId },
      });

        const originalQty = Number(buyOrder.fillsize || buyOrder.quantity);
        const usedQty = totalQty;
        const remainingBuyQty = originalQty - usedQty;

      // SELL success → finalize temp SELL
      finalStatus = "COMPLETE";
      positionStatus = "COMPLETE";

      await tempOrder.update({
        fillsize: totalQty,
        quantity: totalQty,
        tradedValue: avgPrice * totalQty,
        price: avgPrice,
        fillprice: avgPrice,
        filltime: nowISOError,
        fillid: matched.fillid,
        pnl: (avgPrice - Number(buyOrder?.fillprice || 0)) * totalQty||0,
        buyOrderId: reqInput?.buyOrderId||buyOrder.orderid,
        buyTime: buyOrder?.filltime,
        buyprice: buyOrder?.fillprice,
        buysize:totalQty|| buyOrder?.quantity,
        buyvalue: buyOrder?.tradedValue,
        positionStatus,
        status: "COMPLETE",
        orderstatuslocaldb: finalStatus,
      });


      logSuccess(req, {
        msg: "SELL order executed successfully, temp SELL updated",
        tempOrderId: tempOrder.id,
        sellQty: totalQty,
      });

      // PARTIAL SELL → update original BUY + insert BUY clone
      if (remainingBuyQty > 0) {
        const remainingQty = Number(buyOrder.fillsize || buyOrder.quantity) - totalQty;

        // UPDATE ORIGINAL BUY
        await buyOrder.update({
          fillsize: remainingQty,
          quantity: remainingQty,
          tradedValue: Number(buyOrder.tradedValue || 0) - Number(buyOrder.fillprice || buyOrder.price) * totalQty,
        });
        logSuccess(req, {
          msg: "Original BUY order reduced after partial SELL",
          originalBuyId: buyOrder.id,
          remainingQty,
        });

        // Compute used qty & remaining qty
        const usedQty = totalQty;
        const buyFillPrice = Number(buyOrder.fillprice || buyOrder.price);

          // INSERT BUY CLONE FOR PARTIAL SELL
          await Order.create({
          variety: buyOrder.variety,
          tradingsymbol: buyOrder.tradingsymbol,
          instrumenttype: buyOrder.instrumenttype,
          symboltoken: buyOrder.symboltoken,
          transactiontype: "BUY",
          exchange: buyOrder.exchange,
          ordertype: buyOrder.ordertype,
          producttype: buyOrder.producttype,
          duration: buyOrder.duration,

          // qty split		
          quantity: usedQty,
          fillsize: usedQty,
          price: buyFillPrice,
          fillprice: buyFillPrice,

          // recompute values
          tradedValue: buyFillPrice * usedQty,
          buyvalue: 0,

          // meta copy		
          userId: buyOrder.userId,
          userNameId: buyOrder.userNameId,
          broker: buyOrder.broker,
          angelOneSymbol: buyOrder.angelOneSymbol,
          angelOneToken: buyOrder.angelOneToken,
          strategyName: buyOrder.strategyName,
          strategyUniqueId: buyOrder.strategyUniqueId,
          filltime: buyOrder.filltime,
          uniqueorderid: buyOrder.uniqueorderid,

          // status		
          orderstatuslocaldb: "COMPLETE",
          status: "COMPLETE",
          positionStatus: "COMPLETE",
          text: "BUY_SPLIT_FOR_SELL",
      });

        logSuccess(req, {
          msg: "BUY clone inserted for corresponding partial SELL",
          cloneQty: totalQty,
        });
        
    return {
        result: "SUCCESS",
        orderid: "",
        uniqueOrderId: "",
        userId: user.id,
        broker: "AngelOne",
      };
      }else{

         logSuccess(req, {
          msg: "Updating Full BUY Quantity with !",
          orderstatuslocaldb: "COMPLETE",
          positionStatus: "COMPLETE",
        });

          // =================================
           // Uodate Full Quantity 
           // =================================
         await buyOrder.update({
          orderstatuslocaldb: "COMPLETE",
          positionStatus: "COMPLETE",
          
        });

         logSuccess(req, {
          msg: "Updated Full BUY Quantity with !",
          orderstatuslocaldb: "COMPLETE",
          positionStatus: "COMPLETE",
        });

    return {
        result: "SUCCESS",
        orderid: "",
        uniqueOrderId: "",
        userId: user.id,
        broker: "AngelOne",
      };
      }
    }

    // ====================================================
    // 7️⃣ SAFE BUY MERGE (LAST STEP)
    // ====================================================
    if ((reqInput.transactiontype || "").toUpperCase() === "BUY" && existingBuyOrder) {
      const mergedQty = Number(existingBuyOrder.fillsize || 0) + totalQty;
      const mergedValue = Number(existingBuyOrder.tradedValue || 0) + avgPrice * totalQty;
      const mergedAvg = mergedValue / mergedQty;

      await existingBuyOrder.update({
        fillsize: mergedQty,
        quantity: mergedQty,
        tradedValue: mergedValue,
        price: mergedAvg,
        fillprice: mergedAvg,
      });

      await tempOrder.destroy();
      logSuccess(req, {
        msg: "Existing BUY merged with new BUY",
        existingBuyId: existingBuyOrder.id,
        mergedQty,
      });

      return {
        result: "SUCCESS",
        orderid: existingBuyOrder.id,
        uniqueOrderId: existingBuyOrder.uniqueorderid,
        userId: user.id,
        broker: "AngelOne",
      };
    }


     const pnl =
      tempOrder.transactiontype === "SELL" && buyOrder
        ? avgPrice * totalQty - Number(buyOrder?.fillprice) * totalQty
        : 0;

     // =================== FINAL UPDATE FOR THIS ORDER ==================
    await tempOrder.update({
      tradedValue: avgPrice * totalQty,
      fillprice: avgPrice,
      price: avgPrice,
      fillsize: totalQty,
      quantity: totalQty,
      filltime: matched?.fill_timestamp
        ? new Date(matched.fill_timestamp).toISOString()
        : nowISOError,

      fillid: matched?.fillid,
      pnl,
      buyOrderId: buyOrder?.orderid || 0,
      buyprice: buyOrder?.fillprice||0,
      buyTime: buyOrder?.filltime||null,
      buysize: tempOrder?.transactiontype === "SELL" ? totalQty :0,
      buyvalue: totalQty*buyOrder?.fillprice||0,
      positionStatus,
      status: "COMPLETE",
      orderstatuslocaldb: finalStatus,
    });

    // ====================================================
    // 8️⃣ NORMAL SUCCESS
    // ====================================================
    return {
      userId: user.id,
      broker: "AngelOne",
      result: "SUCCESS",
      orderid,
      uniqueOrderId,
    };
  } catch (err) {
    if (tempOrder?.id) {
      await tempOrder.update({
        orderstatuslocaldb: "FAILED",
        positionStatus: "FAILED",
        status: "FAILED",
        text: err.message,
      });
    }
    logSuccess(req, {
      msg: "placeAngelOrder failed with error",
      error: err.message,
      tempOrderId: tempOrder?.id,
    });

    return {
      broker: "AngelOne",
      result: "ERROR",
      message: err.message,
    };
  }
};



async function angelOneFIFOWithAPI(headers, symbol) {
 
  
  const ORDER_BOOK_URL =
    "https://apiconnect.angelbroking.com/rest/secure/angelbroking/order/v1/getOrderBook";

  const normalize = v => v?.trim().toUpperCase();

  // 1️⃣ Call AngelOne Order Book API
  const res = await axios.get(ORDER_BOOK_URL, { headers });
  const orderBookData = res?.data?.data || [];

  // 2️⃣ Filter & sort completed orders for symbol
  const orders = orderBookData
    .filter(o =>
      normalize(o.tradingsymbol) === normalize(symbol) &&
      o.status === "complete"
    )
    .sort((a, b) => new Date(a.updatetime) - new Date(b.updatetime));


      console.log(orders);

  const buyQueue = [];
  const trades = [];

  // 3️⃣ FIFO matching logic
  for (const o of orders) {
    let qty = Number(o.quantity);
    const price = Number(o.averageprice || o.price);

    if (o.transactiontype === "BUY") {
      buyQueue.push({
        qty,
        price,
        orderid: o.orderid,
        time: o.updatetime
      });
    }

    if (o.transactiontype === "SELL") {
      let sellQty = qty;

      while (sellQty > 0 && buyQueue.length) {
        const buy = buyQueue[0];
        const matchedQty = Math.min(buy.qty, sellQty);

        trades.push({
          symbol: o.tradingsymbol,
          buyOrderId: buy.orderid,
          sellOrderId: o.orderid,
          quantity: matchedQty,
          buyPrice: buy.price,
          sellPrice: price,
          pnl: (price - buy.price) * matchedQty,
          buyTime: buy.time,
          sellTime: o.updatetime,
          broker: "ANGELONE"
        });

        buy.qty -= matchedQty;
        sellQty -= matchedQty;

        if (buy.qty === 0) buyQueue.shift();
      }
    }
  }

  return trades;
}

// const trades = await angelOneFIFOWithAPI(
//   angelHeaders('eyJhbGciOiJIUzUxMiJ9.eyJ1c2VybmFtZSI6IlAyNjE5NjciLCJyb2xlcyI6MCwidXNlcnR5cGUiOiJVU0VSIiwidG9rZW4iOiJleUpoYkdjaU9pSlNVekkxTmlJc0luUjVjQ0k2SWtwWFZDSjkuZXlKMWMyVnlYM1I1Y0dVaU9pSmpiR2xsYm5RaUxDSjBiMnRsYmw5MGVYQmxJam9pZEhKaFpHVmZZV05qWlhOelgzUnZhMlZ1SWl3aVoyMWZhV1FpT2pZc0luTnZkWEpqWlNJNklqTWlMQ0prWlhacFkyVmZhV1FpT2lJeFpUTmtOMlk1WVMwME5EVmlMVE5rWXpVdE9URXhZUzAyTkdWbU9UWTROakExWW1RaUxDSnJhV1FpT2lKMGNtRmtaVjlyWlhsZmRqSWlMQ0p2Ylc1bGJXRnVZV2RsY21sa0lqbzJMQ0p3Y205a2RXTjBjeUk2ZXlKa1pXMWhkQ0k2ZXlKemRHRjBkWE1pT2lKaFkzUnBkbVVpZlN3aWJXWWlPbnNpYzNSaGRIVnpJam9pWVdOMGFYWmxJbjBzSW01aWRVeGxibVJwYm1jaU9uc2ljM1JoZEhWeklqb2lZV04wYVhabEluMTlMQ0pwYzNNaU9pSjBjbUZrWlY5c2IyZHBibDl6WlhKMmFXTmxJaXdpYzNWaUlqb2lVREkyTVRrMk55SXNJbVY0Y0NJNk1UYzJPVEExTkRRM01Td2libUptSWpveE56WTRPVFkzT0RreExDSnBZWFFpT2pFM05qZzVOamM0T1RFc0ltcDBhU0k2SW1aalpEUXlORE0wTFdaaVlXRXROR0pqTWkxaU1UZGxMV1ZqWmpsa05XVm1aRFUzTnlJc0lsUnZhMlZ1SWpvaUluMC5kVmMxaFZtQm9uUnQ0N1pYbTUzaG8wckVOZDVYY0E2QThQdEFlekNaSnBvWVFnVUVzRDlkYlFZRi1CWUxTTEUzMFJaR3d6RmhHbHJNeExUdDlmN1lmLWtsbEtjVHFPMlRoUXNvZTQ1QUdUSmJ6MWk1ckJDWkZxRkpkeTE3Q2x2NjBfYmF2VGd5OEFUS01lWjlLalBkcmdGVXJtaHpwR19kMEhCaU9qRTBpUDgiLCJBUEktS0VZIjoieUpicm5ua3giLCJYLU9MRC1BUEktS0VZIjp0cnVlLCJpYXQiOjE3Njg5NjgwNzEsImV4cCI6MTc2OTAyMDIwMH0.deBzjQxxy0gqayuL7xdk7RpU_X7SJR6J3NOyH62dpbgPO6ZBcQHqAu40s2bxp4inz3sDx-Xmf5kGOOIX0bicEA'),
//   "NIFTY27JAN2625250PE"
// );


// console.log(trades,'trades check');



// ======================== 08 jan 2025 ======================



// import axios from "axios";
// import Order from "../models/orderModel.js";
// import { logSuccess, logError } from "../utils/loggerr.js";


// // -----------------------
// // API ENDPOINTS
// // -----------------------
// const ANGEL_ONE_PLACE_URL =
//   "https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/placeOrder";

// const ANGEL_ONE_DETAILS_URL = (uniqueId) =>
//   `https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/details/${uniqueId}`;

// const ANGEL_ONE_TRADE_BOOK_URL =
//   "https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/getTradeBook";




// // -----------------------
// // HEADERS
// // -----------------------



// const angelHeaders = (token) => ({
//   Authorization: `Bearer ${token}`,
//   "Content-Type": "application/json",
//   "Accept": "application/json",
//   "X-UserType": "USER",
//   "X-SourceID": "WEB",
//   'X-ClientLocalIP': process.env.CLIENT_LOCAL_IP, 
//   'X-ClientPublicIP': process.env.CLIENT_PUBLIC_IP, 
//   'X-MACAddress': process.env.MAC_Address, 
//   'X-PrivateKey': process.env.PRIVATE_KEY, 
// });

// const safeErr = (e) => ({
//   message: e?.message,
//   status: e?.response?.status,
//   data: e?.response?.data,
// });

// // -----------------------
// // HELPERS
// // -----------------------
// const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// function extractBrokerError(err) {
//   const status = err?.response?.status || null;
//   const data = err?.response?.data;

//   const msg =
//     (typeof data === "string" && data) ||
//     data?.message ||
//     data?.emsg ||
//     err?.message ||
//     "Unknown error";

//   return { status, msg, data };
// }

// async function getDetailsWithPolling(user, uniqueOrderId, req) {
//   const maxPolls = 6;

//   for (let i = 0; i < maxPolls; i++) {
//     try {
//       const det = await axios.get(ANGEL_ONE_DETAILS_URL(uniqueOrderId), {
//         headers: angelHeaders(user.authToken),
//       });

//       const st = det?.data?.data?.status;

//       logSuccess(req, {
//         msg: "AngelOne details poll",
//         uniqueOrderId,
//         poll: i + 1,
//         status: st,
//       });

//       if (st === "complete" || st === "rejected" || st === "cancelled") {
//         return det.data;
//       }

//       // open/pending/transit etc -> wait then retry
//       await sleep(400 + i * 200);
//     } catch (err) {
//       const e = extractBrokerError(err);
//       logError(req, err, { msg: "AngelOne details poll failed", extracted: e });

//       // If rate limited, wait and retry
//       if (e.status === 403 && String(e.msg).includes("exceeding access rate")) {
//         await sleep(600 + i * 400);
//         continue;
//       }

//       if (i === maxPolls - 1) throw err;
//       await sleep(500 + i * 300);
//     }
//   }

//   return null;
// }



// async function getTradebookWithRetry(
//   user,
//   expectedQty,
//   req,
//   maxTry = 5
// ) {
//   let lastTradebook = null;

//   for (let i = 0; i < maxTry; i++) {
//     try {
//       const tradeRes = await axios.get(ANGEL_ONE_TRADE_BOOK_URL, {
//         headers: angelHeaders(user.authToken),
//       });

//       const trades = tradeRes?.data?.data || [];

//       const totalQty = Array.isArray(trades)
//         ? trades.reduce((sum, t) => sum + Number(t?.fillsize||t?.quantity||0), 0)
//         : 0;

//       logSuccess(req, {
//         msg: "AngelOne tradebook retry",
//         attempt: i + 1,
//         tradesCount: trades.length,
//         totalQty,
//         expectedQty,
//       });

//       // ✅ FULL FILL CONFIRMED
//       if (totalQty >= expectedQty) {
//         return tradeRes.data;
//       }

//       lastTradebook = tradeRes.data;
//     } catch (err) {
//       const e = extractBrokerError(err);

//       logError(req, err, {
//         msg: "AngelOne tradebook retry failed",
//         attempt: i + 1,
//         extracted: e,
//       });

//       // rate limit
//       if (e.status === 403 && String(e.msg).includes("exceeding access rate")) {
//         await sleep(800 * Math.pow(2, i));
//         continue;
//       }

//       // network error
//       if (!e.status) {
//         await sleep(600 * Math.pow(2, i));
//         continue;
//       }

//       throw err;
//     }

//     // wait before next poll
//     await sleep(500);
//   }

//   // ❗ retries exhausted → return best available snapshot
//   return lastTradebook;
// }



// // =======================
// // SINGLE placeAngelOrder (FULL UPDATED)
// // =======================
 

// // ======================= updated placeAngelOrder with partial SELL & logs ===============================
// export const placeAngelOrder = async (user, reqInput, req, sellQuantityPartial = 0) => {
//   let tempOrder = null;          // NEW TEMP ORDER (BUY/SELL)
//   let existingBuyOrder = null;   // OLD OPEN BUY
//   const nowISOError = new Date().toISOString();

//   try {
//     // ====================================================
//     // 1️⃣ READ existing BUY (NO UPDATE HERE)
//     // ====================================================
//     if ((reqInput.transactiontype || "").toUpperCase() === "BUY") {
//       existingBuyOrder = await Order.findOne({
//         where: {
//           userId: user.id,
//           ordertype: reqInput.orderType,
//           producttype: reqInput.productType,
//           tradingsymbol: reqInput.symbol,
//           transactiontype: "BUY",
//           orderstatuslocaldb: "OPEN",
//           status:"COMPLETE"
//         },
//       });

//       if (existingBuyOrder) {
//         logSuccess(req, {
//           msg: "Found existing OPEN BUY order for potential merge",
//           orderid: existingBuyOrder.id,
//         });
//       }
//     }

//     // ====================================================
//     // 2️⃣ ALWAYS CREATE NEW TEMP ORDER
//     // ====================================================
//     const orderData = {
//       variety: reqInput.variety || "NORMAL",
//       tradingsymbol: reqInput.symbol,
//       instrumenttype: reqInput.instrumenttype,
//       symboltoken: reqInput.token,
//       transactiontype: reqInput.transactiontype,
//       exchange: reqInput.exch_seg,
//       ordertype: reqInput.orderType,
//       quantity: String(reqInput.quantity),
//       producttype: reqInput.productType,
//       duration: reqInput.duration,
//       price: reqInput.price || "0",
//       triggerprice: reqInput.triggerprice || 0,
//       squareoff: reqInput.squareoff || 0,
//       stoploss: reqInput.stoploss || 0,
//       orderstatuslocaldb: "PENDING",
//       totalPrice: reqInput.totalPrice ?? null,
//       actualQuantity: reqInput.actualQuantity ?? null,
//       userId: user.id,
//       userNameId: user.username,
//       ordertag: "softwaresetu",
//       broker: "angelone",
//       buyOrderId: reqInput?.buyOrderId || null,
//       strategyName: reqInput?.groupName || "",
//       strategyUniqueId: reqInput?.strategyUniqueId || "",
//       text: "",
//       angelOneSymbol: reqInput.angelOneSymbol || reqInput.symbol,
//       angelOneToken: reqInput.angelOneToken || reqInput.token,
//     };

//     tempOrder = await Order.create(orderData);
//     logSuccess(req, {
//       msg: `Temp ${reqInput.transactiontype} order created in DB`,
//       tempOrderId: tempOrder.id,
//       quantity: tempOrder.quantity,
//     });

//      logSuccess(req, {
//       msg: `incoming data`,
//       body:reqInput
//     });

//     // ====================================================
//     // 3️⃣ PLACE BROKER ORDER
//     // ====================================================
//     let placeRes;
//     try {
//       placeRes = await axios.post(
//         ANGEL_ONE_PLACE_URL,
//         {
//           variety: (reqInput.variety || "NORMAL").toUpperCase(),
//           tradingsymbol: reqInput.symbol,
//           symboltoken: String(reqInput.token),
//           transactiontype: reqInput.transactiontype.toUpperCase(),
//           exchange: reqInput.exch_seg,
//           ordertype: reqInput.orderType.toUpperCase(),
//           producttype: reqInput.productType.toUpperCase(),
//           duration: "DAY",
//           ordertag:"softwareetu",
//           price: reqInput.price || 0,
//           triggerprice: reqInput.triggerprice || 0,
//           squareoff: reqInput.squareoff || 0,
//           stoploss: reqInput.stoploss || 0,
//           quantity: Number(reqInput.quantity),
//         },
//         { headers: angelHeaders(user.authToken) }
//       );
//       logSuccess(req, {
//         msg: "AngelOne API call success: order placed",
//         orderType: reqInput.transactiontype,
//         tempOrderId: tempOrder.id,
//       });
//     } catch (err) {
//       await tempOrder.update({
//         orderstatuslocaldb: "FAILED",
//         status: "FAILED",
//         positionStatus: "FAILED",
//         text: extractBrokerError(err).msg,
//       });
//       logSuccess(req, {
//         msg: "AngelOne API call failed: order rejected",
//         error: extractBrokerError(err).msg,
//         tempOrderId: tempOrder.id,
//       });
//       return { result: "BROKER_REJECTED" };
//     }

//     if (!placeRes.data?.status) {
//       await tempOrder.update({
//         orderstatuslocaldb: "FAILED",
//         status: "FAILED",
//         positionStatus: "FAILED",
//         text: placeRes.data?.message,
//       });
//       logSuccess(req, {
//         msg: "AngelOne order rejected by broker",
//         brokerMessage: placeRes.data?.message,
//         tempOrderId: tempOrder.id,
//       });
//       return { result: "BROKER_REJECTED" };
//     }

//     const orderid = placeRes.data.data.orderid;
//     const uniqueOrderId = placeRes.data.data.uniqueorderid;

//     await tempOrder.update({ orderid, uniqueorderid: uniqueOrderId });
//     logSuccess(req, {
//       msg: "AngelOne order successfully registered in DB",
//       orderid,
//       uniqueOrderId,
//     });

//     // ====================================================
//     // 4️⃣ DETAILS POLLING
//     // ====================================================
//     const detData = await getDetailsWithPolling(user, uniqueOrderId, req);
//     const detailsStatus = detData?.data?.status;
//     const detailsText = detData?.data?.text || "";

//     if (["rejected", "cancelled"].includes(detailsStatus)) {
//       await tempOrder.update({
//         orderstatuslocaldb: detailsStatus.toUpperCase(),
//         status: detailsStatus.toUpperCase(),
//         positionStatus: detailsStatus.toUpperCase(),
//         text: detailsText,
//       });
//       logSuccess(req, {
//         msg: `AngelOne order ${detailsStatus.toUpperCase()}`,
//         orderid,
//         tempOrderId: tempOrder.id,
//         brokerMessage: detailsText,
//       });
//       return { result: detailsStatus.toUpperCase() };
//     }

//     // ====================================================
//     // 5️⃣ TRADEBOOK
//     // ====================================================
//     const tradeData = await getTradebookWithRetry(user, reqInput.quantity, req);
//     const fills = tradeData?.data?.filter(t => String(t.orderid) === String(orderid));

//     if (!fills?.length) {
//       await tempOrder.update({
//         orderstatuslocaldb: "PENDING",
//         status: detailsStatus === "complete" ? "COMPLETE" : "OPEN",
//         text: "TRADE_NOT_FOUND_YET",
//       });
//       logSuccess(req, {
//         msg: "Trade not found yet in AngelOne tradebook",
//         tempOrderId: tempOrder.id,
//       });
//       return { result: "PENDING" };
//     }

//     let totalQty = 0;
//     let totalValue = 0;
//     fills.forEach(f => {
//       totalQty += Number(f.fillsize);
//       totalValue += Number(f.fillsize) * Number(f.fillprice);
//     });

//     const avgPrice = totalValue / totalQty;
//     const matched = fills[0];

//     // ====================================================
//     // 6️⃣ SELL PAIRING + PARTIAL (SAFE)
//     // ====================================================
//     let finalStatus = "OPEN";
//     let positionStatus = "OPEN";
//     let buyOrder = null;

//     if ((reqInput.transactiontype || "").toUpperCase() === "SELL") {
//       buyOrder = await Order.findOne({
//         where: { userId: user.id, orderid: reqInput.buyOrderId },
//       });

//       // SELL success → finalize temp SELL
//       finalStatus = "COMPLETE";
//       positionStatus = "COMPLETE";

//       await tempOrder.update({
//         fillsize: totalQty,
//         quantity: totalQty,
//         tradedValue: avgPrice * totalQty,
//         price: avgPrice,
//         fillprice: avgPrice,
//         filltime: nowISOError,
//         fillid: matched.fillid,
//         pnl: (avgPrice - Number(buyOrder?.fillprice || 0)) * totalQty||0,
//         buyOrderId: reqInput?.buyOrderId,
//         buyTime: buyOrder?.filltime,
//         buyprice: buyOrder?.fillprice,
//         buysize: buyOrder?.quantity,
//         buyvalue: buyOrder?.tradedValue,
//         positionStatus,
//         status: "COMPLETE",
//         orderstatuslocaldb: finalStatus,
//       });

//       logSuccess(req, {
//         msg: "SELL order executed successfully, temp SELL updated",
//         tempOrderId: tempOrder.id,
//         sellQty: totalQty,
//       });

//       // PARTIAL SELL → update original BUY + insert BUY clone
//       if (sellQuantityPartial > 0 && buyOrder) {
//         const remainingQty = Number(buyOrder.fillsize || buyOrder.quantity) - totalQty;

//         // UPDATE ORIGINAL BUY
//         await buyOrder.update({
//           fillsize: remainingQty,
//           quantity: remainingQty,
//           tradedValue: Number(buyOrder.tradedValue || 0) - Number(buyOrder.fillprice || buyOrder.price) * totalQty,
//         });
//         logSuccess(req, {
//           msg: "Original BUY order reduced after partial SELL",
//           originalBuyId: buyOrder.id,
//           remainingQty,
//         });

//         // Compute used qty & remaining qty
//         const usedQty = totalQty;
//         const buyFillPrice = Number(buyOrder.fillprice || buyOrder.price);

//           // INSERT BUY CLONE FOR PARTIAL SELL
//           await Order.create({
//           variety: buyOrder.variety,
//           tradingsymbol: buyOrder.tradingsymbol,
//           instrumenttype: buyOrder.instrumenttype,
//           symboltoken: buyOrder.symboltoken,
//           transactiontype: "BUY",
//           exchange: buyOrder.exchange,
//           ordertype: buyOrder.ordertype,
//           producttype: buyOrder.producttype,
//           duration: buyOrder.duration,

//           // qty split		
//           quantity: usedQty,
//           fillsize: usedQty,
//           price: buyFillPrice,
//           fillprice: buyFillPrice,

//           // recompute values
//           tradedValue: buyFillPrice * usedQty,
//           buyvalue: 0,

//           // meta copy		
//           userId: buyOrder.userId,
//           userNameId: buyOrder.userNameId,
//           broker: buyOrder.broker,
//           angelOneSymbol: buyOrder.angelOneSymbol,
//           angelOneToken: buyOrder.angelOneToken,
//           strategyName: buyOrder.strategyName,
//           strategyUniqueId: buyOrder.strategyUniqueId,
//           filltime: buyOrder.filltime,
//           uniqueorderid: buyOrder.uniqueorderid,

//           // status		
//           orderstatuslocaldb: "COMPLETE",
//           status: "COMPLETE",
//           positionStatus: "COMPLETE",
//           text: "BUY_SPLIT_FOR_SELL",
//       });

//         logSuccess(req, {
//           msg: "BUY clone inserted for corresponding partial SELL",
//           cloneQty: totalQty,
//         });
//       }else{
          
//          await buyOrder.update({
//           orderstatuslocaldb: "COMPLETE",
//           positionStatus: "COMPLETE",
          
//         });
//       }
//     }

//     // ====================================================
//     // 7️⃣ SAFE BUY MERGE (LAST STEP)
//     // ====================================================
//     if ((reqInput.transactiontype || "").toUpperCase() === "BUY" && existingBuyOrder) {
//       const mergedQty = Number(existingBuyOrder.fillsize || 0) + totalQty;
//       const mergedValue = Number(existingBuyOrder.tradedValue || 0) + avgPrice * totalQty;
//       const mergedAvg = mergedValue / mergedQty;

//       await existingBuyOrder.update({
//         fillsize: mergedQty,
//         quantity: mergedQty,
//         tradedValue: mergedValue,
//         price: mergedAvg,
//         fillprice: mergedAvg,
//       });

//       await tempOrder.destroy();
//       logSuccess(req, {
//         msg: "Existing BUY merged with new BUY",
//         existingBuyId: existingBuyOrder.id,
//         mergedQty,
//       });

//       return {
//         result: "SUCCESS",
//         orderid: existingBuyOrder.id,
//         uniqueOrderId: existingBuyOrder.uniqueorderid,
//         userId: user.id,
//         broker: "AngelOne",
//       };
//     }

//     // ====================================================
//     // 8️⃣ NORMAL SUCCESS
//     // ====================================================
//     return {
//       userId: user.id,
//       broker: "AngelOne",
//       result: "SUCCESS",
//       orderid,
//       uniqueOrderId,
//     };
//   } catch (err) {
//     if (tempOrder?.id) {
//       await tempOrder.update({
//         orderstatuslocaldb: "FAILED",
//         positionStatus: "FAILED",
//         status: "FAILED",
//         text: err.message,
//       });
//     }
//     logSuccess(req, {
//       msg: "placeAngelOrder failed with error",
//       error: err.message,
//       tempOrderId: tempOrder?.id,
//     });

//     return {
//       broker: "AngelOne",
//       result: "ERROR",
//       message: err.message,
//     };
//   }
// };




















