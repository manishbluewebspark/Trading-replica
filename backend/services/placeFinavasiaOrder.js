import axios from "axios";
import Order from "../models/orderModel.js";
import { logSuccess, logError } from "../utils/loggerr.js";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat.js";
import utc from "dayjs/plugin/utc.js";
import { text } from "express";

dayjs.extend(customParseFormat);
dayjs.extend(utc);

export const toISOStringUTC = (dateStr) => {
  return dayjs(dateStr, "DD-MM-YYYY HH:mm:ss").utc().toISOString();
};

const SHOONYA_BASE_URL = process.env.SHOONYA_BASE_URL;

// 🔁 Map your generic product type → Shoonya PRD code
function getShoonyaProductCode(type) {
  if (!type) return "I";
  switch (type.toUpperCase()) {
    case "DELIVERY":
    case "CNC":
      return "C";
    case "CARRYFORWARD":
    case "NRML":
      return "M";
    case "INTRADAY":
    case "MIS":
      return "I";
    case "BO":
      return "B";
    case "CO":
      return "H";
    default:
      return "I";
  }
}

// 🔁 Map your orderType → Shoonya prctyp
function mapOrderTypeToShoonya(orderType) {
  if (!orderType) return "MKT";
  switch (orderType.toUpperCase()) {
    case "MARKET":
    case "MKT":
      return "MKT";
    case "LIMIT":
    case "LMT":
      return "LMT";
    case "SL":
    case "SL-LMT":
      return "SL-LMT";
    case "SLM":
    case "SL-MKT":
      return "SL-MKT";
    default:
      return "MKT";
  }
}

function mapTransactionType(type) {
  if (!type) return "B";
  return type.toUpperCase() === "SELL" ? "S" : "B";
}

const maskToken = (t) => (t ? `${String(t).slice(0, 6)}****${String(t).slice(-6)}` : null);

//  new code start 

export const placeFinavasiaOrder = async (
  user,
  reqInput,
  req,
  isLocalDbFlow = true
) => {
  try {
    const nowISOError = new Date().toISOString();

    logSuccess(req, {
      msg: "Finvasia order flow started",
      userId: user?.id,
      reqInput,
    });

    // ✅ helpers
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

    const normalizeStatus = (st) =>
      String(st ?? "")
        .trim()
        .toUpperCase()
        .replace(/\s+/g, " ");

    const isFinalStatus = (statusNorm) => {
      if (statusNorm.includes("COMPLETE") || statusNorm.includes("FILLED")) return true;
      if (statusNorm.includes("REJECT")) return true;
      if (statusNorm.includes("CANCEL")) return true;
      return false;
    };

    const isRetryableStatus = (statusNorm) => {
      const retryables = [
        "OPEN",
        "PENDING",
        "TRIGGER PENDING",
        "TRIG PENDING",
        "PARTIAL",
        "PARTIALLY FILLED",
        "AMO",
      ];
      return retryables.some((x) => statusNorm === x || statusNorm.includes(x));
    };

    // ✅ OrderBook with retries (only for OPEN/PENDING type)
    const fetchOrderDetailsWithRetry = async ({ uid, susertoken, orderid }) => {
      const MAX_RETRIES = 3;
      const RETRY_DELAY_MS = 1500;

      let lastOrderDetails = null;

      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          const obBody = `jKey=${susertoken}&jData=${JSON.stringify({
            uid,
            actid: uid,
          })}`;

          const obResp = await axios.post(`${SHOONYA_BASE_URL}/OrderBook`, obBody, {
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
          });

          const obData = obResp.data;

          if (!Array.isArray(obData)) {
            if (attempt < MAX_RETRIES) await sleep(RETRY_DELAY_MS);
            continue;
          }

          const orderDetails = obData.find(
            (o) => String(o.norenordno) === String(orderid)
          );

          lastOrderDetails = orderDetails || lastOrderDetails;

          if (!orderDetails) {
            logSuccess(req, {
              msg: "Order not found in OrderBook yet",
              attempt,
              orderid,
            });
            if (attempt < MAX_RETRIES) await sleep(RETRY_DELAY_MS);
            continue;
          }

          const statusNorm = normalizeStatus(orderDetails?.status);

          logSuccess(req, {
            msg: "OrderBook matched orderDetails (poll)",
            attempt,
            orderid,
            statusNorm,
          });

          if (isFinalStatus(statusNorm)) return orderDetails;

          if (isRetryableStatus(statusNorm)) {
            if (attempt < MAX_RETRIES) {
              await sleep(RETRY_DELAY_MS);
              continue;
            }
            return orderDetails; // retries exhausted
          }

          // unknown status -> return
          return orderDetails;
        } catch (e) {
          logError(req, e, {
            msg: "OrderBook fetch error (attempt)",
            attempt,
            raw: e?.response?.data,
          });

          if (attempt < MAX_RETRIES) {
            await sleep(RETRY_DELAY_MS);
            continue;
          }
        }
      }

      return lastOrderDetails;
    };

    // ✅ TradeBook (small retry) because sometimes trade shows late
    const fetchTradeBookWithRetry = async ({ uid, susertoken }) => {
      const MAX_TRY = 3;
      const DELAY = 1200;

      for (let i = 1; i <= MAX_TRY; i++) {
        try {
          const tbBody = `jKey=${susertoken}&jData=${JSON.stringify({
            uid,
            actid: uid,
          })}`;

          const tbResp = await axios.post(`${SHOONYA_BASE_URL}/TradeBook`, tbBody, {
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
          });

          return tbResp.data;
        } catch (e) {
          logError(req, e, {
            msg: "TradeBook fetch retry",
            attempt: i,
            raw: e?.response?.data,
          });
          if (i < MAX_TRY) await sleep(DELAY);
        }
      }
      return null;
    };

    // 1) Resolve mappings + validate session
    const transactionType = (reqInput.transactiontype || "").toUpperCase();
    const uid = user?.kite_client_id;
    const susertoken = user?.authToken;

    logSuccess(req, {
      msg: "Resolved user + transaction",
      transactionType,
      uid,
      susertoken: maskToken(susertoken),
    });

    if (!uid || !susertoken) {
      return {
        userId: user?.id,
        broker: "Finvasia",
        result: "ERROR",
        message: "Shoonya uid or token missing. Please login Shoonya first.",
      };
    }

    // 2) CREATE LOCAL PENDING ORDER
    const orderData = {
      symboltoken: reqInput.finavasiaToken || reqInput.token,
      variety: reqInput.variety || "NORMAL",
      tradingsymbol: reqInput?.finavasiaSymbol || reqInput?.symbol,
      instrumenttype: reqInput.instrumenttype,
      transactiontype: transactionType,
      exchange: reqInput.exch_seg,
      ordertype: reqInput.orderType,
      quantity: reqInput.quantity,
      producttype: reqInput.productType,
      price: reqInput.price,
      orderstatuslocaldb: "PENDING",
      totalPrice: reqInput.totalPrice,
      actualQuantity: reqInput.actualQuantity,
      userId: user.id,
      broker: "finvasia",
      angelOneSymbol: reqInput.angelOneSymbol || reqInput.symbol,
      angelOneToken: reqInput.angelOneToken || reqInput.token,
      userNameId: user.username,
      strategyName: reqInput?.groupName || "",
      strategyUniqueId: reqInput?.strategyUniqueId || "",
      buyOrderId: reqInput?.buyOrderId || null,
    };

    const newOrder = await Order.create(orderData);

    // 3) Mappings
    const shoonyaProductType = isLocalDbFlow
      ? getShoonyaProductCode(reqInput.productType)
      : reqInput.productType;

    const shoonyaOrderType = isLocalDbFlow
      ? mapOrderTypeToShoonya(reqInput.orderType)
      : reqInput.orderType;

    // 4) BUILD SHOONYA PAYLOAD
    const jData = {
      uid: String(uid),
      actid: String(uid),
      exch: String(reqInput.exch_seg),
      tsym: String(reqInput?.finavasiaSymbol || reqInput?.symbol),
      qty: String(reqInput.quantity),
      prc: String(reqInput.orderType === "MARKET" ? 0 : reqInput.price),
      prd: shoonyaProductType,
      prctyp: shoonyaOrderType,
      trantype: mapTransactionType(reqInput.transactiontype),
      ret: "DAY",
    };

    const body = `jData=${JSON.stringify(jData)}&jKey=${susertoken}`;

    // 5) PLACE ORDER IN SHOONYA
    let placeRes;
    try {
      const resp = await axios.post(`${SHOONYA_BASE_URL}/PlaceOrder`, body, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      placeRes = resp.data;

      logSuccess(req, { msg: "Shoonya PlaceOrder response", placeRes });

      if (!placeRes || placeRes.stat !== "Ok") {
        const msg = placeRes?.emsg || "Shoonya order placement failed";
        await newOrder.update({
          orderstatuslocaldb: "FAILED",
          status: "FAILED",
          text: msg,
          buyTime: nowISOError,
          filltime: nowISOError,
        });
        return {
          userId: user.id,
          broker: "Finvasia",
          result: "BROKER_REJECTED",
          message: msg,
          raw: placeRes,
        };
      }
    } catch (err) {
      logError(req, err, { msg: "Shoonya PlaceOrder API error", raw: err?.response?.data });

      await newOrder.update({
        orderstatuslocaldb: "FAILED",
        status: "FAILED",
        text: err?.response?.data?.emsg || err?.message || "Shoonya PlaceOrder error",
        buyTime: nowISOError,
        filltime: nowISOError,
      });

      return {
        userId: user.id,
        broker: "Finvasia",
        result: "BROKER_ERROR",
        message: err?.message || "Shoonya PlaceOrder error",
      };
    }

    const orderid = placeRes.norenordno;
    await newOrder.update({ orderid });

    // 6) FETCH ORDER DETAILS (OrderBook) with retry
    let orderDetails = null;
    try {
      orderDetails = await fetchOrderDetailsWithRetry({ uid, susertoken, orderid });

      if (orderDetails) {
        const statusNorm = normalizeStatus(orderDetails?.status);
        const rej = orderDetails?.rejreason || "";

        if (statusNorm.includes("REJECT")) {
          await newOrder.update({
            status: "REJECTED",
            orderstatuslocaldb: "REJECTED",
            text: rej,
            buyTime: nowISOError,
            filltime: nowISOError,
          });
          return {
            userId: user.id,
            broker: "Finvasia",
            result: "BROKER_REJECTED",
            message: rej || "Order rejected",
            orderid,
          };
        }

        if (statusNorm.includes("CANCEL")) {
          await newOrder.update({
            status: "CANCELLED",
            orderstatuslocaldb: "CANCELLED",
            text: rej,
            buyTime: nowISOError,
            filltime: nowISOError,
          });
          return {
            userId: user.id,
            broker: "Finvasia",
            result: "CANCELLED",
            message: rej || "Order cancelled",
            orderid,
          };
        }

        if (statusNorm.includes("COMPLETE") || statusNorm.includes("FILLED")) {
          await newOrder.update({
            status: "COMPLETE",
            orderstatuslocaldb: "OPEN", // your style: keep OPEN position
            text: "",
          });
        } else if (isRetryableStatus(statusNorm)) {
          await newOrder.update({
            status: "OPEN",
            orderstatuslocaldb: "OPEN",
            text: rej,
            buyTime: nowISOError,
            filltime: nowISOError,
          });
        }
      }
    } catch (e) {
      logError(req, e, { msg: "OrderBook fetch error (non-fatal)", raw: e?.response?.data });
    }

    // ✅ IMPORTANT CHANGE:
    // SELL pairing will NOT be done here.
    // We will do SELL pairing ONLY AFTER TradeBook matched trade exists.

    // 7) UPDATE LOCAL ORDER basic snapshot (optional)
    const avgPrice = Number(orderDetails?.avgprc) || 0;
    const filledQty = Number(orderDetails?.qty) || Number(reqInput.quantity) || 0;

    await newOrder.update({
      uniqueorderid: orderDetails?.exchordid || null,
      averageprice: avgPrice,
      lotsize: filledQty,
      price: avgPrice,
      status: orderDetails?.status ? String(orderDetails.status).toUpperCase() : null,
    });

    // 8) FETCH TRADEBOOK FOR FILL + THEN SELL PAIRING
    try {
      const tradeBook = await fetchTradeBookWithRetry({ uid, susertoken });

      logSuccess(req, {
        msg: "TradeBook response",
        isArray: Array.isArray(tradeBook),
        size: tradeBook?.length,
      });

      let t = null;
      if (Array.isArray(tradeBook)) {
        t = tradeBook.find((tr) => String(tr.norenordno) === String(orderid));
      }

      logSuccess(req, { msg: "Matched trade entry", trade: t });

      if (!t) {
        // trade not found yet -> keep PENDING/OPEN (do not close BUY)
        await newOrder.update({
          orderstatuslocaldb: "PENDING",
          text: "TRADE_NOT_FOUND_YET",
        });

        return {
          userId: user.id,
          broker: "Finvasia",
          result: "SUCCESS",
          orderid,
          note: "Trade not found yet in TradeBook",
        };
      }

      // ✅ NOW trade is confirmed → do SELL pairing safely
      let finalStatus = "OPEN";
      let buyOrderId = "NA";
      let buyOrder = null;

      if (transactionType === "SELL") {
        buyOrderId = String(reqInput.buyOrderId || "NA");

        // find your BUY position to close
        buyOrder = await Order.findOne({
          where: {
            userId: user.id,
            orderid: buyOrderId,
            status: "COMPLETE",
            orderstatuslocaldb: "OPEN",
          },
          raw: true,
        });

        logSuccess(req, { msg: "SELL pairing after TradeBook matched", buyOrderId, buyOrderFound: !!buyOrder });

        if (buyOrder) {
          await Order.update(
            { orderstatuslocaldb: "COMPLETE" },
            { where: { id: buyOrder.id } }
          );
          finalStatus = "COMPLETE";
        } else {
          // if not found, still mark SELL complete but keep logs
          finalStatus = "COMPLETE";
        }
      }

      const tradePrice = Number(t.flprc) || avgPrice;
      const tradeQty = Number(t.trdq) || Number(t.qty) || Number(reqInput.quantity) || 0;

      const buyPrice = Number(buyOrder?.fillprice || 0);
      const buySize = Number(buyOrder?.fillsize || 0);
      const buyValue = Number(buyOrder?.tradedValue || 0);
      let buyTime = buyOrder?.filltime || "NA";

      let pnl = tradeQty * tradePrice - buyPrice * buySize;
      if (transactionType === "BUY") {
        pnl = 0;
        buyTime = "NA";
      }

      const iso = await toISOStringUTC(t.fltm);

      await newOrder.update({
        tradedValue: tradePrice * tradeQty,
        fillprice: tradePrice,
        fillsize: tradeQty,
        fillid: t.flid,
        price: tradePrice,
        filltime: iso,
        status: "COMPLETE",
        orderstatuslocaldb: finalStatus,
        buyOrderId: buyOrderId,
        pnl,
        buyTime,
        buyprice: buyPrice,
        buysize: buySize,
        buyvalue: buyValue,
      });

      logSuccess(req, {
        msg: "Local DB updated with TradeBook trade fill",
        orderid,
        tradePrice,
        tradeQty,
        pnl,
        filltime: iso,
        finalStatus,
      });

    } catch (e) {
      logError(req, e, { msg: "TradeBook fetch error (non-fatal)", raw: e?.response?.data });

      // tradebook fail -> don't close BUY; keep pending
      await newOrder.update({
        orderstatuslocaldb: "PENDING",
        text: "TRADEBOOK_ERROR",
      });
    }

    logSuccess(req, { msg: "Finvasia order flow finished", orderid });
    return {
      userId: user.id,
      broker: "Finvasia",
      result: "SUCCESS",
      orderid,
    };

  } catch (err) {
    logError(req, err, { msg: "Finvasia Order Error (catch)" });
    return {
      userId: user?.id,
      broker: "Finvasia",
      result: "ERROR",
      message: err.message,
    };
  }
};

//  new code end 



export const placeFinavasiaOrder111 = async (user, reqInput, req, isLocalDbFlow = true) => {
  try {

    const nowISOError = new Date().toISOString();

    console.log('=============Finvasia====================');

    logSuccess(req, {
      msg: 'Finvasia order flow started',
      userId: user?.id,
      reqInput,
    });

    // ✅ helper sleep
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

    // ✅ helper: normalize status
    const normalizeStatus = (st) =>
      String(st ?? "")
        .trim()
        .toUpperCase()
        .replace(/\s+/g, " ");

    // ✅ helper: decide if should retry
    const isFinalStatus = (statusNorm) => {
      // final: complete/reject/cancel
      if (statusNorm.includes("COMPLETE") || statusNorm.includes("FILLED")) return true;
      if (statusNorm.includes("REJECT")) return true;
      if (statusNorm.includes("CANCEL")) return true;
      return false;
    };

    const isRetryableStatus = (statusNorm) => {
      // non-final: open/pending/trigger pending/partial etc.
      const retryables = [
        "OPEN",
        "PENDING",
        "TRIGGER PENDING",
        "TRIG PENDING",
        "PARTIAL",
        "PARTIALLY FILLED",
        "AMO",
      ];
      return retryables.some((x) => statusNorm === x || statusNorm.includes(x));
    };

    // ✅ OrderBook with retries (only for OPEN/PENDING type)
    const fetchOrderDetailsWithRetry = async ({ uid, susertoken, orderid }) => {
      const MAX_RETRIES = 3;          // as you requested
      const RETRY_DELAY_MS = 1500;    // 1.5 sec

      let lastOrderDetails = null;

      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          const obBody = `jKey=${susertoken}&jData=${JSON.stringify({ uid, actid: uid })}`;
          logSuccess(req, {
            msg: "OrderBook request prepared",
            attempt,
            obBodyPreview: obBody.slice(0, 150) + "...",
          });

          const obResp = await axios.post(`${SHOONYA_BASE_URL}/OrderBook`, obBody, {
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
          });

          const obData = obResp.data;
          logSuccess(req, {
            msg: "Shoonya OrderBook response",
            attempt,
            isArray: Array.isArray(obData),
            size: obData?.length,
          });

          if (!Array.isArray(obData)) {
            // response unexpected → retry a bit (but only 3 attempts)
            if (attempt < MAX_RETRIES) await sleep(RETRY_DELAY_MS);
            continue;
          }

          const orderDetails = obData.find((o) => String(o.norenordno) === String(orderid));
          lastOrderDetails = orderDetails || lastOrderDetails;

          if (!orderDetails) {
            logSuccess(req, { msg: "Order not found in OrderBook yet", attempt, orderid });
            if (attempt < MAX_RETRIES) await sleep(RETRY_DELAY_MS);
            continue;
          }

          const statusNorm = normalizeStatus(orderDetails?.status);
          logSuccess(req, {
            msg: "OrderBook matched orderDetails (poll)",
            attempt,
            orderid,
            statusNorm,
          });

          // ✅ If status is FINAL → return immediately (no retry)
          if (isFinalStatus(statusNorm)) {
            return orderDetails;
          }

          // ✅ If status is OPEN/PENDING/etc → retry (until attempts exhausted)
          if (isRetryableStatus(statusNorm)) {
            if (attempt < MAX_RETRIES) {
              logSuccess(req, {
                msg: "Order is still OPEN/PENDING type - will retry OrderBook",
                attempt,
                statusNorm,
              });
              await sleep(RETRY_DELAY_MS);
              continue;
            }
            // last attempt done → return what we have
            return orderDetails;
          }

          // ✅ Unknown status → don't infinite loop; return immediately
          logSuccess(req, { msg: "Unknown Shoonya status - no retry", attempt, statusNorm, details: orderDetails });
          return orderDetails;

        } catch (e) {
          logError(req, e, { msg: "OrderBook fetch error (attempt)", attempt, raw: e?.response?.data });

          if (attempt < MAX_RETRIES) {
            await sleep(RETRY_DELAY_MS);
            continue;
          }
        }
      }

      return lastOrderDetails; // may be null
    };

    // 1) Resolve mappings + validate session
    const transactionType = (reqInput.transactiontype || "").toUpperCase();
    const uid = user?.kite_client_id;
    const susertoken = user?.authToken;

    logSuccess(req, {
      msg: "Resolved user + transaction",
      transactionType,
      uid,
      susertoken: maskToken(susertoken),
    });

    if (!uid || !susertoken) {
      logSuccess(req, { msg: "Missing uid/token - login required", uid, token: !!susertoken });
      return {
        userId: user?.id,
        broker: "Finvasia",
        result: "ERROR",
        message: "Shoonya uid or token missing. Please login Shoonya first.",
      };
    }

    // 2) CREATE LOCAL PENDING ORDER
    const orderData = {
      symboltoken: reqInput.finavasiaToken || reqInput.token,
      variety: reqInput.variety || "NORMAL",
      tradingsymbol: reqInput?.finavasiaSymbol || reqInput?.symbol,
      instrumenttype: reqInput.instrumenttype,
      transactiontype: transactionType,
      exchange: reqInput.exch_seg,
      ordertype: reqInput.orderType,
      quantity: reqInput.quantity,
      producttype: reqInput.productType,
      price: reqInput.price,
      orderstatuslocaldb: "PENDING",
      totalPrice: reqInput.totalPrice,
      actualQuantity: reqInput.actualQuantity,
      userId: user.id,
      broker: "finvasia",
      angelOneSymbol: reqInput.angelOneSymbol || reqInput.symbol,
      angelOneToken: reqInput.angelOneToken || reqInput.token,
      userNameId: user.username,
      strategyName: reqInput?.groupName || "",
      strategyUniqueId: reqInput?.strategyUniqueId || ""
    };

    logSuccess(req, { msg: "Prepared local pending order", orderData });
    const newOrder = await Order.create(orderData);
    logSuccess(req, { msg: "Local DB saved (PENDING)", localOrderId: newOrder.id });

    // 2) Mappings (if required)
    const shoonyaProductType = isLocalDbFlow ? getShoonyaProductCode(reqInput.productType) : reqInput.productType;
    const shoonyaOrderType = isLocalDbFlow ? mapOrderTypeToShoonya(reqInput.orderType) : reqInput.orderType;

    // 3) BUILD SHOONYA PAYLOAD
    const jData = {
      uid: String(uid),
      actid: String(uid),
      exch: String(reqInput.exch_seg),
      tsym: String(reqInput?.finavasiaSymbol || reqInput?.symbol),
      qty: String(reqInput.quantity),
      prc: String(reqInput.orderType === "MARKET" ? 0 : reqInput.price),
      prd: shoonyaProductType,
      prctyp: shoonyaOrderType,
      trantype: mapTransactionType(reqInput.transactiontype),
      ret: "DAY",
    };

    console.log(jData, 'jData=====================');

    logSuccess(req, { msg: "Prepared Shoonya jData", jData });
    const body = `jData=${JSON.stringify(jData)}&jKey=${susertoken}`;
    logSuccess(req, { msg: "Prepared Shoonya PlaceOrder body", bodyPreview: body.slice(0, 200) + "..." });

    // 4) PLACE ORDER IN SHOONYA
    let placeRes;
    try {
      const resp = await axios.post(`${SHOONYA_BASE_URL}/PlaceOrder`, body, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      placeRes = resp.data;
      logSuccess(req, { msg: "Shoonya PlaceOrder response", placeRes });

      console.log('===============placeRes===========', placeRes);

      if (!placeRes || placeRes.stat !== "Ok") {
        const msg = placeRes?.emsg || "Shoonya order placement failed";
        await newOrder.update({
          orderstatuslocaldb: "FAILED",
          status: "FAILED",
          text: msg,
          buyTime: nowISOError,
          filltime: nowISOError,
        });
        logSuccess(req, { msg: "Local DB updated FAILED", localOrderId: newOrder.id, reason: msg });
        return {
          userId: user.id,
          broker: "Finvasia",
          result: "BROKER_REJECTED",
          message: msg,
          raw: placeRes,
        };
      }
    } catch (err) {

      console.log('===============placeRes error ===========', err?.response?.data?.emsg);
      logError(req, err, { msg: "Shoonya PlaceOrder API error", raw: err?.response?.data });
      await newOrder.update({
        orderstatuslocaldb: "FAILED",
        status: "FAILED",
        text: err?.response?.data?.emsg || err?.message || "Shoonya PlaceOrder error",
        buyTime: nowISOError,
        filltime: nowISOError,
      });
      logSuccess(req, { msg: "Local DB updated FAILED (exception)", localOrderId: newOrder.id });
      return {
        userId: user.id,
        broker: "Finvasia",
        result: "BROKER_ERROR",
        message: err?.message || "Shoonya PlaceOrder error",
      };
    }

    const orderid = placeRes.norenordno;
    await newOrder.update({ orderid });
    logSuccess(req, { msg: "Saved Shoonya norenordno into local DB", orderid, localOrderId: newOrder.id });

    // 5) FETCH ORDER DETAILS FROM SHOONYA (OrderBook) WITH 3-RETRY (only if OPEN/PENDING)
    let orderDetails = null;
    try {
      orderDetails = await fetchOrderDetailsWithRetry({ uid, susertoken, orderid });


      console.log('============orderDetails===========',orderDetails);
      

      // ✅ now handle status based on the final polled snapshot
      if (orderDetails) {

        //  new code start
        const rawStatus = orderDetails?.status ?? "";
        const statusNorm = normalizeStatus(rawStatus);

        if (["REJECTED", "REJECT"].includes(statusNorm) || statusNorm.includes("REJECT")) {
          await newOrder.update({
            status: "REJECTED",
            orderstatuslocaldb: "REJECTED",
            text: orderDetails?.rejreason || "",
            buyTime: nowISOError,
            filltime: nowISOError,
          });
          return {
            userId: user.id,
            broker: "Finvasia",
            result: "BROKER_REJECTED",
            message: orderDetails?.rejreason || "Order rejected",
            orderid,
          };
        }

        if (["CANCELLED", "CANCELED"].includes(statusNorm) || statusNorm.includes("CANCEL")) {
          await newOrder.update({
            status: "REJECTED",
            orderstatuslocaldb: "REJECTED",
            text: orderDetails?.rejreason || "",
            buyTime: nowISOError,
            filltime: nowISOError,
          });
          return {
            userId: user.id,
            broker: "Finvasia",
            result: "BROKER_REJECTED",
            message: orderDetails?.rejreason || "Order cancelled",
            orderid,
          };
        }

        // ✅ COMPLETE -> no retry happened (or retry ended early)
        if (statusNorm.includes("COMPLETE") || statusNorm.includes("FILLED")) {
          await newOrder.update({
            status: "COMPLETE",
            orderstatuslocaldb: "OPEN", // if you keep OPEN for live positions, else "COMPLETE"
            text: "",
          });
          // continue flow to tradebook below (it will fill details)
        }

        // ✅ OPEN/PENDING after retries -> keep OPEN
        if (statusNorm.includes("OPEN") || statusNorm.includes("PENDING") || statusNorm.includes("TRIGGER PENDING") || statusNorm.includes("PARTIAL")) {
          await newOrder.update({
            status: "OPEN",
            orderstatuslocaldb: "OPEN",
            text: orderDetails?.rejreason || "",
            buyTime: nowISOError,
            filltime: nowISOError,
          });
          // continue flow (tradebook may not have trade yet)
        } else {

          logSuccess(req, {
            msg: "shoonya order with check response",
            details: orderDetails,
          });

        }

      }

      logSuccess(req, { msg: "OrderBook matched orderDetails", orderDetails });

    } catch (e) {
      logError(req, e, { msg: "OrderBook fetch error (non-fatal)", raw: e?.response?.data });
    }

    // 6) HANDLE BUY / SELL LOGIC
    let finalStatus = "OPEN";
    let buyOrderId = "NA";
    let buyOrder = null;
    if (transactionType === "SELL") {
      try {
        buyOrder = await Order.findOne({
          where: {
            userId: user.id,
            status: "COMPLETE",
            orderstatuslocaldb: "OPEN",
            orderid: String(reqInput.buyOrderId),
          },
          raw: true,
        });
        logSuccess(req, { msg: "Matched BUY order for SELL", buyOrder });
        if (buyOrder) {
          await Order.update(
            { orderstatuslocaldb: "COMPLETE" },
            { where: { orderid: reqInput.buyOrderId } }
          );
          logSuccess(req, { msg: "Closed BUY order in local DB", buyOrderId: reqInput.buyOrderId });
        }
      } catch (e) {
        logError(req, e, { msg: "Error closing BUY order (non-fatal)", raw: e });
      }
      finalStatus = transactionType === "SELL" ? "COMPLETE" : "OPEN";
      buyOrderId = reqInput.buyOrderId
    }

    // 7) UPDATE LOCAL ORDER WITH BASIC DETAILS
    const avgPrice = Number(orderDetails?.avgprc) || 0;
    const filledQty = Number(orderDetails?.qty) || Number(reqInput.quantity) || 0;
    await newOrder.update({
      uniqueorderid: orderDetails?.exchordid || null,
      averageprice: avgPrice,
      lotsize: filledQty,
      price: avgPrice,
      orderstatuslocaldb: finalStatus,
      status: orderDetails?.status ? String(orderDetails.status).toUpperCase() : null,
    });
    logSuccess(req, {
      msg: "Local DB updated with OrderBook snapshot",
      avgPrice,
      filledQty,
      orderDetailsStatus: orderDetails?.status,
    });

    // 8) FETCH TRADEBOOK FOR MORE DETAILS
    try {
      const tbBody = `jKey=${susertoken}&jData=${JSON.stringify({ uid, actid: uid })}`;
      logSuccess(req, { msg: "TradeBook request prepared", tbBodyPreview: tbBody.slice(0, 150) + "..." });
      const tbResp = await axios.post(`${SHOONYA_BASE_URL}/TradeBook`, tbBody, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      const tradeBook = tbResp.data;
      logSuccess(req, { msg: "TradeBook response", isArray: Array.isArray(tradeBook), size: tradeBook?.length });
      let t = null;
      if (Array.isArray(tradeBook)) {
        t = tradeBook.find((tr) => String(tr.norenordno) === String(orderid));
      }
      logSuccess(req, { msg: "Matched trade entry", trade: t });
      if (t) {
        const tradePrice = Number(t.flprc) || avgPrice;
        const tradeQty = Number(t.trdq) || Number(t.qty) || Number(reqInput.quantity) || 0;
        const buyPrice = buyOrder?.fillprice || 0;
        const buySize = buyOrder?.fillsize || 0;
        const buyValue = buyOrder?.tradedValue || 0;
        let buyTime = buyOrder?.filltime || "NA";
        let pnl = tradeQty * tradePrice - buyPrice * buySize;
        if (transactionType === "BUY") {
          pnl = 0;
          buyTime = "NA";
        }
        const iso = await toISOStringUTC(t.fltm);
        await newOrder.update({
          tradedValue: tradePrice * tradeQty,
          fillprice: tradePrice,
          fillsize: tradeQty,
          fillid: t.flid,
          price: tradePrice,
          filltime: iso,
          status: "COMPLETE",
          buyOrderId: buyOrderId,
          pnl,
          buyTime,
          buyprice: buyPrice,
          buysize: buySize,
          buyvalue: buyValue,
        });
        logSuccess(req, {
          msg: "Local DB updated with TradeBook trade fill",
          orderid,
          tradePrice,
          tradeQty,
          pnl,
          filltime: iso,
        });
      } else {
        logSuccess(req, { msg: "No trade found yet for this order in TradeBook", orderid });
      }
    } catch (e) {
      logError(req, e, { msg: "TradeBook fetch error (non-fatal)", raw: e?.response?.data });
    }

    // 9) RETURN
    logSuccess(req, { msg: "Finvasia order flow finished", orderid });
    return {
      userId: user.id,
      broker: "Finvasia",
      result: "SUCCESS",
      orderid,
    };
  } catch (err) {
    logError(req, err, { msg: "Finvasia Order Error (catch)" });
    return {
      userId: user.id,
      broker: "Finvasia",
      result: "ERROR",
      message: err.message,
    };
  }
};



// Unified function for both order flows wokring code
export const placeFinavasiaOrder1 = async (user, reqInput, req, isLocalDbFlow = true) => {
  try {

  const nowISOError = new Date().toISOString();

    console.log('=============Finvasia====================');
    

    logSuccess(req, {
      msg: 'Finvasia order flow started',
      userId: user?.id,
      reqInput,
    });

    // 1) Resolve mappings + validate session
    const transactionType = (reqInput.transactiontype || "").toUpperCase();
    const uid = user?.kite_client_id;
    const susertoken = user?.authToken;

    logSuccess(req, {
      msg: "Resolved user + transaction",
      transactionType,
      uid,
      susertoken: maskToken(susertoken),
    });

    if (!uid || !susertoken) {
      logSuccess(req, { msg: "Missing uid/token - login required", uid, token: !!susertoken });
      return {
        userId: user?.id,
        broker: "Finvasia",
        result: "ERROR",
        message: "Shoonya uid or token missing. Please login Shoonya first.",
      };
    }

    // 2) CREATE LOCAL PENDING ORDER
    const orderData = {
      symboltoken:  reqInput.finavasiaToken || reqInput.token ,
      variety: reqInput.variety || "NORMAL",
      tradingsymbol: reqInput?.finavasiaSymbol||reqInput?.symbol,
      instrumenttype: reqInput.instrumenttype,
      transactiontype: transactionType,
      exchange: reqInput.exch_seg,
      ordertype: reqInput.orderType,
      quantity: reqInput.quantity,
      producttype: reqInput.productType,
      price: reqInput.price,
      orderstatuslocaldb: "PENDING",
      totalPrice: reqInput.totalPrice,
      actualQuantity: reqInput.actualQuantity,
      userId: user.id,
      broker: "finvasia",
      angelOneSymbol: reqInput.angelOneSymbol || reqInput.symbol,
      angelOneToken: reqInput.angelOneToken || reqInput.token,
      userNameId: user.username,
      strategyName:reqInput?.groupName||"",
      strategyUniqueId:reqInput?.strategyUniqueId||""
    };

    logSuccess(req, { msg: "Prepared local pending order", orderData });
    const newOrder = await Order.create(orderData);
    logSuccess(req, { msg: "Local DB saved (PENDING)", localOrderId: newOrder.id });


    // 2) Mappings (if required)
    const shoonyaProductType = isLocalDbFlow ? getShoonyaProductCode(reqInput.productType)  : reqInput.productType ;
     const shoonyaOrderType = isLocalDbFlow ?  mapOrderTypeToShoonya(reqInput.orderType)  :reqInput.orderType ;

    // 3) BUILD SHOONYA PAYLOAD
    const jData = {
      uid: String(uid),
      actid: String(uid),
      exch: String(reqInput.exch_seg),
      tsym: String(reqInput?.finavasiaSymbol||reqInput?.symbol),
      qty: String(reqInput.quantity),
      prc: String(reqInput.orderType === "MARKET" ? 0 : reqInput.price),
      prd:shoonyaProductType,
      prctyp: shoonyaOrderType,
      trantype: mapTransactionType(reqInput.transactiontype),
      ret: "DAY",
    };

    console.log(jData,'jData=====================');
    

    logSuccess(req, { msg: "Prepared Shoonya jData", jData });
    const body = `jData=${JSON.stringify(jData)}&jKey=${susertoken}`;
    logSuccess(req, { msg: "Prepared Shoonya PlaceOrder body", bodyPreview: body.slice(0, 200) + "..." });

    // 4) PLACE ORDER IN SHOONYA
    let placeRes;
    try {
      const resp = await axios.post(`${SHOONYA_BASE_URL}/PlaceOrder`, body, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      placeRes = resp.data;
      logSuccess(req, { msg: "Shoonya PlaceOrder response", placeRes });


      console.log('===============placeRes===========',placeRes);
      

      if (!placeRes || placeRes.stat !== "Ok") {
        const msg = placeRes?.emsg || "Shoonya order placement failed";
        await newOrder.update({
          orderstatuslocaldb: "FAILED",
          status: "FAILED",
          text: msg,
          buyTime: nowISOError,
        filltime: nowISOError,
        });
        logSuccess(req, { msg: "Local DB updated FAILED", localOrderId: newOrder.id, reason: msg });
        return {
          userId: user.id,
          broker: "Finvasia",
          result: "BROKER_REJECTED",
          message: msg,
          raw: placeRes,
        };
      }
    } catch (err) {

      console.log('===============placeRes error ===========',err?.response?.data.emsg); 
      logError(req, err, { msg: "Shoonya PlaceOrder API error", raw: err?.response?.data });
      await newOrder.update({
        orderstatuslocaldb: "FAILED",
        status: "FAILED",
        text: err?.response?.data?.emsg||err?.message || "Shoonya PlaceOrder error",
          buyTime: nowISOError,
        filltime: nowISOError,
      });
      logSuccess(req, { msg: "Local DB updated FAILED (exception)", localOrderId: newOrder.id });
      return {
        userId: user.id,
        broker: "Finvasia",
        result: "BROKER_ERROR",
        message: err?.message || "Shoonya PlaceOrder error",
      };
    }

    const orderid = placeRes.norenordno;
    await newOrder.update({ orderid });
    logSuccess(req, { msg: "Saved Shoonya norenordno into local DB", orderid, localOrderId: newOrder.id });

    // 5) FETCH ORDER DETAILS FROM SHOONYA (OrderBook)
    let orderDetails = null;
    try {
      const obBody = `jKey=${susertoken}&jData=${JSON.stringify({ uid, actid: uid })}`;
      logSuccess(req, { msg: "OrderBook request prepared", obBodyPreview: obBody.slice(0, 150) + "..." });
      const obResp = await axios.post(`${SHOONYA_BASE_URL}/OrderBook`, obBody, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      const obData = obResp.data;
      logSuccess(req, { msg: " Shoonya OrderBook response", isArray: Array.isArray(obData), size: obData?.length });
      if (Array.isArray(obData)) {

        orderDetails = obData.find((o) => String(o.norenordno) === String(orderid));

        //  new code start 
        const rawStatus = orderDetails?.status ?? "";
        const statusNorm = String(rawStatus).trim().toUpperCase(); // normalize


        if (["REJECTED", "REJECT"].includes(statusNorm)) {
          return await newOrder.update({
            status: "REJECTED",
            orderstatuslocaldb: "REJECTED",
            text: orderDetails?.rejreason || "",
            buyTime: nowISOError,
            filltime: nowISOError,
          });
        }

        if (["CANCELLED", "CANCELED"].includes(statusNorm)) {
          return await newOrder.update({
            status: "REJECTED",
            orderstatuslocaldb: "REJECTED",
            text: orderDetails?.rejreason || "",
            buyTime: nowISOError,
            filltime: nowISOError,
          });
        }

        if (["OPEN"].includes(statusNorm)) {
          return await newOrder.update({
            status: "OPEN",
            orderstatuslocaldb: "OPEN",
            text: orderDetails?.rejreason || "",
            buyTime: nowISOError,
            filltime: nowISOError,
          });
        }else{
                  
              logSuccess(req, {
                msg: "shoonya order with check response",
                details: orderDetails,
              }); 

          }

           //  new code end 


    //      if(orderDetails.status==='REJECTED') {

    //       return await newOrder.update({ 
    //         status:"REJECTED",
    //         orderstatuslocaldb:"REJECTED",
    //         text:orderDetails?.rejreason||"",
    //         buyTime: nowISOError,
    //         filltime: nowISOError,

    //        });

    //      }else if(orderDetails.status==='CANCELLED') {

    //       return  await newOrder.update({
    //          status:"REJECTED",
    //          orderstatuslocaldb:"REJECTED",
    //          text:orderDetails?.rejreason||"",
    //            buyTime: nowISOError,
    //         filltime: nowISOError, 
    //         });

    //      }else if(orderDetails.status==='Open'){

    //        return  await newOrder.update({
    //          status:"OPEN",
    //          orderstatuslocaldb:"OPEN",
    //          text:orderDetails?.rejreason||"",
    //         buyTime: nowISOError,
    //         filltime: nowISOError, 
    //         });

    //      }else{
          
    //       logSuccess(req, {
    //         msg: "shoonya order with check response",
    //         details: orderDetails,
    //       }); 

    // }


      }
      logSuccess(req, { msg: "OrderBook matched orderDetails", orderDetails });
    } catch (e) {
      logError(req, e, { msg: "OrderBook fetch error (non-fatal)", raw: e?.response?.data });
    }

    // 6) HANDLE BUY / SELL LOGIC
    let finalStatus = "OPEN";
    let buyOrderId = "NA";
    let buyOrder = null;
    if (transactionType === "SELL") {
      try {
        buyOrder = await Order.findOne({
          where: {
            userId: user.id,
            status: "COMPLETE",
            orderstatuslocaldb: "OPEN",
            orderid: String(reqInput.buyOrderId),
          },
          raw: true,
        });
        logSuccess(req, { msg: "Matched BUY order for SELL", buyOrder });
        if (buyOrder) {
          await Order.update(
            { orderstatuslocaldb: "COMPLETE" },
            { where: { orderid: reqInput.buyOrderId } }
          );
          logSuccess(req, { msg: "Closed BUY order in local DB", buyOrderId: reqInput.buyOrderId });
        }
      } catch (e) {
        logError(req, e, { msg: "Error closing BUY order (non-fatal)", raw: e });
      }
      finalStatus = transactionType === "SELL" ? "COMPLETE" : "OPEN";
      buyOrderId = reqInput.buyOrderId
    }

    // 7) UPDATE LOCAL ORDER WITH BASIC DETAILS
    const avgPrice = Number(orderDetails?.avgprc) || 0;
    const filledQty = Number(orderDetails?.qty) || Number(reqInput.quantity) || 0;
    await newOrder.update({
      uniqueorderid: orderDetails?.exchordid || null,
      averageprice: avgPrice,
      lotsize: filledQty,
      price: avgPrice,
      orderstatuslocaldb: finalStatus,
      status: orderDetails?.status ? String(orderDetails.status).toUpperCase() : null,
    });
    logSuccess(req, {
      msg: "Local DB updated with OrderBook snapshot",
      avgPrice,
      filledQty,
      orderDetailsStatus: orderDetails?.status,
    });

    // 8) FETCH TRADEBOOK FOR MORE DETAILS
    try {
      const tbBody = `jKey=${susertoken}&jData=${JSON.stringify({ uid, actid: uid })}`;
      logSuccess(req, { msg: "TradeBook request prepared", tbBodyPreview: tbBody.slice(0, 150) + "..." });
      const tbResp = await axios.post(`${SHOONYA_BASE_URL}/TradeBook`, tbBody, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      const tradeBook = tbResp.data;
      logSuccess(req, { msg: "TradeBook response", isArray: Array.isArray(tradeBook), size: tradeBook?.length });
      let t = null;
      if (Array.isArray(tradeBook)) {
        t = tradeBook.find((tr) => String(tr.norenordno) === String(orderid));
      }
      logSuccess(req, { msg: "Matched trade entry", trade: t });
      if (t) {
        const tradePrice = Number(t.flprc) || avgPrice;
        const tradeQty = Number(t.trdq) || Number(t.qty) || Number(reqInput.quantity) || 0;
        const buyPrice = buyOrder?.fillprice || 0;
        const buySize = buyOrder?.fillsize || 0;
        const buyValue = buyOrder?.tradedValue || 0;
        let buyTime = buyOrder?.filltime || "NA";
        let pnl = tradeQty * tradePrice - buyPrice * buySize;
        if (transactionType === "BUY") {
          pnl = 0;
          buyTime = "NA";
        }
        const iso = await toISOStringUTC(t.fltm);
        await newOrder.update({
          tradedValue: tradePrice * tradeQty,
          fillprice: tradePrice,
          fillsize: tradeQty,
          fillid: t.flid,
          price: tradePrice,
          filltime: iso,
          status: "COMPLETE",
          buyOrderId:buyOrderId,
          pnl,
          buyTime,
          buyprice: buyPrice,
          buysize: buySize,
          buyvalue: buyValue,
        });
        logSuccess(req, {
          msg: "Local DB updated with TradeBook trade fill",
          orderid,
          tradePrice,
          tradeQty,
          pnl,
          filltime: iso,
        });
      } else {
        logSuccess(req, { msg: "No trade found yet for this order in TradeBook", orderid });
      }
    } catch (e) {
      logError(req, e, { msg: "TradeBook fetch error (non-fatal)", raw: e?.response?.data });
    }

    // 9) RETURN
    logSuccess(req, { msg: "Finvasia order flow finished", orderid });
    return {
      userId: user.id,
      broker: "Finvasia",
      result: "SUCCESS",
      orderid,
    };
  } catch (err) {
    logError(req, err, { msg: "Finvasia Order Error (catch)" });
    return {
      userId: user.id,
      broker: "Finvasia",
      result: "ERROR",
      message: err.message,
    };
  }
};
