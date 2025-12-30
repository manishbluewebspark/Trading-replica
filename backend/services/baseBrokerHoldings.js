
import { Op } from "sequelize";
import User from "../models/userModel.js";
import Order from "../models/orderModel.js";
import { logSuccess, logError } from "../utils/loggerr.js";

// broker functions (you will implement)
import {
  angeloneHoldingFun,
  kiteHoldingFun,
  fyersHoldingFun,
  finavasiaHoldingFun,
  upstoxHoldingFun,
} from "../services/holdingServices.js";

const safeErr = (e) => ({
  message: e?.message,
  status: e?.response?.status,
  data: e?.response?.data,
});

export const syncHoldingsAllBrokers = async (req, res, next) => {
  try {
    logSuccess(req, {
      msg: "Holding sync started (USER WISE)",
      path: req?.originalUrl,
      method: req?.method,
    });

    // 🔥 STEP 1: fetch eligible BUY orders
    logSuccess(req, { msg: "Fetching eligible OPEN BUY orders", where: { orderstatuslocaldb: "OPEN", transactiontype: "BUY" } });

    const orders = await Order.findAll({
      where: {
        orderstatuslocaldb: "OPEN",
        transactiontype: "BUY",
      },
      raw: true,
    });

    logSuccess(req, {
      msg: "Eligible BUY orders fetched",
      totalOrders: Array.isArray(orders) ? orders.length : 0,
    });

    if (!orders.length) {
      logSuccess(req, { msg: "No BUY orders found, exiting early" });

      return res.json({
        status: false,
        message: "No BUY orders found",
        data: [],
      });
    }

    // 🔥 STEP 2: unique users only
    logSuccess(req, { msg: "Computing unique userIds from orders" });

    const userIds = [...new Set(orders.map((o) => o.userId))];

    logSuccess(req, {
      msg: "Unique userIds computed",
      usersCount: userIds.length,
      userIds,
    });

    logSuccess(req, { msg: "Starting holdings sync per user (Promise.allSettled)", usersCount: userIds.length });

    const results = await Promise.allSettled(
      userIds.map(async (userId) => {
        logSuccess(req, { msg: "User sync started", userId });

        try {
          logSuccess(req, { msg: "Fetching user row", userId });

          const user = await User.findOne({
            where: { id: userId },
            raw: true,
          });

          logSuccess(req, {
            msg: "User lookup result",
            userId,
            userFound: !!user,
            role: user?.role,
            brokerName: user?.brokerName,
            hasAuthToken: !!user?.authToken,
          });

          if (!user) {
            logSuccess(req, { msg: "User not found, skipping", userId });
            return { userId, result: "NO_USER" };
          }
          if (user.role !== "user") {
            logSuccess(req, { msg: "Non-user role, skipping", userId, role: user.role });
            return { userId, result: "SKIP_NON_USER" };
          }
          if (!user.authToken) {
            logSuccess(req, { msg: "Missing authToken, skipping", userId });
            return { userId, result: "NO_TOKEN" };
          }
          if (!user.brokerName) {
            logSuccess(req, { msg: "Missing brokerName, skipping", userId });
            return { userId, result: "NO_BROKER" };
          }

          const broker = String(user.brokerName || "").toLowerCase();

          logSuccess(req, {
            msg: "Resolved broker for holdings sync",
            userId,
            broker,
          });

          let out;

          if (broker === "angelone") {
            logSuccess(req, { msg: "Calling angeloneHoldingFun", userId, broker });
            out = await angeloneHoldingFun({ user, req });
            logSuccess(req, { msg: "angeloneHoldingFun completed", userId, broker, outSummary: { result: out?.result, count: out?.count, ok: out?.ok } });
          } else if (broker === "kite") {
            logSuccess(req, { msg: "Calling kiteHoldingFun", userId, broker });
            out = await kiteHoldingFun({ user, req });

            console.log('===================out kite ============',out);
            
            logSuccess(req, { msg: "kiteHoldingFun completed", userId, broker, outSummary: { result: out?.result, count: out?.count, ok: out?.ok } });
          } else if (broker === "fyers") {
            logSuccess(req, { msg: "Calling fyersHoldingFun", userId, broker });
            out = await fyersHoldingFun({ user, req });
            logSuccess(req, { msg: "fyersHoldingFun completed", userId, broker, outSummary: { result: out?.result, count: out?.count, ok: out?.ok } });
          } else if (broker === "finvasia") {
            logSuccess(req, { msg: "Calling finavasiaHoldingFun", userId, broker });
            out = await finavasiaHoldingFun({ user, req });
            logSuccess(req, { msg: "finavasiaHoldingFun completed", userId, broker, outSummary: { result: out?.result, count: out?.count, ok: out?.ok } });
          } else if (broker === "upstox") {
            logSuccess(req, { msg: "Calling upstoxHoldingFun", userId, broker });
            out = await upstoxHoldingFun({ user, req });
            logSuccess(req, { msg: "upstoxHoldingFun completed", userId, broker, outSummary: { result: out?.result, count: out?.count, ok: out?.ok } });
          } else {
            logSuccess(req, { msg: "Invalid broker, skipping", userId, broker });
            return { userId, result: "INVALID_BROKER" };
          }

          const finalRow = {
            userId,
            broker,
            result: out?.result || (out?.ok === true ? "OK" : "OK"),
            holdingsCount: out?.count || 0,
          };

          logSuccess(req, {
            msg: "User holdings sync completed",
            userId,
            broker,
            finalRow,
          });

          return finalRow;
        } catch (e) {
          logError(req, e, { msg: "Holding sync failed (user)", userId });
          return { userId, result: "FAILED", error: safeErr(e) };
        }
      })
    );

    logSuccess(req, {
      msg: "All user promises settled (holdings sync)",
      total: results.length,
      fulfilled: results.filter((r) => r.status === "fulfilled").length,
      rejected: results.filter((r) => r.status === "rejected").length,
    });

    const finalOutput = results.map((r, idx) => {
      if (r.status === "fulfilled") {
        logSuccess(req, { msg: "User promise fulfilled", idx, userId: r.value?.userId, result: r.value?.result });
        return r.value;
      }
      logError(req, r.reason, { msg: "User promise rejected", idx });
      return { result: "PROMISE_REJECTED" };
    });

    logSuccess(req, {
      msg: "syncHoldingsAllBrokers finished, calling next()",
      outputCount: finalOutput.length,
    });

    next();

    // return res.json({
    //   status: true,
    //   message: "Holding sync complete (USER WISE)",
    //   data: finalOutput,
    // });
  } catch (error) {
    logError(req, error, { msg: "syncHoldingsAllBrokers failed" });
    return res.json({
      status: false,
      message: "Something went wrong",
      error: safeErr(error),
    });
  }
};

export const syncMyHoldings = async (req, res, next) => {
  try {
    logSuccess(req, {
      msg: "syncMyHoldings started",
      path: req?.originalUrl,
      method: req?.method,
      reqUserId: req?.userId,
    });

    const userId = req.userId; // 👈 authMiddleware se

    logSuccess(req, { msg: "Resolved userId from req", userId });

    if (!userId) {
      logSuccess(req, { msg: "Unauthorized (userId missing) in syncMyHoldings" });

      return res.status(401).json({
        status: false,
        message: "Unauthorized (userId missing)",
      });
    }

    // 🔥 DB se fresh user fetch
    logSuccess(req, { msg: "Fetching user from DB (syncMyHoldings)", userId });

    const user = await User.findOne({
      where: { id: userId },
      raw: true,
    });

    logSuccess(req, {
      msg: "User lookup result (syncMyHoldings)",
      userId,
      userFound: !!user,
      role: user?.role,
      brokerName: user?.brokerName,
      hasAuthToken: !!user?.authToken,
    });

    if (!user) {
      logSuccess(req, { msg: "User not found (syncMyHoldings)", userId });

      return res.status(401).json({
        status: false,
        message: "User not found",
      });
    }

    if (!user.authToken || !user.brokerName) {
      logSuccess(req, {
        msg: "Broker not connected (missing authToken/brokerName)",
        userId,
        hasAuthToken: !!user.authToken,
        hasBrokerName: !!user.brokerName,
      });

      return res.json({
        status: false,
        message: "Broker not connected",
      });
    }

    let out;
    const broker = String(user.brokerName || "").toLowerCase();

    logSuccess(req, { msg: "Resolved broker (syncMyHoldings)", userId, broker });

    if (broker === "angelone") {
      logSuccess(req, { msg: "Calling angeloneHoldingFun (syncMyHoldings)", userId, broker });
      out = await angeloneHoldingFun({ user, req });
      logSuccess(req, { msg: "angeloneHoldingFun completed (syncMyHoldings)", userId, broker, outSummary: { result: out?.result, count: out?.count, ok: out?.ok } });
    } else if (broker === "kite") {
      logSuccess(req, { msg: "Calling kiteHoldingFun (syncMyHoldings)", userId, broker });
      out = await kiteHoldingFun({ user, req });
      logSuccess(req, { msg: "kiteHoldingFun completed (syncMyHoldings)", userId, broker, outSummary: { result: out?.result, count: out?.count, ok: out?.ok } });
    } else if (broker === "fyers") {
      logSuccess(req, { msg: "Calling fyersHoldingFun (syncMyHoldings)", userId, broker });
      out = await fyersHoldingFun({ user, req });
      logSuccess(req, { msg: "fyersHoldingFun completed (syncMyHoldings)", userId, broker, outSummary: { result: out?.result, count: out?.count, ok: out?.ok } });
    } else if (broker === "finvasia") {
      logSuccess(req, { msg: "Calling finavasiaHoldingFun (syncMyHoldings)", userId, broker });
      out = await finavasiaHoldingFun({ user, req });
      logSuccess(req, { msg: "finavasiaHoldingFun completed (syncMyHoldings)", userId, broker, outSummary: { result: out?.result, count: out?.count, ok: out?.ok } });
    } else if (broker === "upstox") {
      logSuccess(req, { msg: "Calling upstoxHoldingFun (syncMyHoldings)", userId, broker });
      out = await upstoxHoldingFun({ user, req });
      logSuccess(req, { msg: "upstoxHoldingFun completed (syncMyHoldings)", userId, broker, outSummary: { result: out?.result, count: out?.count, ok: out?.ok } });
    } else {
      logSuccess(req, { msg: "Invalid broker (syncMyHoldings)", userId, broker });
      return res.json({ status: false, message: "Invalid broker" });
    }

    logSuccess(req, {
      msg: "syncMyHoldings completed, calling next()",
      userId,
      broker,
      outSummary: { result: out?.result, count: out?.count, ok: out?.ok },
    });

    next();
  } catch (err) {
    logError(req, err, { msg: "syncMyHoldings failed unexpectedly", userId: req?.userId });

    return res.status(500).json({
      status: false,
      message: "Holding sync failed",
      error: err.message,
    });
  }
};







// =========================== without logger code ==================================




// import { Op } from "sequelize";
// import User from "../models/userModel.js";
// import Order from "../models/orderModel.js";
// import { logSuccess, logError } from "../utils/loggerr.js";




// // broker functions (you will implement)
// import {
//   angeloneHoldingFun,
//   kiteHoldingFun,
//   fyersHoldingFun,
//   finavasiaHoldingFun,
//   upstoxHoldingFun,
// } from "../services/holdingServices.js";

// const safeErr = (e) => ({
//   message: e?.message,
//   status: e?.response?.status,
//   data: e?.response?.data,
// });


// export const syncHoldingsAllBrokers = async (req, res,next) => {
//   try {

//     logSuccess(req, { msg: "Holding sync started (USER WISE)" });

//     // 🔥 STEP 1: fetch eligible BUY orders
//     const orders = await Order.findAll({
//       where: {
//         orderstatuslocaldb: "OPEN",
//         transactiontype: "BUY",
//       },
//       raw: true,
//     });

//     if (!orders.length) {
//       return res.json({
//         status: false,
//         message: "No BUY orders found",
//         data: [],
//       });
//     }

//     // 🔥 STEP 2: unique users only
//     const userIds = [...new Set(orders.map(o => o.userId))];

//     const results = await Promise.allSettled(
//       userIds.map(async (userId) => {
//         try {
//           const user = await User.findOne({
//             where: { id: userId },
//             raw: true,
//           });

//           if (!user) return { userId, result: "NO_USER" };
//           if (user.role !== "user") return { userId, result: "SKIP_NON_USER" };
//           if (!user.authToken) return { userId, result: "NO_TOKEN" };
//           if (!user.brokerName) return { userId, result: "NO_BROKER" };

//           const broker = user.brokerName.toLowerCase();

//           let out;
//           if (broker === "angelone") {
//             out = await angeloneHoldingFun({ user, req });
//           } else if (broker === "kite") {
//             out = await kiteHoldingFun({ user, req });
//           } else if (broker === "fyers") {
//             out = await fyersHoldingFun({ user, req });
//           } else if (broker === "finvasia") {
//             out = await finavasiaHoldingFun({ user, req });
//           } else if (broker === "upstox") {
//             out = await upstoxHoldingFun({ user, req });
//           } else {
//             return { userId, result: "INVALID_BROKER" };
//           }

//           return {
//             userId,
//             broker,
//             result: out?.result || "OK",
//             holdingsCount: out?.count || 0,
//           };
//         } catch (e) {
//           logError(req, e, { msg: "Holding sync failed", userId });
//           return { userId, result: "FAILED", error: safeErr(e) };
//         }
//       })
//     );

//     const finalOutput = results.map(r =>
//       r.status === "fulfilled" ? r.value : { result: "PROMISE_REJECTED" }
//     );

//     next()
//     // return res.json({
//     //   status: true,
//     //   message: "Holding sync complete (USER WISE)",
//     //   data: finalOutput,
//     // });
//   } catch (error) {
//     logError(req, error, { msg: "syncHoldingsAllBrokers failed" });
//     return res.json({
//       status: false,
//       message: "Something went wrong",
//       error: safeErr(error),
//     });
//   }
// };


// export const syncMyHoldings = async (req, res,next) => {
//   try {

//    const userId = req.userId; // 👈 authMiddleware se

//    if (!userId) {
//       return res.status(401).json({
//         status: false,
//         message: "Unauthorized (userId missing)",
//       });
//     }

//     // 🔥 DB se fresh user fetch
//     const user = await User.findOne({
//       where: { id: userId },
//       raw: true,
//     });

//     if (!user) {
//       return res.status(401).json({
//         status: false,
//         message: "User not found",
//       });
//     }
    

//     if (!user.authToken || !user.brokerName) {
//       return res.json({
//         status: false,
//         message: "Broker not connected",
//       });
//     }

//     let out;
//     const broker = user.brokerName.toLowerCase();

//     if (broker === "angelone") {
//       out = await angeloneHoldingFun({ user, req });
//     } else if (broker === "kite") {
//       out = await kiteHoldingFun({ user, req });
//     } else if (broker === "fyers") {
//       out = await fyersHoldingFun({ user, req });
//     } else if (broker === "finvasia") {
//       out = await finavasiaHoldingFun({ user, req });
//     } else if (broker === "upstox") {
//       out = await upstoxHoldingFun({ user, req });
//     } else {
//       return res.json({ status: false, message: "Invalid broker" });
//     }

//    next()
//   } catch (err) {
//     return res.status(500).json({
//       status: false,
//       message: "Holding sync failed",
//       error: err.message,
//     });
//   }
// };


// export const syncHoldingsAllBrokers1 = async (req, res, next) => {
//   try {

//     logSuccess(req, { msg: "Holding sync started (all brokers)" });

//      const startOfDay = new Date();
//         startOfDay.setHours(0, 0, 0, 0);

//     const endOfDay = new Date();
//         endOfDay.setHours(23, 59, 59, 999);


//     const orders = await Order.findAll({
//       where: {
//         orderstatuslocaldb: "OPEN",
//         transactiontype: "BUY",
//         producttype: { [Op.in]: ["DELIVERY", "CARRYFORWARD","NRML"] },
//          createdAt: {
//                     [Op.between]: [startOfDay, endOfDay],
//                 },
//       },
//       raw: true,
//     });

//     logSuccess(req, {
//       msg: "Eligible OPEN BUY orders fetched for holding sync",
//       count: orders.length,
//     });

//     if (!orders.length) {
//       return res.json({
//         status: false,
//         message: "No eligible OPEN BUY orders for holding sync",
//         data: [],
//       });
//     }

//     const results = await Promise.allSettled(
//       orders.map(async (o, idx) => {
//         try {
//           const user = await User.findOne({
//             where: { id: o.userId },
//             raw: true,
//           });

//           if (!user) return { orderId: o.id, result: "NO_USER" };
//           if (!user.authToken) return { orderId: o.id, result: "NO_TOKEN" };
//           if (!user.brokerName) return { orderId: o.id, result: "NO_BROKER" };

//           const broker = (user.brokerName || "").toLowerCase();

//           let out = null;

//           if (user.role !== "user") {
//             return {
//               orderId: o.id,
//               result: "SKIP_NON_USER",
//               broker,
//               message: `Skip: role=${user.role}`,
//             };
//           }

//           if (broker === "angelone") {
//             out = await angeloneHoldingFun({ user, req, order: o });
//           } else if (broker === "kite") {
//             out = await kiteHoldingFun({ user, req, order: o });
//           } else if (broker === "fyers") {
//             out = await fyersHoldingFun({ user, req, order: o });
//           } else if (broker === "finvasia") {
//             out = await finavasiaHoldingFun({ user, req, order: o });
//           } else if (broker === "upstox") {
//             out = await upstoxHoldingFun({ user, req, order: o });
//           } else {
//             return { orderId: o.id, result: "INVALID_BROKER", broker };
//           }

//           // ✅ return holdings in API response
//           return {
//             orderId: o.id,
//             userId: o.userId,
//             broker,
//             result: out?.result || "OK",
//             holdingsCount: out?.count ?? (Array.isArray(out?.holdings) ? out.holdings.length : 0),
//             holdings: out?.holdings || [],
//             message: out?.message,
//           };
//         } catch (e) {
//           logError(req, e, { msg: "Holding sync failed for order", orderDbId: o.id });
//           return { orderId: o.id, result: "FAILED", message: safeErr(e) };
//         }
//       })
//     );

//     const finalOutput = results.map((r, i) => {
//       if (r.status === "fulfilled") return r.value;
//       return { orderId: orders[i]?.id, result: "PROMISE_REJECTED", message: safeErr(r.reason) };
//     });

//     return res.json({
//       status: true,
//       message: "Holding sync complete",
//       data: finalOutput,
//     });
//   } catch (error) {
//     logError(req, error, { msg: "syncHoldingsAllBrokers failed unexpectedly" });
//     return res.json({
//       status: false,
//       message: "Something went wrong",
//       error: safeErr(error),
//     });
//   }
// };
