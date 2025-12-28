
import axios from "axios";
import Order from "../models/orderModel.js";
import { logSuccess, logError } from "../utils/loggerr.js";


// -----------------------
// API ENDPOINTS
// -----------------------
const ANGEL_ONE_PLACE_URL =
  "https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/placeOrder";

const ANGEL_ONE_DETAILS_URL = (uniqueId) =>
  `https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/details/${uniqueId}`;

const ANGEL_ONE_TRADE_BOOK_URL =
  "https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/getTradeBook";




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

const safeErr = (e) => ({
  message: e?.message,
  status: e?.response?.status,
  data: e?.response?.data,
});




//  new code  start 

// -----------------------
// HELPERS
// -----------------------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function extractBrokerError(err) {
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

async function getTradebookWithRetry(user, req) {
  const maxTry = 4;

  for (let i = 0; i < maxTry; i++) {
    try {
      const tradeRes = await axios.get(ANGEL_ONE_TRADE_BOOK_URL, {
        headers: angelHeaders(user.authToken),
      });
      return tradeRes.data;
    } catch (err) {
      const e = extractBrokerError(err);
      logError(req, err, {
        msg: "AngelOne tradebook retry",
        attempt: i + 1,
        extracted: e,
      });

      // rate limit => backoff
      if (e.status === 403 && String(e.msg).includes("exceeding access rate")) {
        await sleep(800 * Math.pow(2, i)); // 800, 1600, 3200...
        continue;
      }
      // network -> retry
      if (!e.status) {
        await sleep(600 * Math.pow(2, i));
        continue;
      }

      // other -> throw
      throw err;
    }
  }

  throw new Error("Tradebook rate limited too many times");
}


// =======================
// SINGLE placeAngelOrder (FULL UPDATED)
// =======================
 






// ======================= update code ===============================
export const placeAngelOrder = async (user, reqInput, req) => {
  let newOrder = null;
  let orderExitstingOrNot = false
  const nowISOError = new Date().toISOString();

  try {
    logSuccess(req, {
      msg: "AngelOne order flow started",
      userId: user?.id,
      reqInput,
    });


    // 1️⃣ Prepare local order
    const orderData = {
      variety: reqInput.variety || "NORMAL",
      tradingsymbol: reqInput.symbol,
      instrumenttype: reqInput.instrumenttype,
      symboltoken: reqInput.token,
      transactiontype:reqInput.transactiontype,
      text:"",
      exchange: reqInput.exch_seg,
      ordertype: reqInput.orderType,
      quantity: String(reqInput.quantity),
      producttype: reqInput.productType,
      duration: reqInput.duration,
      price: reqInput.price || "0",
      triggerprice:reqInput.triggerprice||0,
      squareoff: reqInput.squareoff||0,
      stoploss: reqInput.stoploss||0,
      orderstatuslocaldb: "PENDING",
      totalPrice: reqInput.totalPrice ?? null,
      actualQuantity: reqInput.actualQuantity ?? null,
      userId: user.id,
      userNameId: user.username,
      ordertag:"softwaresetu",
      broker: "angelone",
      angelOneSymbol: reqInput.angelOneSymbol || reqInput.symbol,
      angelOneToken: reqInput.angelOneToken || reqInput.token,
      buyOrderId: reqInput?.buyOrderId || null,
      strategyName: reqInput?.groupName || "",
      strategyUniqueId: reqInput?.strategyUniqueId || "",
    };

    logSuccess(req, { msg: "Prepared local AngelOne order", orderData });


    // 2️⃣ Check existing OPEN/PENDING order for same symbol
    newOrder = await Order.findOne({
      where: {
        userId: user.id,
        tradingsymbol: reqInput.symbol,
        transactiontype: reqInput.transactiontype,
        orderstatuslocaldb: ["PENDING", "OPEN"],
      },
    });

    if (newOrder) {
      // ✅ UPDATE instead of CREATE
      const newQty = Number(newOrder.quantity || 0) + Number(reqInput.quantity);
      const newTradeValue =
        Number(newOrder.tradedValue || 0) +
        Number(reqInput.quantity) * Number(reqInput.price || 0);

      const newAvgPrice =
        newQty > 0 ? newTradeValue / newQty : newOrder.price;

      await newOrder.update({
        totalPrice: newTradeValue,
      });

      logSuccess(req, {
        msg: "Existing order updated (same tradingsymbol)",
        orderId: newOrder.id,
        newQty,
        newAvgPrice,
      });
      orderExitstingOrNot = true
    } else {
      //  Only here CREATE
      newOrder = await Order.create(orderData);

      logSuccess(req, {
        msg: "New local order created",
        localOrderId: newOrder.id,
      });
    }

    // // 2️⃣ Save locally
    // newOrder = await Order.create(orderData);

    logSuccess(req, { msg: "Local order saved", localOrderId: newOrder.id });

    //  Place AngelOne Order
    let placeRes;
    try {
      const brokerPayload = {
        variety: (reqInput.variety || "NORMAL").toUpperCase(),
        tradingsymbol: reqInput.symbol, // ex: YESBANK (or YESBANK-EQ if you want)
        symboltoken: String(reqInput.token),
        transactiontype: (reqInput.transactiontype || "").toUpperCase(),
        ordertag:"softwaresetu",
        exchange: reqInput.exch_seg,
        ordertype: (reqInput.orderType || "").toUpperCase(),
        producttype: (reqInput.productType || "").toUpperCase(),
        duration: "DAY",
        price:reqInput.price|| 0,
        triggerprice:reqInput.triggerprice||0,
        squareoff: reqInput.squareoff||0,
        stoploss: reqInput.stoploss||0,
        quantity: Number(reqInput.quantity),
      };

      placeRes = await axios.post(ANGEL_ONE_PLACE_URL, brokerPayload, {
        headers: angelHeaders(user.authToken),
      });

      logSuccess(req, {
        msg: "AngelOne placeOrder response received",
        response: placeRes.data,
        brokerPayload,
      });
    } catch (err) {
      const e = extractBrokerError(err);
      logError(req, err, { msg: "AngelOne placeOrder API failed", extracted: e });

      await newOrder.update({
        orderstatuslocaldb: "FAILED",
        status: "FAILED",
        positionStatus: "FAILED",
        text: e.msg,
        buyTime: nowISOError,
        filltime: nowISOError,
      });

      return {
        userId: user.id,
        broker: "AngelOne",
        result: "BROKER_REJECTED",
        message: e.msg,
      };
    }

    if (placeRes.data?.status !== true) {
      const msg = placeRes.data?.message || "Order rejected";

      await newOrder.update({
        orderstatuslocaldb: "FAILED",
        status: "FAILED",
          positionStatus: "FAILED",
        text: msg,
        buyTime: nowISOError,
        filltime: nowISOError,
      });

      return {
        userId: user.id,
        broker: "AngelOne",
        result: "BROKER_REJECTED",
        message: msg,
      };
    }

    // 4️⃣ Save broker IDs
    const orderid = placeRes.data.data.orderid;
    const uniqueOrderId = placeRes.data.data.uniqueorderid;

    await newOrder.update({ orderid, uniqueorderid: uniqueOrderId });

    logSuccess(req, {
      msg: "AngelOne order placed successfully",
      orderid,
      uniqueOrderId,
    });

    // 5️⃣ Details polling
    let detData = null;
    try {

      detData = await getDetailsWithPolling(user, uniqueOrderId, req);

      logSuccess(req, {
      msg: "AngelOne getDetailsWithPolling response ",
      orderid,
      detData,
    });

    } catch (err) {

      const e = extractBrokerError(err);

      logError(req, err, { msg: " AngelOne order status", extracted: e }); 

      await newOrder.update({
        orderstatuslocaldb: "PENDING",
        status: "PENDING",
          positionStatus: "FAILED",
        text: `DETAILS_PENDING: ${e.msg}`,
        buyTime: nowISOError,
        filltime: nowISOError,
      });

      return {
        userId: user.id,
        broker: "AngelOne",
        result: "PENDING",
        orderid,
        uniqueOrderId,
        message: e.msg,
      };
    }

    const detailsStatus = detData?.data?.status; // complete/rejected/cancelled/open/...

    const detailsText = detData?.data?.text || "";

    logSuccess(req, {
      msg: "AngelOne status response ",
      orderid,
      detailsText:detailsText,
      detailsStatus,
    });

    if (detailsStatus === "rejected") {
      await newOrder.update({
        status: "REJECTED",
        orderstatus: "REJECTED",
          positionStatus: "REJECTED",
        orderstatuslocaldb: "REJECTED",
        text: detailsText,
        buyTime: nowISOError,
        filltime: nowISOError,
      });

      return {
        userId: user.id,
        broker: "AngelOne",
        result: "REJECTED",
        orderid,
        uniqueOrderId,
      };
    }

    if (detailsStatus === "cancelled") {
      await newOrder.update({
        status: "CANCELLED",
        orderstatus: "CANCELLED",
          positionStatus: "CANCELLED",
        orderstatuslocaldb: "CANCELLED",
        text: detailsText,
        buyTime: nowISOError,
        filltime: nowISOError,
      });

      return {
        userId: user.id,
        broker: "AngelOne",
        result: "CANCELLED",
        orderid,
        uniqueOrderId,
      };
    }

    // ✅ Keep OPEN if not finalized
    if (detailsStatus === "open" || !detailsStatus) {
      await newOrder.update({
        status: "OPEN",
        orderstatus: "OPEN",
        orderstatuslocaldb: "OPEN",
        text: detailsText,
        buyTime: nowISOError,
        filltime: nowISOError,
      });
    }

    // ✅ Mark complete (but still try tradebook for fillsize/fillprice)
    if (detailsStatus === "complete") {
      await newOrder.update({
        status: "COMPLETE",
        orderstatus: "COMPLETE",
        orderstatuslocaldb: "COMPLETE",
        text: detailsText,
      });
    }

    // 6️⃣ SELL pairing variables (NO DB UPDATE HERE)
    let finalStatus = "OPEN";
    let positionStatus = "OPEN";
    let buyOrder = null;
    let buyOrderId = "NA";

    if ((reqInput.transactiontype || "").toUpperCase() === "SELL") {
      buyOrderId = String(reqInput.buyOrderId || "NA");
    }

    // 7️⃣ Tradebook fetch + finalize
    try {

    const tradeData = await getTradebookWithRetry(user, req);

    logSuccess(req, {
      msg: "AngelOne getTradebookWithRetry response ",
      orderid,
      getTradebookWithRetry:tradeData,
    });

      
     const fills = tradeData?.data?.filter(
        t => String(t.orderid) === String(orderid)
      );

      let totalQty = 0;
      let totalValue = 0;

      fills.forEach(fill => {
      const qty = Number(fill.fillsize);
      const price = Number(fill.fillprice);

      totalQty += qty;
      totalValue += qty * price;
    });

    let matched = fills[0]

    const avgPrice = totalQty > 0 ? (totalValue / totalQty) : 0;

   logSuccess(req, {
      msg: "AngelOne matched response ",
      orderid,
      matched:fills,
    });

      if (!matched) {
        await newOrder.update({
          orderstatuslocaldb: "PENDING",
          status: detailsStatus === "complete" ? "COMPLETE" : "OPEN",
          text: "TRADE_NOT_FOUND_YET",
      });

        return {
          userId: user.id,
          broker: "AngelOne",
          result: "SUCCESS",
          orderid,
          uniqueOrderId,
          note: "Tradebook not updated yet",
        };
      }

      // ✅ SELL pairing AFTER matched (THIS IS WHAT YOU WANTED)
      if ((reqInput.transactiontype || "").toUpperCase() === "SELL") {
        buyOrder = await Order.findOne({
          where: {
            userId: user.id,
            orderid: buyOrderId,
          },
          raw: true,
        });

        if (buyOrder && buyOrder.orderstatuslocaldb === "OPEN") {
          await Order.update(
            { 
              orderstatuslocaldb: "COMPLETE",
              positionStatus:"COMPLETE",
             },
            { where: { id: buyOrder.id } }
          );
        }

        finalStatus = "COMPLETE";
        positionStatus = "COMPLETE"
      }

      const buyPrice = Number(buyOrder?.fillprice || 0);
      const buyQty = Number(buyOrder?.quantity || 0);
      const buyValue = Number(buyOrder?.tradedValue || 0);
      const buyTime = buyOrder?.filltime || "NA";

      const txnType = (
        matched.transactiontype ||
        matched?.transaction_type ||
        ""
      ).toUpperCase();

      let pnl =
        txnType === "BUY"
          ? 0
          : avgPrice * totalQty - buyPrice * buyQty;

      // filltime "HH:mm:ss" => ISO
      let fillTimeISO = nowISOError;
      try {
        const createdAtDate = new Date(newOrder.createdAt);
        const [h, m, s] = String(matched.filltime).split(":");
        createdAtDate.setHours(Number(h), Number(m), Number(s), 0);
        fillTimeISO = createdAtDate.toISOString();
      } catch (_) {}


       if(orderExitstingOrNot) {

        // 🔑 Existing fillsize already stored
       const existingFillSize = Number(newOrder.fillsize || 0);
      //  const existingFillPrice = Number(newOrder.fillprice || 0);
       const existingFillTradedValue = Number(newOrder.tradedValue || 0);

       const newQty = totalQty
      //  const newPrice = avgPrice
       const newFillId = matched.fillid
       const newTradeValue = avgPrice*totalQty

        const UpdateNewQty = existingFillSize + newQty
        const UpdateNewTradeValue = existingFillTradedValue+newTradeValue
        const UpdateNewPrice =  UpdateNewTradeValue/UpdateNewQty


      await newOrder.update({

        tradedValue: UpdateNewTradeValue,
        price: UpdateNewPrice,
        fillprice:UpdateNewPrice,
        fillsize: UpdateNewQty,
        quantity:UpdateNewQty,
        fillid: newFillId,
      });

      logSuccess(req, { msg: "Trade matched & order finalized", pnl });

       }else{

      await newOrder.update({
        tradedValue: avgPrice*totalQty,
        price: avgPrice,
        fillprice:avgPrice,
        fillsize: totalQty,
        filltime: fillTimeISO,
        fillid: matched.fillid,
        pnl,
        buyOrderId,
        buyTime,
        buyprice: buyPrice,
        buysize: buyQty,
        buyvalue: buyValue,
        positionStatus:positionStatus,
        status: "COMPLETE",
        orderstatuslocaldb: finalStatus, // ✅ SELL => COMPLETE, BUY => OPEN/COMPLETE based on your logic
      });

      logSuccess(req, { msg: "Trade matched & order finalized", pnl });

    }
      

    } catch (err) {
      const e = extractBrokerError(err);

      const isRate =
        e.status === 403 && String(e.msg).includes("exceeding access rate");

      await newOrder.update({
        orderstatuslocaldb: isRate ? "PENDING" : "FAILED",
         positionStatus: "FAILED",
        status: isRate
          ? detailsStatus === "complete"
            ? "COMPLETE"
            : "OPEN"
          : "FAILED",
        text: isRate
          ? `TRADEBOOK_RATE_LIMIT: ${e.msg}`
          : `TRADEBOOK_ERROR: ${e.msg}`,
        buyTime: nowISOError,
        filltime: nowISOError,
      });

      logError(req, err, { msg: "AngelOne tradebook fetch failed", extracted: e });
    }

    return {
      userId: user.id,
      broker: "AngelOne",
      result: "SUCCESS",
      orderid,
      uniqueOrderId,
    };
  } catch (err) {
    const e = extractBrokerError(err);
    logError(req, err, { msg: "Unexpected AngelOne order failure", extracted: e });

    if (newOrder?.id) {
      await newOrder.update({
        orderstatuslocaldb: "FAILED",
         positionStatus: "FAILED",
        status: "FAILED",
        text: e.msg,
        buyTime: nowISOError,
        filltime: nowISOError,
      });
    }

    return {
      userId: user?.id,
      broker: "AngelOne",
      result: "ERROR",
      message: e.msg,
      error: safeErr(err),
    };
  }
};













// ==================== ref =================





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




// //  new code  start 

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

// async function getTradebookWithRetry(user, req) {
//   const maxTry = 4;

//   for (let i = 0; i < maxTry; i++) {
//     try {
//       const tradeRes = await axios.get(ANGEL_ONE_TRADE_BOOK_URL, {
//         headers: angelHeaders(user.authToken),
//       });
//       return tradeRes.data;
//     } catch (err) {
//       const e = extractBrokerError(err);
//       logError(req, err, {
//         msg: "AngelOne tradebook retry",
//         attempt: i + 1,
//         extracted: e,
//       });

//       // rate limit => backoff
//       if (e.status === 403 && String(e.msg).includes("exceeding access rate")) {
//         await sleep(800 * Math.pow(2, i)); // 800, 1600, 3200...
//         continue;
//       }
//       // network -> retry
//       if (!e.status) {
//         await sleep(600 * Math.pow(2, i));
//         continue;
//       }

//       // other -> throw
//       throw err;
//     }
//   }

//   throw new Error("Tradebook rate limited too many times");
// }


// // =======================
// // SINGLE placeAngelOrder (FULL UPDATED)
// // =======================
 






// // ======================= update code ===============================


// export const placeAngelOrder = async (user, reqInput, req) => {
//   let newOrder = null;
//   const nowISOError = new Date().toISOString();

//   try {
//     logSuccess(req, {
//       msg: "AngelOne order flow started",
//       userId: user?.id,
//       reqInput,
//     });


//     // 1️⃣ Prepare local order
//     const orderData = {
//       variety: reqInput.variety || "NORMAL",
//       tradingsymbol: reqInput.symbol,
//       instrumenttype: reqInput.instrumenttype,
//       symboltoken: reqInput.token,
//       transactiontype:reqInput.transactiontype,
//       text:"",
//       exchange: reqInput.exch_seg,
//       ordertype: reqInput.orderType,
//       quantity: String(reqInput.quantity),
//       producttype: reqInput.productType,
//       duration: reqInput.duration,
//       price: reqInput.price || "0",
//       triggerprice:reqInput.triggerprice||0,
//       squareoff: reqInput.squareoff||0,
//       stoploss: reqInput.stoploss||0,
//       orderstatuslocaldb: "PENDING",
//       totalPrice: reqInput.totalPrice ?? null,
//       actualQuantity: reqInput.actualQuantity ?? null,
//       userId: user.id,
//       userNameId: user.username,
//       ordertag:"softwaresetu",
//       broker: "angelone",
//       angelOneSymbol: reqInput.angelOneSymbol || reqInput.symbol,
//       angelOneToken: reqInput.angelOneToken || reqInput.token,
//       buyOrderId: reqInput?.buyOrderId || null,
//       strategyName: reqInput?.groupName || "",
//       strategyUniqueId: reqInput?.strategyUniqueId || "",
//     };

//     logSuccess(req, { msg: "Prepared local AngelOne order", orderData });

//     // // 2️⃣ Save locally
//     newOrder = await Order.create(orderData);

//     logSuccess(req, { msg: "Local order saved", localOrderId: newOrder.id });

//     //  Place AngelOne Order
//     let placeRes;
//     try {
//       const brokerPayload = {
//         variety: (reqInput.variety || "NORMAL").toUpperCase(),
//         tradingsymbol: reqInput.symbol, // ex: YESBANK (or YESBANK-EQ if you want)
//         symboltoken: String(reqInput.token),
//         transactiontype: (reqInput.transactiontype || "").toUpperCase(),
//         ordertag:"softwaresetu",
//         exchange: reqInput.exch_seg,
//         ordertype: (reqInput.orderType || "").toUpperCase(),
//         producttype: (reqInput.productType || "").toUpperCase(),
//         duration: "DAY",
//         price:reqInput.price|| 0,
//         triggerprice:reqInput.triggerprice||0,
//         squareoff: reqInput.squareoff||0,
//         stoploss: reqInput.stoploss||0,
//         quantity: Number(reqInput.quantity),
//       };

//       placeRes = await axios.post(ANGEL_ONE_PLACE_URL, brokerPayload, {
//         headers: angelHeaders(user.authToken),
//       });

//       logSuccess(req, {
//         msg: "AngelOne placeOrder response received",
//         response: placeRes.data,
//         brokerPayload,
//       });
//     } catch (err) {
//       const e = extractBrokerError(err);
//       logError(req, err, { msg: "AngelOne placeOrder API failed", extracted: e });

//       await newOrder.update({
//         orderstatuslocaldb: "FAILED",
//         status: "FAILED",
//         positionStatus: "FAILED",
//         text: e.msg,
//         buyTime: nowISOError,
//         filltime: nowISOError,
//       });

//       return {
//         userId: user.id,
//         broker: "AngelOne",
//         result: "BROKER_REJECTED",
//         message: e.msg,
//       };
//     }

//     if (placeRes.data?.status !== true) {
//       const msg = placeRes.data?.message || "Order rejected";

//       await newOrder.update({
//         orderstatuslocaldb: "FAILED",
//         status: "FAILED",
//           positionStatus: "FAILED",
//         text: msg,
//         buyTime: nowISOError,
//         filltime: nowISOError,
//       });

//       return {
//         userId: user.id,
//         broker: "AngelOne",
//         result: "BROKER_REJECTED",
//         message: msg,
//       };
//     }

//     // 4️⃣ Save broker IDs
//     const orderid = placeRes.data.data.orderid;
//     const uniqueOrderId = placeRes.data.data.uniqueorderid;

//     await newOrder.update({ orderid, uniqueorderid: uniqueOrderId });

//     logSuccess(req, {
//       msg: "AngelOne order placed successfully",
//       orderid,
//       uniqueOrderId,
//     });

//     // 5️⃣ Details polling
//     let detData = null;
//     try {

//       detData = await getDetailsWithPolling(user, uniqueOrderId, req);

//       logSuccess(req, {
//       msg: "AngelOne getDetailsWithPolling response ",
//       orderid,
//       detData,
//     });

//     } catch (err) {

//       const e = extractBrokerError(err);

//       logError(req, err, { msg: " AngelOne order status", extracted: e }); 

//       await newOrder.update({
//         orderstatuslocaldb: "PENDING",
//         status: "PENDING",
//           positionStatus: "FAILED",
//         text: `DETAILS_PENDING: ${e.msg}`,
//         buyTime: nowISOError,
//         filltime: nowISOError,
//       });

//       return {
//         userId: user.id,
//         broker: "AngelOne",
//         result: "PENDING",
//         orderid,
//         uniqueOrderId,
//         message: e.msg,
//       };
//     }

//     const detailsStatus = detData?.data?.status; // complete/rejected/cancelled/open/...

//     const detailsText = detData?.data?.text || "";

//     logSuccess(req, {
//       msg: "AngelOne status response ",
//       orderid,
//       detailsText:detailsText,
//       detailsStatus,
//     });

//     if (detailsStatus === "rejected") {
//       await newOrder.update({
//         status: "REJECTED",
//         orderstatus: "REJECTED",
//           positionStatus: "REJECTED",
//         orderstatuslocaldb: "REJECTED",
//         text: detailsText,
//         buyTime: nowISOError,
//         filltime: nowISOError,
//       });

//       return {
//         userId: user.id,
//         broker: "AngelOne",
//         result: "REJECTED",
//         orderid,
//         uniqueOrderId,
//       };
//     }

//     if (detailsStatus === "cancelled") {
//       await newOrder.update({
//         status: "CANCELLED",
//         orderstatus: "CANCELLED",
//           positionStatus: "CANCELLED",
//         orderstatuslocaldb: "CANCELLED",
//         text: detailsText,
//         buyTime: nowISOError,
//         filltime: nowISOError,
//       });

//       return {
//         userId: user.id,
//         broker: "AngelOne",
//         result: "CANCELLED",
//         orderid,
//         uniqueOrderId,
//       };
//     }

//     // ✅ Keep OPEN if not finalized
//     if (detailsStatus === "open" || !detailsStatus) {
//       await newOrder.update({
//         status: "OPEN",
//         orderstatus: "OPEN",
//         orderstatuslocaldb: "OPEN",
//         text: detailsText,
//         buyTime: nowISOError,
//         filltime: nowISOError,
//       });
//     }

//     // ✅ Mark complete (but still try tradebook for fillsize/fillprice)
//     if (detailsStatus === "complete") {
//       await newOrder.update({
//         status: "COMPLETE",
//         orderstatus: "COMPLETE",
//         orderstatuslocaldb: "COMPLETE",
//         text: detailsText,
//       });
//     }

//     // 6️⃣ SELL pairing variables (NO DB UPDATE HERE)
//     let finalStatus = "OPEN";
//     let positionStatus = "OPEN";
//     let buyOrder = null;
//     let buyOrderId = "NA";

//     if ((reqInput.transactiontype || "").toUpperCase() === "SELL") {
//       buyOrderId = String(reqInput.buyOrderId || "NA");
//     }

//     // 7️⃣ Tradebook fetch + finalize
//     try {

//     const tradeData = await getTradebookWithRetry(user, req);

//     logSuccess(req, {
//       msg: "AngelOne getTradebookWithRetry response ",
//       orderid,
//       getTradebookWithRetry:tradeData,
//     });

      
//      const fills = tradeData?.data?.filter(
//         t => String(t.orderid) === String(orderid)
//       );

//       let totalQty = 0;
//       let totalValue = 0;

//       fills.forEach(fill => {
//       const qty = Number(fill.fillsize);
//       const price = Number(fill.fillprice);

//       totalQty += qty;
//       totalValue += qty * price;
//     });

//     let matched = fills[0]

//     const avgPrice = totalQty > 0 ? (totalValue / totalQty) : 0;

//    logSuccess(req, {
//       msg: "AngelOne matched response ",
//       orderid,
//       matched:fills,
//     });

//       if (!matched) {
//         await newOrder.update({
//           orderstatuslocaldb: "PENDING",
//           status: detailsStatus === "complete" ? "COMPLETE" : "OPEN",
//           text: "TRADE_NOT_FOUND_YET",
//       });

//         return {
//           userId: user.id,
//           broker: "AngelOne",
//           result: "SUCCESS",
//           orderid,
//           uniqueOrderId,
//           note: "Tradebook not updated yet",
//         };
//       }

//       // ✅ SELL pairing AFTER matched (THIS IS WHAT YOU WANTED)
//       if ((reqInput.transactiontype || "").toUpperCase() === "SELL") {
//         buyOrder = await Order.findOne({
//           where: {
//             userId: user.id,
//             orderid: buyOrderId,
//           },
//           raw: true,
//         });

//         if (buyOrder && buyOrder.orderstatuslocaldb === "OPEN") {
//           await Order.update(
//             { 
//               orderstatuslocaldb: "COMPLETE",
//               positionStatus:"COMPLETE",
//              },
//             { where: { id: buyOrder.id } }
//           );
//         }

//         finalStatus = "COMPLETE";
//         positionStatus = "COMPLETE"
//       }

//       const buyPrice = Number(buyOrder?.fillprice || 0);
//       const buyQty = Number(buyOrder?.quantity || 0);
//       const buyValue = Number(buyOrder?.tradedValue || 0);
//       const buyTime = buyOrder?.filltime || "NA";

//       const txnType = (
//         matched.transactiontype ||
//         matched?.transaction_type ||
//         ""
//       ).toUpperCase();

//       let pnl =
//         txnType === "BUY"
//           ? 0
//           : avgPrice * totalQty - buyPrice * buyQty;

//       // filltime "HH:mm:ss" => ISO
//       let fillTimeISO = nowISOError;
//       try {
//         const createdAtDate = new Date(newOrder.createdAt);
//         const [h, m, s] = String(matched.filltime).split(":");
//         createdAtDate.setHours(Number(h), Number(m), Number(s), 0);
//         fillTimeISO = createdAtDate.toISOString();
//       } catch (_) {}

//       await newOrder.update({
//         tradedValue: avgPrice*totalQty,
//         price: avgPrice,
//         fillprice:avgPrice,
//         fillsize: totalQty,
//         filltime: fillTimeISO,
//         fillid: matched.fillid,
//         pnl,
//         buyOrderId,
//         buyTime,
//         buyprice: buyPrice,
//         buysize: buyQty,
//         buyvalue: buyValue,
//         positionStatus:positionStatus,
//         status: "COMPLETE",
//         orderstatuslocaldb: finalStatus, // ✅ SELL => COMPLETE, BUY => OPEN/COMPLETE based on your logic
//       });

//       logSuccess(req, { msg: "Trade matched & order finalized", pnl });
//     } catch (err) {
//       const e = extractBrokerError(err);

//       const isRate =
//         e.status === 403 && String(e.msg).includes("exceeding access rate");

//       await newOrder.update({
//         orderstatuslocaldb: isRate ? "PENDING" : "FAILED",
//          positionStatus: "FAILED",
//         status: isRate
//           ? detailsStatus === "complete"
//             ? "COMPLETE"
//             : "OPEN"
//           : "FAILED",
//         text: isRate
//           ? `TRADEBOOK_RATE_LIMIT: ${e.msg}`
//           : `TRADEBOOK_ERROR: ${e.msg}`,
//         buyTime: nowISOError,
//         filltime: nowISOError,
//       });

//       logError(req, err, { msg: "AngelOne tradebook fetch failed", extracted: e });
//     }

//     return {
//       userId: user.id,
//       broker: "AngelOne",
//       result: "SUCCESS",
//       orderid,
//       uniqueOrderId,
//     };
//   } catch (err) {
//     const e = extractBrokerError(err);
//     logError(req, err, { msg: "Unexpected AngelOne order failure", extracted: e });

//     if (newOrder?.id) {
//       await newOrder.update({
//         orderstatuslocaldb: "FAILED",
//          positionStatus: "FAILED",
//         status: "FAILED",
//         text: e.msg,
//         buyTime: nowISOError,
//         filltime: nowISOError,
//       });
//     }

//     return {
//       userId: user?.id,
//       broker: "AngelOne",
//       result: "ERROR",
//       message: e.msg,
//       error: safeErr(err),
//     };
//   }
// };
