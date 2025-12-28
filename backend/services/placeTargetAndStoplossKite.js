import Order from "../models/orderModel.js";
import { logSuccess, logError } from "../utils/loggerr.js";
import { getKiteClientForUserId } from "./userKiteBrokerService.js";

const isSL = (t) => String(t || "").toUpperCase().includes("SL");
const num = (v, d = 0) => {
  const x = Number(v);
  return Number.isFinite(x) ? x : d;
};


// -------------------- MAPPERS --------------------
function getKiteProductCode(type) {
  if (!type) return "";
  switch (type.toUpperCase()) {
    case "DELIVERY": return "CNC";
    case "CARRYFORWARD": return "NRML";
    case "MARGIN": return "MTF";
    case "INTRADAY": return "MIS";
    case "BO": return "MIS";
    default: return type.toUpperCase();
  }
}

function mapVarietyToKite(variety) {
  if (!variety) return "regular";
  switch (variety.toUpperCase()) {
    case "NORMAL": return "regular";
    case "STOPLOSS": return "co";
    case "ROBO": return "iceberg";
    default: return "regular";
  }
}


export const placeTargetAndStoplossKiteOrder = async (user, reqInput, req, useMappings = true) => {
  let newOrder = null;
  const nowISOError = new Date().toISOString();

  try {
    logSuccess(req, { msg: "Kite order flow started", userId: user?.id, reqInput });

    // 1) Kite instance
    const kite = await getKiteClientForUserId(user.id);
    
    logSuccess(req, { msg: "Kite client created", userId: user.id });

    const kiteProductType = useMappings ? getKiteProductCode(reqInput.productType) : reqInput.productType;

     logSuccess(req, { msg: "Kite kiteProductType created", kiteProductType: kiteProductType });

    const kiteVariety = useMappings ? mapVarietyToKite(reqInput.variety) : reqInput.variety;

     logSuccess(req, { msg: "Kite kiteVariety created", kiteVariety: kiteVariety });

    const ordertype = String(reqInput.orderType || "MARKET").toUpperCase();
    const transactiontype = String(reqInput.transactiontype || "").toUpperCase();

    const price = num(reqInput.price, 0);
    const triggerprice = isSL(ordertype) ? num(reqInput.triggerprice ?? reqInput.price, 0) : 0;

     logSuccess(req, { msg: "Kite price triggerprice", price,triggerprice });

    // 2) Local pending order
    const orderData = {
      symboltoken: reqInput.kiteToken || reqInput.token,
      variety: kiteVariety || "regular",
      tradingsymbol: reqInput.kiteSymbol || reqInput.symbol,
      instrumenttype: reqInput.instrumenttype,
      transactiontype,
      exchange: reqInput.exch_seg,
      ordertype,
      quantity: String(reqInput.quantity),
      producttype: kiteProductType,
      price,
      triggerprice,
      squareoff: 0,
      stoploss: 0,
      ordertag:"softwaresetu",
      orderstatuslocaldb: "PENDING",
      totalPrice: reqInput.totalPrice ?? null,
      actualQuantity: reqInput.actualQuantity ?? null,
      userId: user.id,
      broker: "kite",
      angelOneSymbol: reqInput.angelOneSymbol || reqInput.symbol,
      angelOneToken: reqInput.angelOneToken || reqInput.token,
      userNameId: user.username,
      buyOrderId: reqInput?.buyOrderId || null,
      strategyName: reqInput?.groupName || "",
      strategyUniqueId: reqInput?.strategyUniqueId || "",
    };

    newOrder = await Order.create(orderData);
    logSuccess(req, { msg: "Local order saved", localRowId: newOrder.id });

    // 3) Kite payload
    const orderParams = {
      exchange: reqInput.exch_seg,
      tradingsymbol: reqInput.kiteSymbol || reqInput.symbol,
      transaction_type: transactiontype, // BUY/SELL
      quantity: Number(reqInput.quantity),
      product: kiteProductType,
      tag:"softwaresetu",
      order_type: ordertype, // LIMIT / SL
      price: ordertype === "LIMIT" || ordertype === "SL" ? price : 0,
      trigger_price: ordertype === "SL" ? triggerprice : 0,
      market_protection: 5,
      validity: "DAY",
    };

    logSuccess(req, { msg: "Prepared Kite payload", orderParams });

    let placeRes;
    try {
      placeRes = await kite.placeOrder(orderData.variety, orderParams);
      logSuccess(req, { msg: "Kite order placed", placeRes });
    } catch (err) {
      logError(req, err, { msg: "Kite order placement failed" });

      await newOrder.update({
        orderstatuslocaldb: "FAILED",
        status: "FAILED",
        positionStatus: "FAILED",
        text: err?.message || "Kite order placement failed",
        buyTime: nowISOError,
        filltime: nowISOError,
      });

      return { status: false, broker: "kite", message: err?.message || "Kite order failed", localDbId: newOrder.id };
    }

    const orderid = placeRes?.order_id;
    await newOrder.update({ orderid, orderstatuslocaldb: "OPEN", status: "OPEN" });

    logSuccess(req, { msg: "Kite order id saved locally", orderid });

    return {
      status: true,
      broker: "kite",
      orderid,
      localDbId: newOrder.id,
    };
  } catch (error) {
    logError(req, error, { msg: "placeKiteOrder failed unexpectedly" });

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

    return { status: false, broker: "kite", message: error?.message || "Unexpected error", localDbId: newOrder?.id };
  }
};
