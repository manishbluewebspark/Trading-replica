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

// Unified function for both order flows
export const placeFinavasiaOrder = async (user, reqInput, req, isLocalDbFlow = true) => {
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
      symboltoken: reqInput.token || reqInput.finavasiaToken,
      variety: reqInput.variety || "NORMAL",
      tradingsymbol: reqInput?.symbol ||reqInput?.finavasiaSymbol,
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
      tsym: String(reqInput.symbol),
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

         if(orderDetails.status==='REJECTED') {

          return await newOrder.update({ 
            status:"REJECTED",
            orderstatuslocaldb:"REJECTED",
            text:orderDetails?.rejreason||"",
            buyTime: nowISOError,
            filltime: nowISOError,

           });

         }else if(orderDetails.status==='CANCELLED') {

          return  await newOrder.update({
             status:"REJECTED",
             orderstatuslocaldb:"REJECTED",
             text:orderDetails?.rejreason||"",
               buyTime: nowISOError,
            filltime: nowISOError, 
            });

         }else{
          
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
      symboltoken: reqInput.token||reqInput.kiteToken ,
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
