






import axios from "axios";
import Order from "../models/orderModel.js";
import { logSuccess, logError } from "../utils/loggerr.js";

// ================= angelone holding code ===================

const ANGEL_HOLDING_URL =
  "https://apiconnect.angelone.in/rest/secure/angelbroking/portfolio/v1/getAllHolding";

function buildAngelHeaders({ authToken, req, user }) {
  const localIp =
    user?.clientLocalIp || process.env.CLIENT_LOCAL_IP || req?.ip || "127.0.0.1";
  const publicIp =
    user?.clientPublicIp || process.env.CLIENT_PUBLIC_IP || req?.ip || "127.0.0.1";
  const mac =
    user?.macAddress || process.env.MAC_ADDRESS || "00:00:00:00:00:00";

  return {
    Authorization: `Bearer ${authToken}`,
    "Content-Type": "application/json",
    Accept: "application/json",
    "X-UserType": "USER",
    "X-SourceID": "WEB",
    "X-ClientLocalIP": localIp,
    "X-ClientPublicIP": publicIp,
    "X-MACAddress": mac,
    "X-PrivateKey": process.env.PRIVATE_KEY,
  };
}

// ================= NORMALIZER =================

function normalizeAngelHolding(h) {
  return {
    symboltoken: String(h.symboltoken || "").trim(),
    tradingsymbol: String(h.tradingsymbol || "").toUpperCase().trim(),
    quantity: Number(h.quantity || 0),
    avgPrice: Number(h.averageprice || h.avgprice || 0),
  };
}

async function syncAngelHoldingsWithLocalDB({ user, holdings, req }) {
  try {
    logSuccess(req, {
      msg: "syncAngelHoldingsWithLocalDB started",
      userId: user?.id,
      broker: "angelone",
      holdingsCount: Array.isArray(holdings) ? holdings.length : 0,
    });

    if (!Array.isArray(holdings) || !holdings.length) {
      logSuccess(req, { msg: "No holdings to sync (angelone)", userId: user?.id });
      return;
    }

    const holdingMap = new Map();

    logSuccess(req, { msg: "Normalizing angel holdings", userId: user?.id });

    for (const h of holdings.map(normalizeAngelHolding)) {
      if (h.symboltoken) {
        holdingMap.set(h.symboltoken, h);
      }
    }

    logSuccess(req, {
      msg: "Holding map prepared (angelone)",
      userId: user?.id,
      uniqueTokens: holdingMap.size,
    });

    // 🔥 fetch BUY orders sorted FIFO
    logSuccess(req, { msg: "Fetching OPEN BUY orders FIFO (angelone)", userId: user?.id });

    const orders = await Order.findAll({
      where: {
        userId: user.id,
        broker: "angelone",
        orderstatuslocaldb: "OPEN",
        transactiontype: "BUY",
      },
      order: [["createdAt", "ASC"]],
    });

    logSuccess(req, {
      msg: "OPEN BUY orders fetched (angelone)",
      userId: user?.id,
      openBuyCount: Array.isArray(orders) ? orders.length : 0,
    });

    // 🔥 group orders by symboltoken
    const ordersByToken = {};
    logSuccess(req, { msg: "Grouping orders by symboltoken (angelone)", userId: user?.id });

    for (const o of orders) {
      const token = String(o.symboltoken || "").trim();
      if (!ordersByToken[token]) ordersByToken[token] = [];
      ordersByToken[token].push(o);
    }

    logSuccess(req, {
      msg: "Orders grouped by token (angelone)",
      userId: user?.id,
      tokenGroups: Object.keys(ordersByToken).length,
    });

    // 🔥 allocate holding quantity FIFO
    logSuccess(req, { msg: "Starting FIFO allocation (angelone)", userId: user?.id });

    let updatedCount = 0;
    let skippedNoOrders = 0;

    for (const [token, holding] of holdingMap.entries()) {
      let remainingQty = holding.quantity;

      const tokenOrders = ordersByToken[token] || [];
      if (!tokenOrders.length) {
        skippedNoOrders++;
        logSuccess(req, {
          msg: "No local OPEN BUY orders for holding token (angelone)",
          userId: user?.id,
          token,
          holdingQty: holding.quantity,
        });
        continue;
      }

      logSuccess(req, {
        msg: "Allocating token holdings to FIFO orders (angelone)",
        userId: user?.id,
        token,
        holdingQty: holding.quantity,
        openOrdersForToken: tokenOrders.length,
      });

      for (const order of tokenOrders) {
        if (remainingQty <= 0) break;

        const orderQty = Number(order.quantity || 0);
        const allocatedQty = Math.min(orderQty, remainingQty);

        logSuccess(req, {
          msg: "Updating order positionStatus => HOLDING (angelone)",
          userId: user?.id,
          orderDbId: order.id,
          token,
          orderQty,
          allocatedQty,
          remainingBefore: remainingQty,
        });

        await Order.update(
          {
            positionStatus: "HOLDING",
          },
          { where: { id: order.id } }
        );

        updatedCount++;
        remainingQty -= allocatedQty;

        logSuccess(req, {
          msg: "Order updated to HOLDING (angelone)",
          userId: user?.id,
          orderDbId: order.id,
          token,
          remainingAfter: remainingQty,
        });
      }
    }

    logSuccess(req, {
      msg: "syncAngelHoldingsWithLocalDB completed (angelone)",
      userId: user?.id,
      updatedCount,
      skippedNoOrders,
    });
  } catch (e) {
    logError(req, e, {
      msg: "syncAngelHoldingsWithLocalDB failed (angelone)",
      userId: user?.id,
    });
    throw e;
  }
}

export async function angeloneHoldingFun({ user, req, order }) {
  try {
    logSuccess(req, {
      msg: "angeloneHoldingFun started",
      userId: user?.id,
      broker: "angelone",
      hasOrderParam: !!order,
    });

    const AUTH = user.authToken;

    logSuccess(req, {
      msg: "AngelOne token check",
      userId: user?.id,
      hasAuthToken: !!AUTH,
    });

    if (!AUTH) {
      logSuccess(req, { msg: "No AngelOne authToken, returning NO_TOKEN", userId: user?.id });
      return { result: "NO_TOKEN", broker: "angelone", holdings: [] };
    }

    const headers = buildAngelHeaders({ authToken: AUTH, req, user });

    logSuccess(req, {
      msg: "Calling AngelOne holdings API",
      userId: user?.id,
      url: ANGEL_HOLDING_URL,
    });

    const resp = await axios.get(ANGEL_HOLDING_URL, { headers });

    logSuccess(req, {
      msg: "AngelOne holdings API response received",
      userId: user?.id,
      status: resp?.data?.status,
      message: resp?.data?.message,
      errorcode: resp?.data?.errorcode,
    });

    // ✅ AngelOne response usually: { status, message, errorcode, data: [...] }
    const holdings = resp?.data?.data || resp?.data?.holding || [];

    logSuccess(req, {
      msg: "AngelOne holdings parsed",
      userId: user?.id,
      holdingsCount: Array.isArray(holdings) ? holdings.length : 0,
    });

    // 🔥 ONLY UPDATE HOLDING VALUES
    logSuccess(req, { msg: "Syncing AngelOne holdings to local DB", userId: user?.id });

    await syncAngelHoldingsWithLocalDB({ user, holdings, req });

    logSuccess(req, {
      msg: "angeloneHoldingFun completed",
      userId: user?.id,
      broker: "angelone",
    });

    return {
      result: "OK",
      broker: "angelone",
      holdings, // ✅ raw holdings list
      count: Array.isArray(holdings) ? holdings.length : 0,
      // optional: fullResponse: resp.data
    };
  } catch (err) {
    logError(req, err, {
      msg: "angeloneHoldingFun failed",
      userId: user?.id,
      broker: "angelone",
      errorStatus: err?.response?.status,
    });

    return {
      result: "FAILED",
      broker: "angelone",
      message: err?.response?.data || err?.message || String(err),
      holdings: [],
      count: 0,
    };
  }
}

// ===============angelone holding code  end ===================

// ============== kite code start =========================

const normSym = (s) => String(s || "").toUpperCase().trim();

function normalizeKitePosition(p) {
  return {
    tradingsymbol: normSym(p.tradingsymbol),
    quantity: Number(p.quantity || 0),
    avgPrice: Number(p.average_price || 0),
  };
}

function isAfterMarketCloseIST() {
  const now = new Date();
  const ist = new Date(
    now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
  );

  const h = ist.getHours();
  const m = ist.getMinutes();

  return h > 15 || (h === 15 && m >= 30);
}

async function syncKitePositionsWithLocalDB({ user, positions, req }) {
  try {
    logSuccess(req, {
      msg: "syncKitePositionsWithLocalDB started",
      userId: user?.id,
      broker: "kite",
    });

    if (!positions?.net?.length) return;

    const afterClose = isAfterMarketCloseIST();

    logSuccess(req, {
      msg: "Market time check",
      userId: user?.id,
      afterClose,
    });

    // ✅ FILTER HOLDING POSITIONS CORRECTLY
    const holdingPositions = positions.net
      .map(normalizeKitePosition)
      .filter((p) => {
        if (!p.tradingsymbol || p.quantity <= 0) return false;

        // ⏰ Before 3:30 → only overnight holdings
        if (!afterClose) {
          return p.overnightQty > 0;
        }

        // ⏰ After 3:30 → all open positions
        return true;
      });

    logSuccess(req, {
      msg: "Filtered HOLDING positions",
      userId: user?.id,
      count: holdingPositions.length,
    });

    if (!holdingPositions.length) return;

    // 🔁 Map symbol → position
    const posMap = new Map();
    for (const p of holdingPositions) {
      posMap.set(p.tradingsymbol, p);
    }

    // 🔁 Fetch local OPEN BUY orders
    const orders = await Order.findAll({
      where: {
        userId: user.id,
        broker: "kite",
        transactiontype: "BUY",
        orderstatuslocaldb: "OPEN",
      },
      order: [["createdAt", "ASC"]],
      raw: true,
    });

    if (!orders.length) return;

    // 🔁 Group orders by symbol
    const ordersBySymbol = {};
    for (const o of orders) {
      const sym = normSym(o.tradingsymbol);
      if (!ordersBySymbol[sym]) ordersBySymbol[sym] = [];
      ordersBySymbol[sym].push(o);
    }

    // 🔁 FIFO allocation
    for (const [sym, pos] of posMap.entries()) {
      let remainingQty = pos.quantity;
      const tokenOrders = ordersBySymbol[sym] || [];

      for (const ord of tokenOrders) {
        if (remainingQty <= 0) break;

        const orderQty = Number(ord.quantity || 0);
        if (orderQty <= 0) continue;

        const allocatedQty = Math.min(orderQty, remainingQty);

        await Order.update(
          {
            positionStatus: "HOLDING",
          },
          {
            where: { id: ord.id },
          }
        );

        remainingQty -= allocatedQty;

        logSuccess(req, {
          msg: "Order marked HOLDING",
          userId: user?.id,
          sym,
          orderId: ord.id,
          allocatedQty,
          remainingQty,
        });
      }
    }

    logSuccess(req, {
      msg: "syncKitePositionsWithLocalDB completed",
      userId: user?.id,
    });
  } catch (e) {
    logError(req, e, {
      msg: "syncKitePositionsWithLocalDB failed",
      userId: user?.id,
    });
    throw e;
  }
}

async function syncKitePositionsWithLocalDB121({ user, positions, req }) {
  try {
    logSuccess(req, {
      msg: "syncKitePositionsWithLocalDB started",
      userId: user?.id,
      broker: "kite",
      hasPositions: !!positions,
      netLen: Array.isArray(positions?.net) ? positions.net.length : 0,
    });

    if (!positions || !Array.isArray(positions.net) || positions.net.length === 0) {
      logSuccess(req, { msg: "No Kite positions.net to sync", userId: user?.id });
      return;
    }

    console.log(positions, "positions.net==================");

    // ✅ only open positions (qty > 0)
    logSuccess(req, { msg: "Normalizing & filtering Kite positions (qty>0)", userId: user?.id });

    const dayPositions = positions.net
      .map(normalizeKitePosition)
      .filter((p) => p.tradingsymbol && p.quantity > 0);

    logSuccess(req, {
      msg: "Filtered open Kite positions computed",
      userId: user?.id,
      openPositionsCount: dayPositions.length,
    });

    if (!dayPositions.length) {
      logSuccess(req, { msg: "No open Kite positions after filter", userId: user?.id });
      return;
    }

    // ✅ map: symbol -> qty
    const posMap = new Map();
    for (const p of dayPositions) posMap.set(p.tradingsymbol, p);

    logSuccess(req, {
      msg: "Positions map prepared (kite)",
      userId: user?.id,
      uniqueSymbols: posMap.size,
    });

    // ✅ Fetch OPEN BUY orders FIFO
    logSuccess(req, { msg: "Fetching OPEN BUY orders FIFO (kite)", userId: user?.id });

    const orders = await Order.findAll({
      where: {
        userId: user.id,
        broker: "kite",
        orderstatuslocaldb: "OPEN",
        transactiontype: "BUY",
      },
      order: [["createdAt", "ASC"]],
      raw: true, // easier debug
    });

    logSuccess(req, {
      msg: "OPEN BUY orders fetched (kite)",
      userId: user?.id,
      openBuyCount: Array.isArray(orders) ? orders.length : 0,
    });

    // ✅ Group orders by normalized tradingsymbol
    const ordersBySymbol = {};
    logSuccess(req, { msg: "Grouping Kite orders by tradingsymbol", userId: user?.id });

    for (const o of orders) {
      const sym = normSym(o.tradingsymbol);
      if (!sym) continue;
      if (!ordersBySymbol[sym]) ordersBySymbol[sym] = [];
      ordersBySymbol[sym].push(o);
    }

    logSuccess(req, {
      msg: "Orders grouped by symbol (kite)",
      userId: user?.id,
      symbolGroups: Object.keys(ordersBySymbol).length,
    });

    // ✅ FIFO allocation
    logSuccess(req, { msg: "Starting FIFO allocation for Kite positions", userId: user?.id });

    let updatedCount = 0;
    let skippedNoLocalOrders = 0;

    for (const [sym, pos] of posMap.entries()) {
      let remainingQty = pos.quantity;
      const tokenOrders = ordersBySymbol[sym] || [];

      if (!tokenOrders.length) {
        skippedNoLocalOrders++;
        logSuccess(req, {
          msg: "No local OPEN BUY orders for Kite position symbol",
          userId: user?.id,
          sym,
          positionQty: pos.quantity,
        });
        continue;
      }

      logSuccess(req, {
        msg: "Allocating Kite position to FIFO orders",
        userId: user?.id,
        sym,
        positionQty: pos.quantity,
        openOrdersForSymbol: tokenOrders.length,
      });

      for (const ord of tokenOrders) {
        if (remainingQty <= 0) break;

        const orderQty = Number(ord.quantity || 0);
        if (orderQty <= 0) continue;

        const allocatedQty = Math.min(orderQty, remainingQty);

        logSuccess(req, {
          msg: "Updating Kite order positionStatus => HOLDING",
          userId: user?.id,
          orderDbId: ord.id,
          sym,
          orderQty,
          allocatedQty,
          remainingBefore: remainingQty,
        });

        const [affected, updatedRows] = await Order.update(
          { positionStatus: "HOLDING" },
          {
            where: { id: ord.id },
            returning: true, // 👈 IMPORTANT
          }
        );

        logSuccess(req, {
          msg: "Kite order update result",
          userId: user?.id,
          orderDbId: ord.id,
          sym,
          affected,
        });

        updatedCount++;
        remainingQty -= allocatedQty;

        logSuccess(req, {
          msg: "Kite order marked HOLDING (post allocation)",
          userId: user?.id,
          orderDbId: ord.id,
          sym,
          remainingAfter: remainingQty,
        });
      }
    }

    logSuccess(req, {
      msg: "syncKitePositionsWithLocalDB completed (kite)",
      userId: user?.id,
      updatedCount,
      skippedNoLocalOrders,
    });
  } catch (e) {
    logError(req, e, { msg: "syncKitePositionsWithLocalDB failed (kite)", userId: user?.id });
    throw e;
  }
}

export async function kiteHoldingFun({ user, req }) {
  try {

    if (!user) {
      logSuccess(req, { msg: "kiteHoldingFun user missing", broker: "kite" });
      return { ok: false, statusCode: 400, message: "User missing" };
    }

    const apiKey = user?.kite_key;

    const accessToken = user?.authToken;

    if (!apiKey || !accessToken) {
      return { ok: false, statusCode: 400, message: "Kite apiKey/accessToken missing" };
    }

    const url = "https://api.kite.trade/portfolio/positions";

    const resp = await axios.get(url, {
      timeout: 30000,
      headers: {
        "X-Kite-Version": "3",
        Authorization: `token ${apiKey}:${accessToken}`,
      },
    });

    const positions = resp?.data?.data; // {day:[], net:[]}

    await syncKitePositionsWithLocalDB({ user, positions, req });

    return { ok: true, broker: "kite", message: "positions synced to HOLDING" };
  } catch (err) {
    logError(req, err, {
      msg: "kiteHoldingFun failed",
      userId: user?.id,
      broker: "kite",
      errorStatus: err?.response?.status,
    });

    return {
      ok: false,
      statusCode: err?.response?.status || 500,
      message: err?.response?.data?.message || err?.message || "Kite sync failed",
      raw: err?.response?.data,
    };
  }
}

// ============== kite code end =========================

export async function fyersHoldingFun({ user, req, order }) {
  try {
    logSuccess(req, { msg: "fyersHoldingFun called (not implemented)", userId: user?.id, broker: "fyers" });
    return { ok: false, broker: "fyers", message: "Not implemented" };
  } catch (e) {
    logError(req, e, { msg: "fyersHoldingFun crashed", userId: user?.id, broker: "fyers" });
    return { ok: false, broker: "fyers", message: e?.message || "Not implemented" };
  }
}

// =============== finavasia code start ====================

const normSymFinvasia = (s) => String(s || "").toUpperCase().trim();

function normalizeFinvasiaHolding(h) {
  return {
    tradingsymbol: normSymFinvasia(h.tsym),
    quantity: Number(h.ls || 0), // or use 'holdqty' / 'ls' depending on API
  };
}

async function syncFinvasiaHoldingsWithLocalDB({ user, holdings, req }) {
  try {
    logSuccess(req, {
      msg: "syncFinvasiaHoldingsWithLocalDB started",
      userId: user?.id,
      broker: "finvasia",
      holdingsCount: Array.isArray(holdings) ? holdings.length : 0,
    });

    if (!Array.isArray(holdings) || holdings.length === 0) {
      logSuccess(req, { msg: "No Finvasia holdings to sync", userId: user?.id });
      return;
    }

    const openHoldings = holdings
      .map(normalizeFinvasiaHolding)
      .filter((h) => h.tradingsymbol && h.quantity > 0);

    logSuccess(req, {
      msg: "Finvasia holdings normalized & filtered (qty>0)",
      userId: user?.id,
      openHoldingsCount: openHoldings.length,
    });

    if (!openHoldings.length) {
      logSuccess(req, { msg: "No open holdings after filter (finvasia)", userId: user?.id });
      return;
    }

    // Map tradingsymbol -> holding
    const holdingMap = new Map();
    for (const h of openHoldings) holdingMap.set(h.tradingsymbol, h);

    logSuccess(req, {
      msg: "Holding map prepared (finvasia)",
      userId: user?.id,
      uniqueSymbols: holdingMap.size,
    });

    // Fetch OPEN BUY orders FIFO
    logSuccess(req, { msg: "Fetching OPEN BUY orders FIFO (finvasia)", userId: user?.id });

    const orders = await Order.findAll({
      where: {
        userId: user.id,
        broker: "finvasia",
        orderstatuslocaldb: "OPEN",
        transactiontype: "BUY",
      },
      order: [["createdAt", "ASC"]],
      raw: true,
    });

    logSuccess(req, {
      msg: "OPEN BUY orders fetched (finvasia)",
      userId: user?.id,
      openBuyCount: Array.isArray(orders) ? orders.length : 0,
    });

    // Group orders by symbol
    const ordersBySymbol = {};
    logSuccess(req, { msg: "Grouping Finvasia orders by symbol", userId: user?.id });

    for (const o of orders) {
      const sym = normSymFinvasia(o.tradingsymbol);
      if (!ordersBySymbol[sym]) ordersBySymbol[sym] = [];
      ordersBySymbol[sym].push(o);
    }

    logSuccess(req, {
      msg: "Orders grouped (finvasia)",
      userId: user?.id,
      symbolGroups: Object.keys(ordersBySymbol).length,
    });

    // FIFO allocation
    logSuccess(req, { msg: "Starting FIFO allocation (finvasia)", userId: user?.id });

    let updatedCount = 0;
    let skippedNoLocalOrders = 0;

    for (const [sym, holding] of holdingMap.entries()) {
      let remainingQty = holding.quantity;
      const symbolOrders = ordersBySymbol[sym] || [];

      if (!symbolOrders.length) {
        skippedNoLocalOrders++;
        logSuccess(req, {
          msg: "No local OPEN BUY orders for Finvasia holding symbol",
          userId: user?.id,
          sym,
          holdingQty: holding.quantity,
        });
        continue;
      }

      logSuccess(req, {
        msg: "Allocating Finvasia holding to FIFO orders",
        userId: user?.id,
        sym,
        holdingQty: holding.quantity,
        openOrdersForSymbol: symbolOrders.length,
      });

      for (const ord of symbolOrders) {
        if (remainingQty <= 0) break;

        const orderQty = Number(ord.quantity || 0);
        if (orderQty <= 0) continue;

        const allocatedQty = Math.min(orderQty, remainingQty);

        logSuccess(req, {
          msg: "Updating Finvasia order positionStatus => HOLDING",
          userId: user?.id,
          orderDbId: ord.id,
          sym,
          orderQty,
          allocatedQty,
          remainingBefore: remainingQty,
        });

        await Order.update({ positionStatus: "HOLDING" }, { where: { id: ord.id } });

        updatedCount++;
        remainingQty -= allocatedQty;

        logSuccess(req, {
          msg: "Finvasia order marked HOLDING (post allocation)",
          userId: user?.id,
          orderDbId: ord.id,
          sym,
          remainingAfter: remainingQty,
        });
      }
    }

    logSuccess(req, {
      msg: "syncFinvasiaHoldingsWithLocalDB completed",
      userId: user?.id,
      updatedCount,
      skippedNoLocalOrders,
    });
  } catch (e) {
    logError(req, e, { msg: "syncFinvasiaHoldingsWithLocalDB failed", userId: user?.id });
    throw e;
  }
}

export async function finavasiaHoldingFun({ user, req }) {
  try {
    logSuccess(req, { msg: "finavasiaHoldingFun started", userId: user?.id, broker: "finvasia" });

    if (!user) {
      logSuccess(req, { msg: "finavasiaHoldingFun user missing", broker: "finvasia" });
      return { ok: false, message: "User missing" };
    }

    const jKey = user.authToken; // Shoonya session token
    const uid = user.kite_client_id; // Shoonya User ID

    logSuccess(req, {
      msg: "Finvasia credential check",
      userId: user?.id,
      hasJKey: !!jKey,
      hasUid: !!uid,
    });

    if (!jKey || !uid) {
      return { ok: false, message: "Finvasia credentials missing" };
    }

    const url = "https://api.shoonya.com/NorenWClientTP/Holdings";

    logSuccess(req, { msg: "Calling Finvasia Holdings API", userId: user?.id, url });

    // ✅ EXACT jData format
    const jData = JSON.stringify({
      uid: uid,
      actid: uid,
      prd: "C", // REQUIRED
    });

    // ✅ IMPORTANT: Manual form body
    const body = `jData=${jData}&jKey=${jKey}`;

    const resp = await axios.post(url, body, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      timeout: 30000,
    });

    const data = resp?.data?.[0];

    logSuccess(req, {
      msg: "Finvasia Holdings API response received",
      userId: user?.id,
      stat: data?.stat,
      emsg: data?.emsg,
    });

    if (data?.stat !== "Ok") {
      return {
        ok: false,
        message: data?.emsg || "Finvasia holdings fetch failed",
      };
    }

    const holdings = data?.exch_tsym || [];

    logSuccess(req, {
      msg: "Finvasia holdings parsed",
      userId: user?.id,
      holdingsCount: Array.isArray(holdings) ? holdings.length : 0,
    });

    // 🔁 FIFO sync
    logSuccess(req, { msg: "Syncing Finvasia holdings to local DB", userId: user?.id });

    await syncFinvasiaHoldingsWithLocalDB({ user, holdings, req });

    logSuccess(req, {
      msg: "finavasiaHoldingFun completed",
      userId: user?.id,
      broker: "finvasia",
      count: Array.isArray(holdings) ? holdings.length : 0,
    });

    return {
      ok: true,
      broker: "finvasia",
      message: "Finvasia holdings synced successfully",
      count: holdings.length,
    };
  } catch (err) {
    logError(req, err, {
      msg: "finavasiaHoldingFun failed",
      userId: user?.id,
      broker: "finvasia",
      errorStatus: err?.response?.status,
    });

    return {
      ok: false,
      message: err?.response?.data?.emsg || err.message,
      raw: err?.response?.data,
    };
  }
}

// =============== finavasia code end ====================

export async function upstoxHoldingFun({ user, req, order }) {
  try {
    logSuccess(req, { msg: "upstoxHoldingFun called (not implemented)", userId: user?.id, broker: "upstox" });
    return { ok: false, broker: "upstox", message: "Not implemented" };
  } catch (e) {
    logError(req, e, { msg: "upstoxHoldingFun crashed", userId: user?.id, broker: "upstox" });
    return { ok: false, broker: "upstox", message: e?.message || "Not implemented" };
  }
}







// ====================== without logger code =========================


// import axios from "axios";
// import Order from "../models/orderModel.js";
// import { logSuccess, logError } from "../utils/loggerr.js";

// // ================= angelone holding code ===================

// const ANGEL_HOLDING_URL =
//   "https://apiconnect.angelone.in/rest/secure/angelbroking/portfolio/v1/getAllHolding";

// function buildAngelHeaders({ authToken, req, user }) {
//   const localIp =
//     user?.clientLocalIp || process.env.CLIENT_LOCAL_IP || req?.ip || "127.0.0.1";
//   const publicIp =
//     user?.clientPublicIp || process.env.CLIENT_PUBLIC_IP || req?.ip || "127.0.0.1";
//   const mac =
//     user?.macAddress || process.env.MAC_ADDRESS || "00:00:00:00:00:00";

//   return {
//     Authorization: `Bearer ${authToken}`,
//     "Content-Type": "application/json",
//     Accept: "application/json",
//     "X-UserType": "USER",
//     "X-SourceID": "WEB",
//     "X-ClientLocalIP": localIp,
//     "X-ClientPublicIP": publicIp,
//     "X-MACAddress": mac,
//     "X-PrivateKey": process.env.PRIVATE_KEY,
//   };
// }


// // ================= NORMALIZER =================

// function normalizeAngelHolding(h) {
//   return {
//     symboltoken: String(h.symboltoken || "").trim(),
//     tradingsymbol: String(h.tradingsymbol || "").toUpperCase().trim(),
//     quantity: Number(h.quantity || 0),
//     avgPrice: Number(h.averageprice || h.avgprice || 0),
//   };
// }

// async function syncAngelHoldingsWithLocalDB({ user, holdings }) {
//   if (!Array.isArray(holdings) || !holdings.length) return;

//   const holdingMap = new Map();

//   for (const h of holdings.map(normalizeAngelHolding)) {
//     if (h.symboltoken) {
//       holdingMap.set(h.symboltoken, h);
//     }
//   }

//   // 🔥 fetch BUY orders sorted FIFO
//   const orders = await Order.findAll({
//     where: {
//       userId: user.id,
//       broker: "angelone",
//       orderstatuslocaldb: "OPEN",
//       transactiontype: "BUY",
//     },
//     order: [["createdAt", "ASC"]],
//   });

//   // 🔥 group orders by symboltoken
//   const ordersByToken = {};
//   for (const o of orders) {
//     const token = String(o.symboltoken || "").trim();
//     if (!ordersByToken[token]) ordersByToken[token] = [];
//     ordersByToken[token].push(o);
//   }

//   // 🔥 allocate holding quantity FIFO
//   for (const [token, holding] of holdingMap.entries()) {
//     let remainingQty = holding.quantity;

//     const tokenOrders = ordersByToken[token] || [];
//     if (!tokenOrders.length) continue;

//     for (const order of tokenOrders) {
//       if (remainingQty <= 0) break;

//       const orderQty = Number(order.quantity || 0);
//       const allocatedQty = Math.min(orderQty, remainingQty);


//       await Order.update(
//         {   
//           positionStatus: "HOLDING",
//         },
//         { where: { id: order.id } }
//       );

//       remainingQty -= allocatedQty;
//     }
//   }
// }



// export async function angeloneHoldingFun({ user, req, order }) {
//   try {

//    const AUTH =  user.authToken
   
//     if (!AUTH) {
//       return { result: "NO_TOKEN", broker: "angelone", holdings: [] };
//     }

//     const headers = buildAngelHeaders({ authToken: AUTH, req, user });

//     const resp = await axios.get(ANGEL_HOLDING_URL, { headers });

//     // ✅ AngelOne response usually: { status, message, errorcode, data: [...] }
//     const holdings = resp?.data?.data || resp?.data?.holding || [];

//      // 🔥 ONLY UPDATE HOLDING VALUES
//     await syncAngelHoldingsWithLocalDB({ user, holdings });

//     return {
//       result: "OK",
//       broker: "angelone",
//       holdings, // ✅ raw holdings list
//       count: Array.isArray(holdings) ? holdings.length : 0,
//       // optional: fullResponse: resp.data
//     };
//   } catch (err) {
//     return {
//       result: "FAILED",
//       broker: "angelone",
//       message: err?.response?.data || err?.message || String(err),
//       holdings: [],
//       count: 0,
//     };
//   }
// }








// // ===============angelone holding code  end ===================


// // ============== kite code start =========================


// const normSym = (s) => String(s || "").toUpperCase().trim();

// function normalizeKitePosition(p) {
//   return {
//     tradingsymbol: normSym(p.tradingsymbol),
//     quantity: Number(p.quantity || 0),
//     avgPrice: Number(p.average_price || 0),
//   };
// }

// async function syncKitePositionsWithLocalDB({ user, positions }) {
//   if (!positions || !Array.isArray(positions.net) || positions.net.length === 0) return;


//   console.log(positions.net,'positions.net==================');
  

//   // ✅ only open positions (qty > 0)
//   const dayPositions = positions.net
//     .map(normalizeKitePosition)
//     .filter((p) => p.tradingsymbol && p.quantity > 0);

//   if (!dayPositions.length) return;

//   // ✅ map: symbol -> qty
//   const posMap = new Map();
//   for (const p of dayPositions) posMap.set(p.tradingsymbol, p);

//   // ✅ Fetch OPEN BUY orders FIFO
//   const orders = await Order.findAll({
//     where: {
//       userId: user.id,
//       broker: "kite",
//       orderstatuslocaldb: "OPEN",
//       transactiontype: "BUY",
//     },
//     order: [["createdAt", "ASC"]],
//     raw: true, // easier debug
//   });

 

//   // ✅ Group orders by normalized tradingsymbol
//   const ordersBySymbol = {};
//   for (const o of orders) {
//     const sym = normSym(o.tradingsymbol);
//     if (!sym) continue;
//     if (!ordersBySymbol[sym]) ordersBySymbol[sym] = [];
//     ordersBySymbol[sym].push(o);
//   }

//   // ✅ FIFO allocation
//   for (const [sym, pos] of posMap.entries()) {
//     let remainingQty = pos.quantity;
//     const tokenOrders = ordersBySymbol[sym] || [];

   

//     for (const ord of tokenOrders) {
//       if (remainingQty <= 0) break;

//       const orderQty = Number(ord.quantity || 0);
//       if (orderQty <= 0) continue;

//       const allocatedQty = Math.min(orderQty, remainingQty);

//             const [affected, updatedRows] = await Order.update(
//           { positionStatus: "HOLDING" },
//           {
//             where: { id: ord.id },
//             returning: true,   // 👈 IMPORTANT
//           }
//         );

//       remainingQty -= allocatedQty;
//     }
//   }
// }

// export async function kiteHoldingFun({ user }) {
//   try {
//     if (!user) return { ok: false, statusCode: 400, message: "User missing" };

//     const apiKey = user?.kite_key;
//     const accessToken = user?.authToken;

//     if (!apiKey || !accessToken) {
//       return { ok: false, statusCode: 400, message: "Kite apiKey/accessToken missing" };
//     }

//     const url = "https://api.kite.trade/portfolio/positions";

//     const resp = await axios.get(url, {
//       timeout: 30000,
//       headers: {
//         "X-Kite-Version": "3",
//         Authorization: `token ${apiKey}:${accessToken}`,
//       },
//     });

//     const positions = resp?.data?.data; // {day:[], net:[]}
  

//     await syncKitePositionsWithLocalDB({ user, positions });

//     return { ok: true, broker: "kite", message: "positions synced to HOLDING" };
//   } catch (err) {
 
//     return {
//       ok: false,
//       statusCode: err?.response?.status || 500,
//       message: err?.response?.data?.message || err?.message || "Kite sync failed",
//       raw: err?.response?.data,
//     };
//   }
// }


// // ============== kite code end =========================



// export async function fyersHoldingFun({ user, req, order }) {

// }


// // =============== finavasia code start ====================

// const normSymFinvasia = (s) => String(s || "").toUpperCase().trim();

// function normalizeFinvasiaHolding(h) {
//   return {
//     tradingsymbol: normSymFinvasia(h.tsym),
//     quantity: Number(h.ls || 0), // or use 'holdqty' / 'ls' depending on API
//   };
// }

// async function syncFinvasiaHoldingsWithLocalDB({ user, holdings }) {

 
  
//   if (!Array.isArray(holdings) || holdings.length === 0) return;

//   const openHoldings = holdings.map(normalizeFinvasiaHolding).filter(h => h.tradingsymbol && h.quantity > 0);

//   if (!openHoldings.length) return;

 

//   // Map tradingsymbol -> holding
//   const holdingMap = new Map();
//   for (const h of openHoldings) holdingMap.set(h.tradingsymbol, h);


  

//   // Fetch OPEN BUY orders FIFO
//   const orders = await Order.findAll({
//     where: {
//       userId: user.id,
//       broker: "finvasia",
//       orderstatuslocaldb: "OPEN",
//       transactiontype: "BUY",
//     },
//     order: [["createdAt", "ASC"]],
//     raw: true,
//   });


  

//   // Group orders by symbol
//   const ordersBySymbol = {};
//   for (const o of orders) {
//     const sym = normSymFinvasia(o.tradingsymbol);
//     if (!ordersBySymbol[sym]) ordersBySymbol[sym] = [];
//     ordersBySymbol[sym].push(o);
//   }


  

//   // FIFO allocation
//   for (const [sym, holding] of holdingMap.entries()) {
//     let remainingQty = holding.quantity;
//     const symbolOrders = ordersBySymbol[sym] || [];

//     for (const ord of symbolOrders) {
//       if (remainingQty <= 0) break;

//       const orderQty = Number(ord.quantity || 0);
//       if (orderQty <= 0) continue;

//       const allocatedQty = Math.min(orderQty, remainingQty);

//       await Order.update(
//         { positionStatus: "HOLDING" },
//         { where: { id: ord.id } }
//       );

//       remainingQty -= allocatedQty;
//     }
//   }
// }

// export async function finavasiaHoldingFun({ user }) {
//   try {
//     if (!user) {
//       return { ok: false, message: "User missing" };
//     }

//     const jKey = user.authToken;        // Shoonya session token
//     const uid  = user.kite_client_id;     // Shoonya User ID

//     if (!jKey || !uid) {
//       return {
//         ok: false,
//         message: "Finvasia credentials missing",
//       };
//     }

//     const url = "https://api.shoonya.com/NorenWClientTP/Holdings";

//     // ✅ EXACT jData format
//     const jData = JSON.stringify({
//       uid: uid,
//       actid: uid,
//       prd: "C",   // REQUIRED
//     });

//     // ✅ IMPORTANT: Manual form body
//     const body = `jData=${jData}&jKey=${jKey}`;

//     const resp = await axios.post(url, body, {
//       headers: {
//         "Content-Type": "application/x-www-form-urlencoded",
//       },
//       timeout: 30000,
//     });

//     const data = resp?.data[0];

//     // console.log("Finvasia Holdings Response:", data);

//     if (data?.stat !== "Ok") {
//       return {
//         ok: false,
//         message: data?.emsg || "Finvasia holdings fetch failed",
//       };
//     }

//     const holdings = data?.exch_tsym || [];

//     // 🔁 FIFO sync
//     await syncFinvasiaHoldingsWithLocalDB({ user, holdings });

//     return {
//       ok: true,
//       broker: "finvasia",
//       message: "Finvasia holdings synced successfully",
//       count: holdings.length,
//     };
//   } catch (err) {
//     console.error("Finvasia Holdings Error:", err?.response?.data || err.message);

//     return {
//       ok: false,
//       message: err?.response?.data?.emsg || err.message,
//       raw: err?.response?.data,
//     };
//   }
// }


// // =============== finavasia code end ====================



// export async function upstoxHoldingFun({ user, req, order }) {

// }