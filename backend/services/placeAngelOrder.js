// services/angel/placeAngelOrder.js
import axios from "axios";
import { Op } from "sequelize";
import Order from "../models/orderModel.js";

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
// COMMON HEADERS
// -----------------------
const angelHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
  Accept: "application/json",
  "X-UserType": "USER",
  "X-SourceID": "WEB",
  "X-ClientLocalIP": "127.0.0.1",
  "X-ClientPublicIP": "127.0.0.1",
  "X-MACAddress": "00-00-00-00-00-00",
  "X-PrivateKey": process.env.PRIVATE_KEY,
});

// -----------------------
// SAFE ERROR MESSAGE
// -----------------------
const safeErr = (err) => err?.response?.data || err?.message || err.toString();



// ==============update logger code ==============================
export const placeAngelOrder = async (user, reqInput, startOfDay, endOfDay, req) => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  // generic retry helper (3 times)
  const fetchWithRetry = async (fn, label, retries = 3, delayMs = 1200) => {
    let lastErr = null;

    for (let i = 1; i <= retries; i++) {
      try {
        const res = await fn();

        logSuccess(req, {
          msg: `${label} retry`,
          attempt: i,
          ok: true,
        });

        return res;
      } catch (e) {
        lastErr = e;

        logError(req, e, {
          msg: `${label} failed`,
          attempt: i,
        });

        if (i < retries) await sleep(delayMs);
      }
    }

    throw lastErr;
  };

  try {
    logSuccess(req, { msg: "AngelOne order flow started", reqInput, userId: user?.id });

    // 1️⃣ Prepare local order data
    const orderData = {
      variety: reqInput.variety,
      tradingsymbol: reqInput.symbol,
      instrumenttype: reqInput.instrumenttype,
      symboltoken: reqInput.token,
      transactiontype: reqInput.transactiontype,
      exchange: reqInput.exch_seg,
      ordertype: reqInput.orderType,
      quantity: reqInput.quantity,
      producttype: reqInput.productType,
      duration: reqInput.duration,
      price: reqInput.price || "0",
      squareoff: "0",
      stoploss: "0",
      orderstatuslocaldb: "PENDING",
      totalPrice: reqInput.totalPrice,
      actualQuantity: reqInput.actualQuantity,
      userId: user.id,
      userNameId: user.username,
      broker: "angelone",
      angelOneSymbol: reqInput?.angelOneSymbol || reqInput.symbol,
      angelOneToken: reqInput.angelOneToken || reqInput.token,
      buyOrderId: reqInput?.buyOrderId,
    };

    logSuccess(req, { msg: "Prepared local AngelOne order object", orderData });

    // 2️⃣ Save pending order locally
    const newOrder = await Order.create(orderData);
    logSuccess(req, { msg: "Local order saved", localOrderId: newOrder.id });

    // 3️⃣ Call Angel: PLACE ORDER
    let placeRes;
    try {
      placeRes = await axios.post(ANGEL_ONE_PLACE_URL, orderData, {
        headers: angelHeaders(user.authToken),
      });
      logSuccess(req, { msg: "AngelOne place order API response", placeRes: placeRes?.data });
    } catch (e) {
      logError(req, e, { msg: "AngelOne place order API failed" });

      await newOrder.update({
        orderstatuslocaldb: "FAILED",
        status: "FAILED",
        text: safeErr(e),
        buyTime: new Date().toISOString().replace(/\.\d+Z$/, ".000Z"),
      });

      return {
        userId: user.id,
        broker: "AngelOne",
        result: "BROKER_ERROR",
        message: safeErr(e),
      };
    }

    if (placeRes?.data?.status !== true) {
      const msg = placeRes?.data?.message || "Order rejected by AngelOne";
      logSuccess(req, { msg: "AngelOne order rejected", reason: msg, raw: placeRes?.data });

      await newOrder.update({
        orderstatuslocaldb: "FAILED",
        status: "FAILED",
        text: msg,
        buyTime: new Date().toISOString().replace(/\.\d+Z$/, ".000Z"),
      });

      return {
        userId: user.id,
        broker: "AngelOne",
        result: "BROKER_REJECTED",
        message: msg,
      };
    }

    // Extract IDs
    const orderid = placeRes?.data?.data?.orderid;
    const uniqueOrderId = placeRes?.data?.data?.uniqueorderid;

    logSuccess(req, { msg: "AngelOne order placed", orderid, uniqueOrderId });

    await newOrder.update({ orderid, uniqueorderid: uniqueOrderId });
    logSuccess(req, { msg: "Saved orderid + uniqueorderid to local DB", orderid, uniqueOrderId });

    // 4️⃣ Get ORDER DETAILS (✅ with retry)
    let detailsData = null;
    try {
      const det = await fetchWithRetry(
        () =>
          axios.get(ANGEL_ONE_DETAILS_URL(uniqueOrderId), {
            headers: angelHeaders(user.authToken),
          }),
        "AngelOne order details",
        3,
        1200
      );

      logSuccess(req, { msg: "AngelOne order details API response", detailsRes: det?.data });

      if (det?.data?.status === true) {
        detailsData = det.data.data;
      } else {
        logSuccess(req, { msg: "AngelOne order details returned status=false", raw: det?.data });
      }
    } catch (e) {
      logError(req, e, { msg: "AngelOne order details fetch failed after retries" });

      return {
        userId: user.id,
        broker: "AngelOne",
        result: "PLACED_NO_DETAILS",
        orderid,
        uniqueOrderId,
        error: safeErr(e),
      };
    }

    // 5️⃣ BUY / SELL logic
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

      logSuccess(req, { msg: "Fetched matching BUY order for SELL", buyOrder });

      if (buyOrder) {
        await Order.update({ orderstatuslocaldb: "COMPLETE" }, { where: { id: buyOrder.id } });
        logSuccess(req, { msg: "BUY order marked COMPLETE", buyOrderId: buyOrder.id });
      }

      finalStatus = "COMPLETE";
    }

    // 6️⃣ Update local order with details
    try {
      await newOrder.update({
        status: detailsData?.status,
        orderstatus: detailsData?.orderstatus,
        unfilledshares: detailsData?.unfilledshares,
        filledshares: detailsData?.filledshares,
        cancelsize: detailsData?.cancelsize,
        lotsize: detailsData?.lotsize,
        optiontype: detailsData?.optiontype,
        strikeprice: detailsData?.strikeprice,
        instrumenttype: detailsData?.instrumenttype,
        exchange: detailsData?.exchange,
        symboltoken: detailsData?.symboltoken,
        trailingstoploss: detailsData?.trailingstoploss,
        stoploss: detailsData?.stoploss,
        squareoff: detailsData?.squareoff,
        disclosedquantity: detailsData?.disclosedquantity,
        triggerprice: detailsData?.triggerprice,
        duration: detailsData?.duration,
        variety: detailsData?.variety,
        ordertype: detailsData?.ordertype,
        orderstatuslocaldb: finalStatus,
      });

      logSuccess(req, { msg: "Local order updated with AngelOne details", finalStatus });
    } catch (e) {
      logError(req, e, { msg: "Local DB update failed while saving AngelOne details" });
    }

    // 7️⃣ Fetch TRADE BOOK (✅ with retry, because trade entry can come late)
    try {
      const tradeRes = await fetchWithRetry(
        () =>
          axios.get(ANGEL_ONE_TRADE_BOOK_URL, {
            headers: angelHeaders(user.authToken),
          }),
        "AngelOne tradebook",
        3,
        1200
      );

      logSuccess(req, { msg: "AngelOne tradebook response", tradeRes: tradeRes?.data });

      if (tradeRes.data?.status === true && Array.isArray(tradeRes.data.data)) {
        const matched = tradeRes.data.data.find((t) => t.orderid === orderid);

        logSuccess(req, { msg: "Matched trade by orderid", matchedTrade: matched || null });

        if (matched) {
          const buyPrice = buyOrder?.fillprice || 0;
          const buySize = buyOrder?.fillsize || 0;
          const buyValue = buyOrder?.tradedValue || 0;
          let buyTime = buyOrder?.filltime || "NA";

          let pnl = matched?.fillsize * matched?.fillprice - buyPrice * buySize;

          // BUY leg pnl 0
          if (String(matched.transaction_type || "").toUpperCase() === "BUY") {
            pnl = 0;
            buyTime = "NA";
          }

          logSuccess(req, { msg: "Calculated PnL for AngelOne", pnl });

          await newOrder.update({
            tradedValue: matched.tradevalue,
            fillprice: matched.fillprice,
            fillsize: matched.fillsize,
            filltime: matched?.filltime ? new Date(matched.filltime).toISOString() : null,
            fillid: matched.fillid,
            pnl,
            buyTime,
            buyprice: buyPrice,
            buysize: buySize,
            buyvalue: buyValue,
          });

          logSuccess(req, { msg: "Final trade update saved in local DB", orderid });
        } else {
          logSuccess(req, { msg: "No trade found in tradebook after retries (non-fatal)", orderid });
        }
      }
    } catch (e) {
      logError(req, e, { msg: "AngelOne tradebook fetch failed after retries (non-fatal)" });
    }

    // ✅ SUCCESS
    logSuccess(req, { msg: "AngelOne order flow completed successfully", orderid, uniqueOrderId });

    return {
      userId: user.id,
      broker: "AngelOne",
      result: "SUCCESS",
      orderid,
      uniqueOrderId,
    };
  } catch (err) {
    logError(req, err, { msg: "Unexpected AngelOne order error" });

    return {
      userId: user.id,
      broker: "AngelOne",
      result: "ERROR",
      message: safeErr(err),
    };
  }
};







// ============= old working code====================
// export const placeAngelOrder = async (user, reqInput, startOfDay, endOfDay,req) => {
//   try {
//     // 1) Prepare local order data
//     const orderData = {
//       variety: reqInput.variety,
//       tradingsymbol: reqInput.symbol,
//       instrumenttype:reqInput.instrumenttype,
//       symboltoken: reqInput.token,
//       transactiontype: reqInput.transactiontype,
//       exchange: reqInput.exch_seg,
//       ordertype: reqInput.orderType,
//       quantity: reqInput.quantity,
//       producttype: reqInput.productType,
//       duration: reqInput.duration,
//       price: reqInput.price||"0",
//       squareoff: "0",
//       stoploss: "0",
//       orderstatuslocaldb: "PENDING",
//       totalPrice: reqInput.totalPrice,
//       actualQuantity: reqInput.actualQuantity,
//       userId: user.id,
//       userNameId: user.username,
//       broker:'angelone',
//       angelOneSymbol:reqInput?.angelOneSymbol||reqInput.symbol,
//       angelOneToken:reqInput.angelOneToken||reqInput.token,
//         buyOrderId:reqInput?.buyOrderId
//     };

//     // 2) Save pending order locally
//     const newOrder = await Order.create(orderData);

//     // 3) Call Angel: PLACE ORDER
//     const placeRes = await axios.post(ANGEL_ONE_PLACE_URL, orderData, {
//       headers: angelHeaders(user.authToken),
//     });

//     if (placeRes.data?.status !== true) {

//       await newOrder.update({ orderstatuslocaldb: "FAILED",status:'FAILED',text:'Order rejected by AngelOne',
//         //  filltime: new Date().toISOString().replace(/\.\d+Z$/, ".000Z"),
//          buyTime:new Date().toISOString().replace(/\.\d+Z$/, ".000Z"),
//        });
//       return {
//         userId: user.id,
//         broker: "AngelOne",
//         result: "BROKER_REJECTED",
//         message: placeRes.data?.message || "Order rejected by AngelOne",
//       };
//     }



//     // Extract IDs
//     const orderid = placeRes?.data?.data?.orderid;
//     const uniqueOrderId = placeRes?.data?.data?.uniqueorderid;

   
    

//     await newOrder.update({ orderid, uniqueorderid: uniqueOrderId });

//     // ---------------------------
//     // 4) Get ORDER DETAILS
//     // ---------------------------
//     let detailsData = null;

//     try {
      
//       const det = await axios.get(ANGEL_ONE_DETAILS_URL(uniqueOrderId), {
//         headers: angelHeaders(user.authToken),
//       });

     
//       if (det.data?.status === true) {
//         detailsData = det.data.data;
//       }
//     } catch (e) {
//       console.log(e, ' e catch ');
//       return {
//         userId: user.id,
//         broker: "AngelOne",
//         result: "PLACED_NO_DETAILS",
//         orderid,
//         uniqueOrderId,
//         error: safeErr(e),
//       };
//     }

//     // BUY → just mark OPEN
//     // SELL → close opposite BUY trades for today
//     let finalStatus = "OPEN";
//     let buyOrder

//     if (reqInput.transactiontype === "SELL") {


//        buyOrder = await Order.findOne({
//               where: { 
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
//           { where: { id: buyOrder.id } }
//         );
//       }

      
//       finalStatus = "COMPLETE";
//     }

//     // Update newOrder with broker order details
//     await newOrder.update({ 
//       status:detailsData.status,
//       orderstatus:detailsData.orderstatus,
//       unfilledshares:detailsData.unfilledshares,
//       filledshares:detailsData.filledshares,
//       cancelsize:detailsData.cancelsize,
//       lotsize:detailsData.lotsize,
//       optiontype:detailsData.optiontype,
//       strikeprice:detailsData.strikeprice,
//       instrumenttype:detailsData.instrumenttype,
//       exchange:detailsData.exchange,
//       symboltoken:detailsData.symboltoken,
//       trailingstoploss:detailsData.trailingstoploss,
//       stoploss:detailsData.stoploss,
//       squareoff:detailsData.squareoff,
//       disclosedquantity:detailsData.disclosedquantity,
//       triggerprice:detailsData.triggerprice,
//       duration:detailsData.duration,
//       variety:detailsData.variety,
//       ordertype:detailsData.ordertype,
//       duration:detailsData.duration,
//       orderstatuslocaldb: finalStatus
//      });

//     // ---------------------------
//     // 5) Fetch TRADE BOOK
//     // ---------------------------
//     try {
      
//       const tradeRes = await axios.get(ANGEL_ONE_TRADE_BOOK_URL, {
//         headers: angelHeaders(user.authToken),
//       });

//       if (tradeRes.data?.status === true && Array.isArray(tradeRes.data.data)) {

//         const matched = tradeRes.data.data.find((t) => t.orderid === orderid);

//         if (matched) {

//         const buyPrice  = buyOrder?.fillprice     || 0;
//         const buySize   = buyOrder?.fillsize      || 0;
//         const buyValue  = buyOrder?.tradedValue   || 0;
//         let buyTime  = buyOrder?.filltime ||0

//         let pnl = (matched?.fillsize*matched?.fillprice)-(buyPrice*buySize)
       

//           if(matched.transaction_type==='BUY') {
//              pnl = 0
//              buyTime = "NA";
//          }


//           await newOrder.update({
//             tradedValue: matched.tradevalue,
//             fillprice: matched.fillprice,
//             fillsize: matched.fillsize,
//             filltime: matched.filltime.toISOString(),
//             fillid: matched.fillid,
//             pnl:pnl,
//             buyTime:buyTime,
//             buyprice:buyPrice,
//             buysize:buySize,
//             buyvalue:buyValue,
//           });
//         }
//       }
//     } catch (e) {
//       console.log(e ,'angel errr 1');
      
//       // Trade book is optional — continue
//     }

//     // SUCCESS
//     return {
//       userId: user.id,
//       broker: "AngelOne",
//       result: "SUCCESS",
//       orderid,
//       uniqueOrderId,
//     };
//   } catch (err) {
//     console.log(err, 'catch ');
    
//     return {
//       userId: user.id,
//       broker: "AngelOne",
//       result: "ERROR",
//       message: safeErr(err),
//     };
//   }
// };
