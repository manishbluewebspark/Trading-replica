import axios from "axios";
import Order from "../models/orderModel.js";

// =======================
// UPSTOX CONSTANTS
// =======================
const UPSTOX_BASE = "https://api-hft.upstox.com/v3";

// =======================
// HELPERS
// =======================
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const upstoxHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
  Accept: "application/json",
  "Content-Type": "application/json",
});

const getProduct = (p) => {
  switch ((p || "").toUpperCase()) {
    case "INTRADAY":return "I";
    case "DELIVERY":return "D";
    case "I": return "I";
    case "D": return "D";
    default: return "D";
  }
};

// =======================
// POLL ORDER DETAILS
// =======================
async function pollUpstoxDetails(token, orderId) {
  for (let i = 0; i < 6; i++) {
    try {
      const r = await axios.get(
        `${UPSTOX_BASE}/order/details`,
        { headers: upstoxHeaders(token), params: { order_id: orderId } }
      );

      const st = r?.data?.data?.status;
      if (["complete", "rejected", "cancelled"].includes(st)) {
        return r.data.data;
      }
      await sleep(400 + i * 200);
    } catch (e) {
      await sleep(500);
    }
  }
  return null;
}

// =======================
// FETCH TRADES
// =======================
async function fetchUpstoxTrades(token, orderId) {
  const r = await axios.get(
    `${UPSTOX_BASE}/order/trades`,
    { headers: upstoxHeaders(token), params: { order_id: orderId } }
  );
  return r?.data?.data || [];
}

// =======================
// MAIN FUNCTION
// =======================
export const placeUpstoxOrder = async (user, reqInput,req) => {
  let tempOrder = null;
  let existingBuy = null;

  try {
    const product = getProduct(reqInput.productType);
    const instrumentToken = `${reqInput.exch_seg}|${reqInput.token}`;

    // ====================================================
    // 1️⃣ READ EXISTING BUY (MERGE CASE)
    // ====================================================
    if (reqInput.transactiontype === "BUY") {
      existingBuy = await Order.findOne({
        where: {
          userId: user.id,
          tradingsymbol: reqInput.symbol,
          ordertype: reqInput.orderType,
          producttype: product,
          transactiontype: "BUY",
          orderstatuslocaldb: "OPEN",
          broker: "upstox",
        },
      });
    }

    // ====================================================
    // 2️⃣ CREATE TEMP ORDER
    // ====================================================
    tempOrder = await Order.create({
      variety: reqInput.variety || "NORMAL",
      tradingsymbol: reqInput.symbol,
      instrumenttype: reqInput.instrumenttype,
      symboltoken: reqInput.token,
      transactiontype: reqInput.transactiontype,
      exchange: reqInput.exch_seg,
      ordertype: reqInput.orderType,
      quantity: String(reqInput.quantity),
      producttype: product,
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
      text: "",
      angelOneSymbol: reqInput.angelOneSymbol || reqInput.symbol,
      angelOneToken: reqInput.angelOneToken || reqInput.token,
    });

    // ====================================================
    // 3️⃣ PLACE UPSTOX ORDER
    // ====================================================
    const placeRes = await axios.post(
      `${UPSTOX_BASE}/order/place`,
      {
        instrument_token: instrumentToken,
        quantity: Number(reqInput.quantity),
        order_type: reqInput.orderType,
        transaction_type: reqInput.transactiontype,
        product,
        price: reqInput.price || 0,
        validity: "DAY",
        slice: false,
      },
      { headers: upstoxHeaders(user.accessToken) }
    );

    const orderId =
      placeRes?.data?.data?.order_ids?.[0] ||
      placeRes?.data?.data?.order_id;

    const orderIds = placeRes?.data?.data?.order_ids||placeRes?.data?.data?.order_id;

    if (!orderId) throw new Error("Upstox order_id missing");

    await tempOrder.update({ orderid: orderId });

    // ====================================================
    // 4️⃣ DETAILS POLLING
    // ====================================================
    const details = await pollUpstoxDetails(user.accessToken, orderId);

    if (!details || ["rejected", "cancelled"].includes(details.status)) {
      await tempOrder.update({
        orderstatuslocaldb: details?.status?.toUpperCase() || "FAILED",
        status: "FAILED",
      });
      return { result: "BROKER_REJECTED" };
    }

    // ====================================================
    // 5️⃣ FETCH TRADES
    // ====================================================
      let trades = [];
      for (const oid of orderIds) {
      const t = await fetchUpstoxTrades(user.accessToken, oid);
      trades.push(...t);
    }


    if (!trades.length) {
      await tempOrder.update({ orderstatuslocaldb: "OPEN" });
      return { result: "PENDING" };
    }

    // ====================================================
    // 6️⃣ AVG PRICE CALCULATION
    // ====================================================
    let totalQty = 0;
    let totalValue = 0;

    trades.forEach(t => {
      totalQty += Number(t.quantity);
      totalValue += Number(t.quantity) * Number(t.average_price);
    });

    const avgPrice = totalValue / totalQty;
    const fill = trades[0];

    // ====================================================
    // 7️⃣ SELL PAIRING
    // ====================================================
    let finalStatus = "OPEN";
    let buyOrder = null;
    let positionStatus = "OPEN"

    if (reqInput.transactiontype === "SELL") {
      buyOrder = await Order.findOne({
        where: { orderid: reqInput.buyOrderId },
      });

      if (buyOrder) {
        await buyOrder.update({ 
           positionStatus: "COMPLETE",
          orderstatuslocaldb: "COMPLETE"
         });
      }
      finalStatus = "COMPLETE";
      positionStatus = "COMPLETE";
    }

    // ====================================================
    // 8️⃣ FINAL UPDATE TEMP ORDER
    // ====================================================
    await tempOrder.update({
      tradedValue: totalValue,
      fillsize: totalQty,
      fillprice: avgPrice,
      price: avgPrice,
      fillid: fill.trade_id,
      filltime: fill.exchange_timestamp,
      pnl:
        reqInput.transactiontype === "SELL"
          ? totalValue - Number(buyOrder?.tradedValue || 0)
          : 0,
      status: "COMPLETE",
      orderstatuslocaldb: finalStatus,
      positionStatus:positionStatus
    });

    // ====================================================
    // 🔥 9️⃣ BUY MERGE (DELETE TEMP)
    // ====================================================
    if (reqInput.transactiontype === "BUY" && existingBuy) {
      const mergedQty = existingBuy.fillsize + totalQty;
      const mergedValue = existingBuy.tradedValue + totalValue;
      const mergedAvg = mergedValue / mergedQty;

      await existingBuy.update({
        fillsize: mergedQty,
        quantity: mergedQty,
        tradedValue: mergedValue,
        price: mergedAvg,
        fillprice: mergedAvg,
      });

      await tempOrder.destroy();

      return {
        result: "SUCCESS",
        broker: "Upstox",
        orderid: existingBuy.id,
      };
    }

    // ====================================================
    // 10️⃣ NORMAL SUCCESS
    // ====================================================
    return {
      result: "SUCCESS",
      broker: "Upstox",
      orderid: tempOrder.id,
    };

  } catch (err) {
    if (tempOrder) {
      await tempOrder.update({
        orderstatuslocaldb: "FAILED",
        status: "FAILED",
        text: err.message,
      });
    }
    return { result: "ERROR", message: err.message };
  }
};
