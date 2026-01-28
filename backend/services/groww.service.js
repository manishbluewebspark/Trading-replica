import axios from "axios";
import Order from "../models/orderModel.js";
import dayjs from "dayjs";

const GROWW_BASE_URL = "https://api.groww.in/v1";

/* ---------------- HELPERS ---------------- */

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const normalizeStatus = (s = "") =>
  s.toUpperCase().replace(/\s+/g, "_");

const isFinalStatus = (s) =>
  ["COMPLETE", "CANCELLED", "REJECTED"].includes(s);

/* ---------------- ORDER STATUS RETRY ---------------- */

const fetchGrowwOrderStatusWithRetry = async ({
  growwToken,
  growwOrderId,
  segment = "CASH",
  maxRetry = 3
}) => {
  let lastStatus = null;

  for (let i = 1; i <= maxRetry; i++) {
    const res = await axios.get(
      `${GROWW_BASE_URL}/order/status/${growwOrderId}?segment=${segment}`,
      {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${growwToken}`,
          "X-API-VERSION": "1.0",
        },
      }
    );

    lastStatus = res.data;
    const statusNorm = normalizeStatus(res.data?.payload?.status);

    if (isFinalStatus(statusNorm)) {
      return res.data;
    }

    await sleep(1200);
  }

  return lastStatus;
};

/* ---------------- TRADE FETCH ---------------- */

const fetchGrowwTrades = async ({
  growwToken,
  growwOrderId,
  segment = "CASH",
}) => {
  const res = await axios.get(
    `${GROWW_BASE_URL}/order/trades/${growwOrderId}?segment=${segment}&page=0&page_size=50`,
    {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${growwToken}`,
        "X-API-VERSION": "1.0",
      },
    }
  );

  return res.data?.payload || [];
};

/* =====================================================
   PLACE ORDER – GROWW (Finvasia style)
===================================================== */

export const placeGrowwOrder = async (user, reqInput, req) => {
  let newOrder = null;

  const nowISO = new Date().toISOString();

  try {
    const growwToken = user?.authToken;

    if (!growwToken) {
      return { result: "ERROR", message: "Groww token missing" };
    }

    /* -------- 1. CREATE LOCAL PENDING ORDER -------- */

    newOrder = await Order.create({
      userId: user.id,
      broker: "groww",
      tradingsymbol: reqInput.trading_symbol,
      transactiontype: reqInput.transaction_type,
      producttype: reqInput.product,
      exchange: reqInput.exchange,
      quantity: reqInput.quantity,
      price: reqInput.price,
      ordertype: reqInput.order_type,
      orderstatuslocaldb: "PENDING",
      status: "PENDING",
    });

    /* -------- 2. PLACE ORDER ON GROWW -------- */

    const placeRes = await axios.post(
      `${GROWW_BASE_URL}/order/create`,
      {
        trading_symbol: reqInput.trading_symbol,
        quantity: reqInput.quantity,
        price: reqInput.price,
        trigger_price: reqInput.trigger_price || 0,
        validity: reqInput.validity || "DAY",
        exchange: reqInput.exchange || "NSE",
        segment: reqInput.segment || "CASH",
        product: reqInput.product || "CNC",
        order_type: reqInput.order_type,
        transaction_type: reqInput.transaction_type,
        order_reference_id: `softwaresetu`,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${growwToken}`,
          "X-API-VERSION": "1.0",
        },
      }
    );

    if (placeRes.data.status !== "SUCCESS") {
      await newOrder.update({
        status: "FAILED",
        orderstatuslocaldb: "FAILED",
        text: placeRes.data.message || "Order rejected",
      });
      return { result: "BROKER_REJECTED" };
    }

    const growwOrderId = placeRes.data.payload.groww_order_id;
    await newOrder.update({ orderid: growwOrderId });

    /* -------- 3. FETCH FINAL ORDER STATUS -------- */

    const statusRes = await fetchGrowwOrderStatusWithRetry({
      growwToken,
      growwOrderId,
    });

    const orderStatus = normalizeStatus(
      statusRes?.payload?.status
    );

    if (orderStatus === "REJECTED") {
      await newOrder.update({
        status: "REJECTED",
        orderstatuslocaldb: "REJECTED",
        text: statusRes.payload?.reason,
      });
      return { result: "REJECTED" };
    }

    if (orderStatus === "CANCELLED") {
      await newOrder.update({
        status: "CANCELLED",
        orderstatuslocaldb: "CANCELLED",
      });
      return { result: "CANCELLED" };
    }

    /* -------- 4. FETCH TRADES -------- */

    const trades = await fetchGrowwTrades({
      growwToken,
      growwOrderId,
    });

    let totalQty = 0;
    let totalValue = 0;

    trades.forEach(t => {
      totalQty += Number(t.quantity || 0);
      totalValue += Number(t.quantity || 0) * Number(t.price || 0);
    });

    const avgPrice = totalQty ? totalValue / totalQty : 0;

    /* -------- 5. FINAL DB UPDATE -------- */

    await newOrder.update({
      status: "COMPLETE",
      orderstatuslocaldb: "COMPLETE",
      fillsize: totalQty,
      fillprice: avgPrice,
      tradedValue: totalValue,
      filltime: dayjs().toISOString(),
    });

    return {
      result: "SUCCESS",
      broker: "Groww",
      orderid: growwOrderId,
    };

  } catch (err) {
    console.error("Groww order error:", err?.response?.data || err.message);

    if (newOrder) {
      await newOrder.update({
        status: "FAILED",
        orderstatuslocaldb: "FAILED",
        text: err.message,
      });
    }

    return { result: "BROKER_ERROR", message: err.message };
  }
};
