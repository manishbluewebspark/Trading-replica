// services/kite/placeKiteOrder.js

import { getKiteClientForUserId } from "../services/userKiteBrokerService.js";
import Order from "../models/orderModel.js";
import { logSuccess, logError } from "../utils/loggerr.js";

// -------------------- MAPPERS --------------------
function getKiteProductCode(type) {
  if (!type) return "";

  switch (type.toUpperCase()) {
    case "DELIVERY":
      return "CNC";
    case "CARRYFORWARD":
      return "NRML";
    case "MARGIN":
      return "MTF";
    case "INTRADAY":
      return "MIS";
    case "BO":
      return "MIS";
    default:
      return type.toUpperCase();
  }
}

function mapVarietyToKite(variety) {
  if (!variety) return "regular";

  switch (variety.toUpperCase()) {
    case "NORMAL":
      return "regular";
    case "STOPLOSS":
      return "co";
    case "ROBO":
      return "iceberg";
    default:
      return "regular";
  }
}

// -------------------- HELPERS --------------------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchTradesWithRetry(kite, orderid, req, retries = 3, delayMs = 1200) {
  for (let i = 1; i <= retries; i++) {
    try {
      const trades = await kite.getOrderTrades(orderid);

      logSuccess(req, {
        msg: "Kite getOrderTrades retry",
        attempt: i,
        orderid,
        tradesCount: Array.isArray(trades) ? trades.length : 0,
      });

      if (Array.isArray(trades) && trades.length > 0) return trades;
    } catch (e) {
      logError(req, e, { msg: "Kite getOrderTrades failed", attempt: i, orderid });
    }

    if (i < retries) await sleep(delayMs);
  }
  return [];
}

async function getKiteOrderSnapshot(kite, orderid, req) {
  try {
    const orders = await kite.getOrders();
    const order = Array.isArray(orders)
      ? orders.find((o) => String(o.order_id) === String(orderid))
      : null;

    logSuccess(req, {
      msg: "Kite getOrders snapshot",
      orderid,
      found: !!order,
      status: order?.status,
      average_price: order?.average_price,
      filled_quantity: order?.filled_quantity,
    });

    return order || null;
  } catch (e) {
    logError(req, e, { msg: "Kite getOrders snapshot failed", orderid });
    return null;
  }
}

async function findBuyOrderForSell({ userId, reqInput, req }) {
  // ✅ 1) best: buyOrderId
  if (reqInput?.buyOrderId) {
    const buyOrder = await Order.findOne({
      where: {
        userId,
        orderid: String(reqInput.buyOrderId),
        transactiontype: "BUY",
        status: "COMPLETE",
      },
      raw: true,
    });

    logSuccess(req, {
      msg: "BUY match by buyOrderId",
      buyOrderId: reqInput.buyOrderId,
      found: !!buyOrder,
    });

    if (buyOrder) return buyOrder;
  }

  // ✅ 2) fallback: symbol + exchange + qty + OPEN
  const buyOrder2 = await Order.findOne({
    where: {
      userId,
      tradingsymbol: reqInput.kiteSymbol || reqInput.symbol,
      exchange: reqInput.exch_seg,
      quantity: String(reqInput.quantity),
      transactiontype: "BUY",
      status: "COMPLETE",
      orderstatuslocaldb: "OPEN",
    },
    order: [["createdAt", "DESC"]],
    raw: true,
  });

  logSuccess(req, {
    msg: "BUY match by fallback symbol/exchange/qty",
    found: !!buyOrder2,
    symbol: reqInput.kiteSymbol || reqInput.symbol,
    exchange: reqInput.exch_seg,
    qty: reqInput.quantity,
  });

  return buyOrder2 || null;
}

// ======================================================================
// ✅ placeKiteOrder (with mappings + retry + snapshot + logs)
// ======================================================================
export const placeKiteOrder = async (user, reqInput, startOfDay, endOfDay, req) => {
  let newOrder = null;

  try {
    logSuccess(req, { msg: "Kite order flow started", userId: user?.id, reqInput });

    // 1) Kite instance
    const kite = await getKiteClientForUserId(user.id);
    logSuccess(req, { msg: "Kite client created", userId: user.id });

    // 2) Mappings
    const kiteProductType = getKiteProductCode(reqInput.productType);
    logSuccess(req, { msg: "Mapped product type", input: reqInput.productType, kiteProductType });

    const kiteVariety = mapVarietyToKite(reqInput.variety);
    logSuccess(req, { msg: "Mapped order variety", input: reqInput.variety, kiteVariety });

    // 3) Local pending order
    const orderData = {
      symboltoken: reqInput.kiteToken || reqInput.token,
      variety: kiteVariety || "regular",
      tradingsymbol: reqInput.kiteSymbol || reqInput.symbol,
      instrumenttype: reqInput.instrumenttype,
      transactiontype: (reqInput.transactiontype || "").toUpperCase(),
      exchange: reqInput.exch_seg,
      ordertype: reqInput.orderType,
      quantity: String(reqInput.quantity),
      producttype: kiteProductType,
      price: Number(reqInput.price || 0),
      orderstatuslocaldb: "PENDING",
      totalPrice: reqInput.totalPrice ?? null,
      actualQuantity: reqInput.actualQuantity ?? null,
      userId: user.id,
      broker: "kite",
      angelOneSymbol: reqInput.angelOneSymbol || reqInput.symbol,
      angelOneToken: reqInput.angelOneToken || reqInput.token,
      userNameId: user.username,
      buyOrderId: reqInput?.buyOrderId || null,
    };

    logSuccess(req, { msg: "Prepared local order object", orderData });

    newOrder = await Order.create(orderData);
    logSuccess(req, { msg: "Local order saved", localRowId: newOrder.id });

    // 4) Kite payload
    const orderParams = {
      exchange: reqInput.exch_seg,
      tradingsymbol: reqInput.kiteSymbol || reqInput.symbol,
      transaction_type: (reqInput.transactiontype || "").toUpperCase(),
      quantity: Number(reqInput.quantity),
      product: kiteProductType,
      order_type: reqInput.orderType,
      price: Number(reqInput.price || 0),
      market_protection: 5,
    };

    logSuccess(req, { msg: "Prepared Kite payload", orderParams });

    // 5) Place order
    let placeRes;
    try {
      placeRes = await kite.placeOrder(orderData.variety, orderParams);
      logSuccess(req, { msg: "Kite order placed", placeRes });
    } catch (err) {
      logError(req, err, { msg: "Kite order placement failed" });

      await newOrder.update({
        orderstatuslocaldb: "FAILED",
        status: "FAILED",
        text: err?.message || "Kite order placement failed",
        buyTime: new Date().toISOString(),
      });

      return { userId: user.id, broker: "Kite", result: "BROKER_REJECTED", message: err?.message };
    }

    const orderid = placeRes?.order_id;
    await newOrder.update({ orderid });
    logSuccess(req, { msg: "Order ID saved locally", orderid });

    // 6) Snapshot + Trades retry
    const snap = await getKiteOrderSnapshot(kite, orderid, req);
    const trades = await fetchTradesWithRetry(kite, orderid, req, 3, 1200);
    const trade = trades.length ? trades[0] : null;

    if (trade) logSuccess(req, { msg: "Using trade[0]", trade });

    // 7) SELL pairing
    let buyOrder = null;
    let finalStatus = "OPEN";
    const txType = (reqInput.transactiontype || "").toUpperCase();

    if (txType === "SELL") {
      buyOrder = await findBuyOrderForSell({ userId: user.id, reqInput, req });

      if (buyOrder) {
        await Order.update(
          { orderstatuslocaldb: "COMPLETE" },
          { where: { id: buyOrder.id } }
        );
        logSuccess(req, { msg: "BUY order marked COMPLETE", buyOrderDbId: buyOrder.id });
      }

      finalStatus = "COMPLETE";
    }

    // 8) Update from snapshot (even if no trades)
    await newOrder.update({
      uniqueorderid: snap?.exchange_order_id || null,
      averageprice: snap?.average_price != null ? Number(snap.average_price) : null,
      lotsize: snap?.filled_quantity != null ? Number(snap.filled_quantity) : null,
      triggerprice: snap?.trigger_price != null ? Number(snap.trigger_price) : null,
      price: snap?.average_price != null ? Number(snap.average_price) : Number(reqInput.price || 0),
      status: snap?.status ? String(snap.status).toUpperCase() : null,
      orderstatuslocaldb: finalStatus,
    });

    logSuccess(req, {
      msg: "Local order updated by snapshot",
      orderid,
      snapStatus: snap?.status,
      finalStatus,
    });

    // 9) Final trade update if trade exists
    if (trade) {
      const tradePrice = Number(trade.average_price || trade.price || 0);
      const tradeQty = Number(trade.quantity || 0);

      const buyPrice = Number(buyOrder?.fillprice || 0);
      const buyQty = Number(buyOrder?.fillsize || 0);
      const buyValue = Number(buyOrder?.tradedValue || 0);
      let buyTime = buyOrder?.filltime || "NA";

      let pnl = tradePrice * tradeQty - buyPrice * buyQty;
      if (String(trade.transaction_type || "").toUpperCase() === "BUY") {
        pnl = 0;
        buyTime = "NA";
      }

      logSuccess(req, { msg: "Calculated PnL", orderid, pnl, tradePrice, tradeQty, buyPrice, buyQty });

      await newOrder.update({
        tradedValue: tradePrice * tradeQty,
        fillprice: tradePrice,
        fillsize: tradeQty,
        fillid: trade.trade_id || null,
        filltime: trade.fill_timestamp ? new Date(trade.fill_timestamp).toISOString() : null,
        status: "COMPLETE",
        pnl,
        buyTime,
        buyprice: buyPrice,
        buysize: buyQty,
        buyvalue: buyValue,
      });

      logSuccess(req, { msg: "Final order updated in DB using trade", orderid });
    } else {
      logSuccess(req, { msg: "No trade found after retries (non-fatal)", orderid });
    }

    logSuccess(req, { msg: "Kite order flow completed", orderid });

    return { userId: user.id, broker: "Kite", result: "SUCCESS", orderid };
  } catch (err) {
    logError(req, err, { msg: "Unexpected Kite order failure" });

    try {
      if (newOrder?.id) {
        await newOrder.update({
          orderstatuslocaldb: "FAILED",
          status: "FAILED",
          text: err?.message || "Unexpected error",
          buyTime: new Date().toISOString(),
        });
      }
    } catch (e2) {
      logError(req, e2, { msg: "Failed to mark local order FAILED in catch" });
    }

    return { userId: user?.id, broker: "Kite", result: "ERROR", message: err?.message };
  }
};

// ======================================================================
// ✅ placeKiteOrderLocalDb (NO mapping; still retry + snapshot + logs)
// ======================================================================
export const placeKiteOrderLocalDb = async (user, reqInput, startOfDay, endOfDay, req) => {
  let newOrder = null;

  try {
    logSuccess(req, { msg: "Kite LocalDB order flow started", userId: user?.id, reqInput });

    // 1) Kite instance
    const kite = await getKiteClientForUserId(user.id);
    logSuccess(req, { msg: "Kite client created", userId: user.id });

    // 2) Local pending order
    const orderData = {
      symboltoken: reqInput.kiteToken || reqInput.token,
      variety: reqInput.variety || "regular",
      tradingsymbol: reqInput.kiteSymbol || reqInput.symbol,
      instrumenttype: reqInput.instrumenttype,
      transactiontype: (reqInput.transactiontype || "").toUpperCase(),
      exchange: reqInput.exch_seg,
      ordertype: reqInput.orderType,
      quantity: String(reqInput.quantity),
      producttype: reqInput.productType, // ✅ direct store (as you want)
      price: Number(reqInput.price || 0),
      orderstatuslocaldb: "PENDING",
      totalPrice: reqInput.totalPrice ?? null,
      actualQuantity: reqInput.actualQuantity ?? null,
      userId: user.id,
      broker: "kite",
      angelOneSymbol: reqInput.angelOneSymbol || reqInput.symbol,
      angelOneToken: reqInput.angelOneToken || reqInput.token,
      userNameId: user.username,
      buyOrderId: reqInput?.buyOrderId || null,
    };

    logSuccess(req, { msg: "Prepared local order object", orderData });

    newOrder = await Order.create(orderData);
    logSuccess(req, { msg: "Local order saved", localRowId: newOrder.id });

    // 3) Kite payload (direct)
    const orderParams = {
      exchange: reqInput.exch_seg,
      tradingsymbol: reqInput.kiteSymbol || reqInput.symbol,
      transaction_type: (reqInput.transactiontype || "").toUpperCase(),
      quantity: Number(reqInput.quantity),
      product: reqInput.productType,
      order_type: reqInput.orderType,
      price: Number(reqInput.price || 0),
      market_protection: 5,
    };

    logSuccess(req, { msg: "Prepared Kite payload", orderParams });

    // 4) Place order
    let placeRes;
    try {
      placeRes = await kite.placeOrder(orderData.variety, orderParams);
      logSuccess(req, { msg: "Kite order placed", placeRes });
    } catch (err) {
      logError(req, err, { msg: "Kite order placement failed" });

      await newOrder.update({
        orderstatuslocaldb: "FAILED",
        status: "FAILED",
        text: err?.message || "Kite order placement failed",
        buyTime: new Date().toISOString(),
      });

      return { userId: user.id, broker: "Kite", result: "BROKER_REJECTED", message: err?.message };
    }

    const orderid = placeRes?.order_id;
    await newOrder.update({ orderid });
    logSuccess(req, { msg: "Order ID saved locally", orderid });

    // 5) Snapshot + Trades retry
    const snap = await getKiteOrderSnapshot(kite, orderid, req);
    const trades = await fetchTradesWithRetry(kite, orderid, req, 3, 1200);
    const trade = trades.length ? trades[0] : null;

    if (trade) logSuccess(req, { msg: "Using trade[0]", trade });

    // 6) SELL pairing
    let buyOrder = null;
    let finalStatus = "OPEN";
    const txType = (reqInput.transactiontype || "").toUpperCase();

    if (txType === "SELL") {
      buyOrder = await findBuyOrderForSell({ userId: user.id, reqInput, req });

      if (buyOrder) {
        await Order.update(
          { orderstatuslocaldb: "COMPLETE" },
          { where: { id: buyOrder.id } }
        );
        logSuccess(req, { msg: "BUY order marked COMPLETE", buyOrderDbId: buyOrder.id });
      }

      finalStatus = "COMPLETE";
    }

    // 7) Update from snapshot (even if no trades)
    await newOrder.update({
      uniqueorderid: snap?.exchange_order_id || null,
      averageprice: snap?.average_price != null ? Number(snap.average_price) : null,
      lotsize: snap?.filled_quantity != null ? Number(snap.filled_quantity) : null,
      triggerprice: snap?.trigger_price != null ? Number(snap.trigger_price) : null,
      price: snap?.average_price != null ? Number(snap.average_price) : Number(reqInput.price || 0),
      status: snap?.status ? String(snap.status).toUpperCase() : null,
      orderstatuslocaldb: finalStatus,
    });

    logSuccess(req, {
      msg: "Local order updated by snapshot",
      orderid,
      snapStatus: snap?.status,
      finalStatus,
    });

    // 8) Final trade update if trade exists
    if (trade) {
      const tradePrice = Number(trade.average_price || trade.price || 0);
      const tradeQty = Number(trade.quantity || 0);

      const buyPrice = Number(buyOrder?.fillprice || 0);
      const buyQty = Number(buyOrder?.fillsize || 0);
      const buyValue = Number(buyOrder?.tradedValue || 0);
      let buyTime = buyOrder?.filltime || "NA";

      let pnl = tradePrice * tradeQty - buyPrice * buyQty;
      if (String(trade.transaction_type || "").toUpperCase() === "BUY") {
        pnl = 0;
        buyTime = "NA";
      }

      logSuccess(req, { msg: "Calculated PnL", orderid, pnl, tradePrice, tradeQty, buyPrice, buyQty });

      await newOrder.update({
        tradedValue: tradePrice * tradeQty,
        fillprice: tradePrice,
        fillsize: tradeQty,
        fillid: trade.trade_id || null,
        filltime: trade.fill_timestamp ? new Date(trade.fill_timestamp).toISOString() : null,
        status: "COMPLETE",
        pnl,
        buyTime,
        buyprice: buyPrice,
        buysize: buyQty,
        buyvalue: buyValue,
      });

      logSuccess(req, { msg: "Final order updated in DB using trade", orderid });
    } else {
      logSuccess(req, { msg: "No trade found after retries (non-fatal)", orderid });
    }

    logSuccess(req, { msg: "Kite LocalDB order flow completed", orderid });

    return { userId: user.id, broker: "Kite", result: "SUCCESS", orderid };
  } catch (err) {
    logError(req, err, { msg: "Unexpected LocalDB Kite order failure" });

    try {
      if (newOrder?.id) {
        await newOrder.update({
          orderstatuslocaldb: "FAILED",
          status: "FAILED",
          text: err?.message || "Unexpected error",
          buyTime: new Date().toISOString(),
        });
      }
    } catch (e2) {
      logError(req, e2, { msg: "Failed to mark local order FAILED in catch" });
    }

    return { userId: user?.id, broker: "Kite", result: "ERROR", message: err?.message };
  }
};
