import axios from "axios";
import Order from "../models/orderModel.js";
import { logSuccess, logError } from "../utils/loggerr.js";


// -----------------------
// API ENDPOINTS
// -----------------------
const ANGEL_ONE_PLACE_URL =
  "https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/placeOrder";


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


// ✅ detect SL ordertypes
const isStoplossOrderType = (t) => {
  const x = String(t || "").toUpperCase();
  return x.includes("SL") || x.includes("STOPLOSS");
};

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


// ✅ normalize numbers
const n = (v, d = 0) => {
  const x = Number(v);
  return Number.isFinite(x) ? x : d;
};

export const placeTargetAndStoplossAngelOrder = async (user, reqInput, req) => {
  let newOrder = null;
  const nowISOError = new Date().toISOString();

  try {

    logSuccess(req, { msg: "AngelOne order flow started", userId: user?.id, reqInput });

    const isSL = isStoplossOrderType(reqInput.orderType);

    const price = n(reqInput.price, 0);
    const triggerprice = isSL ? n(reqInput.triggerprice ?? reqInput.price, 0) : 0;

    // 1️⃣ Local order object (PENDING)
    const orderData = {
      variety: reqInput.variety || "NORMAL",
      tradingsymbol: reqInput.symbol,
      instrumenttype: reqInput.instrumenttype,
      symboltoken: String(reqInput.token),
      transactiontype:"SELL",
      ordertag:"softwaresetu",
      exchange: reqInput.exch_seg,
      ordertype:reqInput.orderType,
      quantity: String(reqInput.quantity),
      producttype: reqInput.productType,
      duration: reqInput.duration || "DAY",
      price,
      triggerprice,
      squareoff:0,
      stoploss: 0,
      orderstatuslocaldb: "PENDING",
      totalPrice: reqInput.totalPrice ?? null,
      actualQuantity: reqInput.actualQuantity ?? null,
      userId: user.id,
      userNameId: user.username,
      broker: "angelone",
      angelOneSymbol: reqInput.angelOneSymbol || reqInput.symbol,
      angelOneToken: reqInput.angelOneToken || reqInput.token,
      buyOrderId: reqInput?.buyOrderId || null,
      strategyName: reqInput?.groupName || "",
      strategyUniqueId: reqInput?.strategyUniqueId || "",
    };

    logSuccess(req, { msg: "Prepared local AngelOne order", orderData });

    newOrder = await Order.create(orderData);

    logSuccess(req, { msg: "Local order saved", localOrderId: newOrder.id });

    // 3️⃣ Broker payload
    const brokerPayload = {
      variety: String(reqInput.variety || "NORMAL").toUpperCase(),
      tradingsymbol: reqInput.symbol,
      symboltoken: String(reqInput.token),
      transactiontype:"SELL",
      ordertag: "softwaresetu",
      exchange: reqInput.exch_seg,
      ordertype:reqInput.orderType, // ✅ LIMIT / STOPLOSS_LIMIT etc.
      producttype: String(reqInput.productType || "").toUpperCase(),
      duration: "DAY",
      price,
      triggerprice,
      squareoff: 0,
      stoploss: 0,
      quantity: Number(reqInput.quantity),
    };

    logSuccess(req, { msg: "Prepared AngelOne broker payload", brokerPayload });

    return {
      status: true,
      broker: "angelone",
      orderid:"orderid",
      uniqueorderid: "uniqueOrderId",
      localDbId: "newOrder.id",
    };

    // 4️⃣ Place order
    let placeRes;
    try {

      placeRes = await axios.post(ANGEL_ONE_PLACE_URL, brokerPayload, {
        headers: angelHeaders(user.authToken),
      });

        console.log('==============placeRes done ===========');

      logSuccess(req, { msg: "AngelOne placeOrder response received", response: placeRes.data });
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

      return { status: false, broker: "angelone", message: e.msg, localDbId: newOrder.id };
    }

    // 5️⃣ Broker rejected
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

      return { status: false, broker: "angelone", message: msg, localDbId: newOrder.id };
    }

    // 6️⃣ Save broker IDs
    const orderid = placeRes.data?.data?.orderid;
    
    const uniqueOrderId = placeRes.data?.data?.uniqueorderid;

    await newOrder.update({ orderid, uniqueorderid: uniqueOrderId, orderstatuslocaldb: "OPEN", status: "OPEN" });

    logSuccess(req, { msg: "AngelOne order placed successfully", orderid, uniqueOrderId });

    return {
      status: true,
      broker: "angelone",
      orderid,
      uniqueorderid: uniqueOrderId,
      localDbId: newOrder.id,
    };

  } catch (error) {
    logError(req, error, { msg: "placeAngelOrder failed unexpectedly" });

    if (newOrder?.id) {
      await newOrder.update({
        orderstatuslocaldb: "FAILED",
        status: "FAILED",
        positionStatus: "FAILED",
        text: error?.message || "Unexpected error",
        buyTime: nowISOError,
        filltime: nowISOError,
      });
    }

    return { status: false, broker: "angelone", message: error?.message || "Unexpected error", localDbId: newOrder?.id };
  }
};