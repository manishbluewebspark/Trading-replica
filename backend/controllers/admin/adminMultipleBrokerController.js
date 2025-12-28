import User from "../../models/userModel.js";
import Order from "../../models/orderModel.js";
import OcoGroup from "../../models/ocoGroupModel.js";
import { placeAngelOrder } from "../../services/placeAngelOrder.js";
import { placeKiteOrder } from "../../services/placeKiteOrder.js";
import { placeFyersOrder } from "../../services/placeFyersOrder.js";
import { emitOrderGet } from "../../services/smartapiFeed.js";
import { logSuccess, logError } from "../../utils/loggerr.js";
import { placeFinavasiaOrder } from "../../services/placeFinavasiaOrder.js";
import { generateStrategyUniqueId } from "../../utils/randomWords.js";
import { Op } from "sequelize";
import { placeTargetAndStoplossAngelOrder } from "../../services/placeTargetAndStoplossAngel.js";
import { placeTargetAndStoplossKiteOrder } from "../../services/placeTargetAndStoplossKite.js";




export const getTokenStatusSummary = async (req, res) => {
  try {
    const now = new Date();

    // 1️⃣ Entry log
    logSuccess(req, {
      msg: "Token status summary request received",
      now,
    });

    // 2️⃣ Auto-expire users whose Angel login is expired
    logSuccess(req, {
      msg: "Auto-expiring AngelOne login users if expiry passed",
      criteria: {
        angelLoginUser: true,
        role: "user",
        expiryLtNow: now,
      },
    });

    const [expiredCount] = await User.update(
      {
        angelLoginUser: false,
        angelLoginExpiry: null,
      },
      {
        where: {
          angelLoginUser: true,
          role: "user",
          [Op.or]: [
            { angelLoginExpiry: null },
            { angelLoginExpiry: { [Op.lt]: now } },
          ],
        },
      }
    );

    logSuccess(req, {
      msg: "AngelOne login auto-expire update completed",
      expiredCount,
    });

    // 3️⃣ Fetch users with active Angel login
    logSuccess(req, {
      msg: "Fetching users with active AngelOne login",
    });

    const generatedUsers = await User.findAll({
      where: {
        angelLoginUser: true,
        role: "user",
      },
      attributes: [
        ["id", "_id"],
        "firstName",
        "lastName",
        "angelLoginExpiry",
      ],
    });

    logSuccess(req, {
      msg: "Fetched generated users",
      count: generatedUsers.length,
    });

    // 4️⃣ Fetch users without active Angel login
    logSuccess(req, {
      msg: "Fetching users without AngelOne login",
    });

    const notGeneratedUsers = await User.findAll({
      where: {
        role: "user",
        [Op.or]: [
      { angelLoginUser: false },
      { angelLoginUser: null }
    ]
      },
      attributes: [
        ["id", "_id"],
        "firstName",
        "lastName",
      ],
    });

    logSuccess(req, {
      msg: "Fetched non-generated users",
      count: notGeneratedUsers.length,
    });

    // 5️⃣ Final response log
    logSuccess(req, {
      msg: "Token status summary prepared successfully",
      generatedCount: generatedUsers.length,
      notGeneratedCount: notGeneratedUsers.length,
    });

    return res.json({
      status: true,
      generatedCount: generatedUsers.length,
      notGeneratedCount: notGeneratedUsers.length,
      generatedUsers,
      notGeneratedUsers,
    });
  } catch (err) {
    logError(req, err, {
      msg: "getTokenStatusSummary failed",
    });

    return res.status(500).json({
      status: false,
      message: "Server error",
      error: err.message,
      data: null,
    });
  }
};

const safeErr = (e) => e?.message || e?.response?.data || String(e);

// ==============update logger code ==============================
export const adminPlaceMultiBrokerOrder = async (req, res) => {
  try {
    
    const input = req.body;

    // 1️⃣ Frontend request log
    logSuccess(req, {
      msg: "Admin multi-broker order request received",
      frontendReqData: input,
    });


    //  Generate strategyUniqueId
    const strategyUniqueId = await generateStrategyUniqueId(input.groupName);

    // ✅ Strategy log
      logSuccess(req, {
        msg: "Strategy Unique ID generated",
        strategyUniqueId,
      });

    //  Add into input object
    input.strategyUniqueId = strategyUniqueId;

    // 1️⃣ Frontend request log
    logSuccess(req, {
      msg: "Admin multi-broker order request received after add strategyUniqueId",
      frontendReqData: input,
    });


    // 2️⃣ Fetch users by strategy group
    const users = await User.findAll({
      where: { strategyName: input.groupName },
      raw: true,
    });

    logSuccess(req, {
      msg: "Fetched users for strategy group",
      groupName: input.groupName,
      userCount: users.length,
       users: users,
    });

    if (!users.length) {
      logSuccess(req, {
        msg: "No users found for strategy group",
        groupName: input.groupName,
      });

      return res.json({
        status: false,
        message: "No users found for this group",
        error: "No users found for this group",
      });
    }

    // 3️⃣ Day range (kept as-is)
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    logSuccess(req, {
      msg: "Computed start and end of day",
      startOfDay,
      endOfDay,
    });

    // 4️⃣ Execute orders per broker
    const settled = await Promise.allSettled(
      users.map(async (user) => {
        logSuccess(req, {
          msg: "Processing user for broker order",
          userId: user.id,
          brokerName: user.brokerName,
        });

        try {
          if (user.brokerName.toLowerCase() === "angelone") {
            logSuccess(req, {
              msg: "Routing to AngelOne order",
              userId: user.id,
            });

            return await placeAngelOrder(user, input, req);
          }

          if (user.brokerName.toLowerCase() === "kite") {
            logSuccess(req, {
              msg: "Routing to Kite order",
              userId: user.id,
            });
            return await placeKiteOrder(user, input, req, true);
          }

          if (user.brokerName.toLowerCase() === "fyers") {
            logSuccess(req, {
              msg: "Routing to Fyers order",
              userId: user.id,
            });
            return await placeFyersOrder(user, input, req);
          }

          if (user.brokerName.toLowerCase() === "upstox") {
            logSuccess(req, {
              msg: "Upstox broker detected (not implemented)",
              userId: user.id,
            });
          }

          if (user.brokerName.toLowerCase() === "finvasia") {
            logSuccess(req, {
              msg: "Routing to Finvasia order",
              userId: user.id,
            });
            return await placeFinavasiaOrder(user, input, req, true);
          }

          logSuccess(req, {
            msg: "Unsupported broker encountered",
            userId: user.id,
            brokerName: user.brokerName,
          });

          return {
            userId: user.id,
            broker: user.brokerName,
            result: "UNSUPPORTED",
          };
        } catch (err) {
          logError(req, err, {
            msg: "Broker order execution failed inside map",
            userId: user.id,
            brokerName: user.brokerName,
          });
          throw err;
        }
      })
    );

    logSuccess(req, {
      msg: "All broker promises settled",
      total: settled.length,
    });

    // 5️⃣ Normalize results
    const results = settled.map((item, idx) => {
      const user = users[idx];

      if (item.status === "fulfilled") {
        logSuccess(req, {
          msg: "Broker order fulfilled",
          userId: user.id,
          broker: user.brokerName,
          result: item.value?.result,
        });
        return item.value;
      } else {
        logError(req, item.reason, {
          msg: "Broker order rejected",
          userId: user.id,
          broker: user.brokerName,
        });
        return {
          userId: user.id,
          broker: user.brokerName,
          result: "REJECTED",
          message: item.reason?.message || String(item.reason),
        };
      }
    });

    // 6️⃣ Emit socket update
    logSuccess(req, { msg: "Emitting order update event" });
    await emitOrderGet();

    // 7️⃣ Final response
    logSuccess(req, {
      msg: "Admin multi-broker order execution completed",
      resultCount: results.length,
    });

    return res.json({
      status: true,
      message: "Orders executed for all brokers",
      data: results,
    });

  } catch (err) {
    logError(req, err, {
      msg: "Admin multi-broker order execution failed",
    });

    return res.json({
      status: false,
      message: err.message,
    });
  }
};

// ================== update logger code======================
export const adminMultipleSquareOff = async (req, res) => {
  try {

    // ✅ Entry log
    logSuccess(req, { msg: "Admin multiple square-off started" });

          // ✅ Strategy log
      logSuccess(req, {
        msg: "Strategy Unique ID generated",
        strategyUniqueId:"",
      });

    // 1) Time window for today
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    logSuccess(req, {
      msg: "Computed start/end of day for bulk square-off",
      startOfDay,
      endOfDay,
    });

    // 2) Fetch all OPEN (BUY) orders today
    logSuccess(req, { msg: "Fetching OPEN BUY orders for today" });

    const openOrders = await Order.findAll({
      where: {
        orderstatuslocaldb: "OPEN",
        transactiontype: "BUY",
        createdAt: { [Op.between]: [startOfDay, endOfDay] },
      },
      raw: true,
    });

    logSuccess(req, {
      msg: "OPEN BUY orders fetched",
      openOrdersCount: openOrders.length,
    });

    if (!openOrders.length) {
      logSuccess(req, {
        msg: "No OPEN BUY orders found today to square off",
      });

      return res.json({
        status: false,
        message: "No OPEN (BUY) orders found today to square off",
        data: [],
      });
    }

    // 3) Process each order
    logSuccess(req, {
      msg: "Starting bulk square-off processing for orders",
      count: openOrders.length,
    });

    const results = await Promise.allSettled(
      openOrders.map(async (o, idx) => {
        logSuccess(req, {
          msg: "Processing square-off for order",
          index: idx,
          orderDbId: o.id,
          orderid: o.orderid,
          userId: o.userId,
          symbol: o.tradingsymbol,
          exchange: o.exchange,
        });

        try {
          // 3a) Fetch user of the order
          logSuccess(req, {
            msg: "Fetching user for square-off order",
            orderDbId: o.id,
            userId: o.userId,
          });

          const user = await User.findOne({
            where: { id: o.userId },
            raw: true,
          });

          logSuccess(req, {
            msg: "User lookup result for square-off order",
            orderDbId: o.id,
            userFound: !!user,
            userId: user?.id,
            brokerName: user?.brokerName,
            role: user?.role,
            hasAuthToken: !!user?.authToken,
          });

          if (!user) {
            logSuccess(req, {
              msg: "Square-off skipped: user not found",
              orderDbId: o.id,
              userId: o.userId,
            });

            return {
              orderId: o.id,
              result: "NO_USER",
              message: "User not found",
            };
          }

          if (!user.authToken) {
            logSuccess(req, {
              msg: "Square-off skipped: user missing authToken",
              orderDbId: o.id,
              userId: user.id,
            });

            return {
              orderId: o.id,
              result: "NO_TOKEN",
              message: "User does not have broker authToken",
            };
          }

          if (!user.brokerName) {
            logSuccess(req, {
              msg: "Square-off skipped: user broker not selected",
              orderDbId: o.id,
              userId: user.id,
            });

            return {
              orderId: o.id,
              result: "NO_BROKER",
              message: "User broker not selected",
            };
          }

         const strategyUniqueId = o.strategyUniqueId || "";

          const transactiontype = "SELL"; // square off leg

          // Common reqInput format for both services
          const reqInput = {
            variety: o.variety,
            symbol: o.tradingsymbol,
            instrumenttype: o.instrumenttype,
            token: o.symboltoken,
            exch_seg: o.exchange,
            orderType: o.ordertype,
            quantity: o.quantity,
            productType: o.producttype,
            duration: o.duration,
            price: o.price,
            transactiontype,
            totalPrice: o.totalPrice,
            actualQuantity: o.actualQuantity,
            userId: user.id,
            ordertag:"softwaresetu",
            userNameId: user.username,
            angelOneToken: o?.angelOneToken || o.token,
            angelOneSymbol: o?.angelOneSymbol || o?.symbol,
            broker: o?.broker,
            buyOrderId: String(o.orderid),
            groupName:o?.strategyName||"",
            strategyUniqueId:strategyUniqueId,
            kiteSymbol: o.tradingsymbol || o.angelOneSymbol,
            kiteToken: o.symboltoken || o.angelOneToken,
            finavasiaSymbol : o.tradingsymbol || o.angelOneSymbol ,
            finavasiaToken : o?.symboltoken||o?.angelOneToken,
            FyersSymbol: o.tradingsymbol || o.angelOneSymbol,
            fyersToken: o.symboltoken || o.angelOneToken,

          };

          logSuccess(req, {
            msg: "Prepared reqInput for square-off (SELL leg)",
            orderDbId: o.id,
            brokerName: user.brokerName,
            reqInput,
          });

          //=============== CALL BROKER SPECIFIC SERVICE ===============//
          const broker = (user.brokerName || "").toLowerCase();

          logSuccess(req, {
            msg: "Routing square-off to broker service",
            orderDbId: o.id,
            broker,
            userId: user.id,
            role: user.role,
          });

          if (broker === "angelone" && user.role === "user") {
            logSuccess(req, {
              msg: "Calling placeAngelOrder for bulk square-off",
              orderDbId: o.id,
              userId: user.id,
            });

            await placeAngelOrder(user, reqInput, req);

            logSuccess(req, {
              msg: "AngelOne square-off completed",
              orderDbId: o.id,
              userId: user.id,
            });
          } else if (broker === "kite" && user.role === "user") {
            logSuccess(req, {
              msg: "Calling placeKiteOrder for bulk square-off",
              orderDbId: o.id,
              userId: user.id,
            });

            await placeKiteOrder(user, reqInput, req, false);

            logSuccess(req, {
              msg: "Kite square-off completed",
              orderDbId: o.id,
              userId: user.id,
            });
          } else if (broker === "fyers" && user.role === "user") {
            logSuccess(req, {
              msg: "Calling placeFyersOrder for bulk square-off",
              orderDbId: o.id,
              userId: user.id,
            });

            await placeFyersOrder(user, reqInput, req);

            logSuccess(req, {
              msg: "Fyers square-off completed",
              orderDbId: o.id,
              userId: user.id,
            });
          } else if (broker === "finvasia" && user.role === "user") {
            logSuccess(req, {
              msg: "Calling placeFinavasiaOrder for bulk square-off",
              orderDbId: o.id,
              userId: user.id,
            });

            await placeFinavasiaOrder(user, reqInput, req, true);

            logSuccess(req, {
              msg: "Finvasia square-off completed",
              orderDbId: o.id,
              userId: user.id,
            });
          } else {
            logSuccess(req, {
              msg: "Square-off skipped: invalid/unknown broker",
              orderDbId: o.id,
              brokerName: user.brokerName,
              brokerValue: user.broker,
              userId: user.id,
            });

            return {
              orderId: o.id,
              result: "INVALID_BROKER",
              message: `Unknown broker: ${user.broker}`,
            };
          }

          logSuccess(req, {
            msg: "Square-off processed successfully for order",
            orderDbId: o.id,
            broker: user.broker,
            brokerName: user.brokerName,
            userId: user.id,
          });

          return {
            orderId: o.id,
            broker: user.broker,
          };
        } catch (e) {
          logError(req, e, {
            msg: "Square-off failed for order",
            orderDbId: o.id,
            userId: o.userId,
          });

          return {
            orderId: o.id,
            result: "FAILED",
            message: safeErr(e),
          };
        }
      })
    );

    logSuccess(req, {
      msg: "All bulk square-off promises settled",
      total: results.length,
    });

    // 4) Normalize Promise results
    const finalOutput = results.map((r, i) => {
      if (r.status === "fulfilled") {
        logSuccess(req, {
          msg: "Square-off promise fulfilled",
          orderDbId: openOrders[i]?.id,
          result: r.value?.result || "OK",
        });
        return r.value;
      }

      logError(req, r.reason, {
        msg: "Square-off promise rejected",
        orderDbId: openOrders[i]?.id,
      });

      return { orderId: openOrders[i].id, result: "PROMISE_REJECTED" };
    });

    logSuccess(req, {
      msg: "Bulk square-off completed",
      outputCount: finalOutput.length,
    });

    return res.json({
      status: true,
      message: "Bulk square-off complete",
      data: finalOutput,
    });
  } catch (error) {

    console.log(error,'========================error');
    
    logError(req, error, { msg: "adminMultipleSquareOff failed unexpectedly" });

    return res.json({
      status: false,
      message: "Something went wrong",
      error: safeErr(error),
    });
  }
};

// ==============update logger code ==============================
export const adminGroupSquareOff = async (req, res) => {
  try {

  
    let reqStrategyUniqueId = req.body.strategyUniqueId

    const afterUnderscore = reqStrategyUniqueId.split("_").pop();

    // ✅ Entry log
    logSuccess(req, { msg: "Admin multiple square-off started" });

    //  Generate strategyUniqueId
    const strategyUniqueId = await generateStrategyUniqueId(afterUnderscore);

          // ✅ Strategy log
      logSuccess(req, {
        msg: "Strategy Unique ID generated",
        strategyUniqueId,
      });

    // 1) Time window for today
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    logSuccess(req, {
      msg: "Computed start/end of day for bulk square-off",
      startOfDay,
      endOfDay,
    });

    // 2) Fetch all OPEN (BUY) orders today
    logSuccess(req, { msg: "Fetching OPEN BUY orders for today" });

    const openOrders = await Order.findAll({
      where: {
        orderstatuslocaldb: "OPEN",
        transactiontype: "BUY",
       strategyUniqueId: reqStrategyUniqueId, // optional: null avoid
      },
      raw: true,
    });


    console.log(openOrders,'openOrders');
    

    logSuccess(req, {
      msg: "OPEN BUY orders fetched",
      openOrdersCount: openOrders.length,
    });

    if (!openOrders.length) {
      logSuccess(req, {
        msg: "No OPEN BUY orders found today to square off",
      });

      return res.json({
        status: false,
        message: "No OPEN (BUY) orders found today to square off",
        data: [],
      });
    }

    // 3) Process each order
    logSuccess(req, {
      msg: "Starting bulk square-off processing for orders",
      count: openOrders.length,
    });

    const results = await Promise.allSettled(
      openOrders.map(async (o, idx) => {
        logSuccess(req, {
          msg: "Processing square-off for order",
          index: idx,
          orderDbId: o.id,
          orderid: o.orderid,
          userId: o.userId,
          symbol: o.tradingsymbol,
          exchange: o.exchange,
        });

        try {
          // 3a) Fetch user of the order
          logSuccess(req, {
            msg: "Fetching user for square-off order",
            orderDbId: o.id,
            userId: o.userId,
          });

          const user = await User.findOne({
            where: { id: o.userId },
            raw: true,
          });

          logSuccess(req, {
            msg: "User lookup result for square-off order",
            orderDbId: o.id,
            userFound: !!user,
            userId: user?.id,
            brokerName: user?.brokerName,
            role: user?.role,
            hasAuthToken: !!user?.authToken,
          });

          if (!user) {
            logSuccess(req, {
              msg: "Square-off skipped: user not found",
              orderDbId: o.id,
              userId: o.userId,
            });

            return {
              orderId: o.id,
              result: "NO_USER",
              message: "User not found",
            };
          }

          if (!user.authToken) {
            logSuccess(req, {
              msg: "Square-off skipped: user missing authToken",
              orderDbId: o.id,
              userId: user.id,
            });

            return {
              orderId: o.id,
              result: "NO_TOKEN",
              message: "User does not have broker authToken",
            };
          }

          if (!user.brokerName) {
            logSuccess(req, {
              msg: "Square-off skipped: user broker not selected",
              orderDbId: o.id,
              userId: user.id,
            });

            return {
              orderId: o.id,
              result: "NO_BROKER",
              message: "User broker not selected",
            };
          }

          const transactiontype = "SELL"; // square off leg

          // Common reqInput format for both services
          const reqInput = {
            variety: o.variety,
            symbol: o.tradingsymbol,
            instrumenttype: o.instrumenttype,
            token: o.symboltoken,
            exch_seg: o.exchange,
            orderType: o.ordertype,
            quantity: o.quantity,
            productType: o.producttype,
            duration: o.duration,
            price: o.price,
            transactiontype,
            totalPrice: o.totalPrice,
            actualQuantity: o.actualQuantity,
            userId: user.id,
            userNameId: user.username,
            angelOneToken: o?.angelOneToken || o.token,
            angelOneSymbol: o?.angelOneSymbol || o?.symbol,
            broker: o?.broker,
            buyOrderId: String(o.orderid),
            groupName:o?.strategyName||"",
            strategyUniqueId:strategyUniqueId,

            kiteSymbol: o.tradingsymbol || o.angelOneSymbol,
            kiteToken: o.symboltoken || o.angelOneToken,
            finavasiaSymbol : o.tradingsymbol || o.angelOneSymbol ,
            finavasiaToken : o?.symboltoken||o?.angelOneToken,
            fyersSymbol: o.tradingsymbol || o.angelOneSymbol,
            fyersToken: o.symboltoken || o.angelOneToken,

          };

          logSuccess(req, {
            msg: "Prepared reqInput for square-off (SELL leg)",
            orderDbId: o.id,
            brokerName: user.brokerName,
            reqInput,
          });

          //=============== CALL BROKER SPECIFIC SERVICE ===============//
          const broker = (user.brokerName || "").toLowerCase();

          logSuccess(req, {
            msg: "Routing square-off to broker service",
            orderDbId: o.id,
            broker,
            userId: user.id,
            role: user.role,
          });

          if (broker === "angelone" && user.role === "user") {
            logSuccess(req, {
              msg: "Calling placeAngelOrder for bulk square-off",
              orderDbId: o.id,
              userId: user.id,
            });

            await placeAngelOrder(user, reqInput, req);

            logSuccess(req, {
              msg: "AngelOne square-off completed",
              orderDbId: o.id,
              userId: user.id,
            });
          } else if (broker === "kite" && user.role === "user") {
            logSuccess(req, {
              msg: "Calling placeKiteOrder for bulk square-off",
              orderDbId: o.id,
              userId: user.id,
            });

            await placeKiteOrder(user, reqInput, req, false);

            logSuccess(req, {
              msg: "Kite square-off completed",
              orderDbId: o.id,
              userId: user.id,
            });
          } else if (broker === "fyers" && user.role === "user") {
            logSuccess(req, {
              msg: "Calling placeFyersOrder for bulk square-off",
              orderDbId: o.id,
              userId: user.id,
            });

            await placeFyersOrder(user, reqInput, req);

            logSuccess(req, {
              msg: "Fyers square-off completed",
              orderDbId: o.id,
              userId: user.id,
            });
          } else if (broker === "finvasia" && user.role === "user") {
            logSuccess(req, {
              msg: "Calling placeFinavasiaOrder for bulk square-off",
              orderDbId: o.id,
              userId: user.id,
            });

            await placeFinavasiaOrder(user, reqInput, req, true);

            logSuccess(req, {
              msg: "Finvasia square-off completed",
              orderDbId: o.id,
              userId: user.id,
            });
          } else {
            logSuccess(req, {
              msg: "Square-off skipped: invalid/unknown broker",
              orderDbId: o.id,
              brokerName: user.brokerName,
              brokerValue: user.broker,
              userId: user.id,
            });

            return {
              orderId: o.id,
              result: "INVALID_BROKER",
              message: `Unknown broker: ${user.broker}`,
            };
          }

          logSuccess(req, {
            msg: "Square-off processed successfully for order",
            orderDbId: o.id,
            broker: user.broker,
            brokerName: user.brokerName,
            userId: user.id,
          });

          return {
            orderId: o.id,
            broker: user.broker,
          };
        } catch (e) {
          logError(req, e, {
            msg: "Square-off failed for order",
            orderDbId: o.id,
            userId: o.userId,
          });

          return {
            orderId: o.id,
            result: "FAILED",
            message: safeErr(e),
          };
        }
      })
    );

    logSuccess(req, {
      msg: "All bulk square-off promises settled",
      total: results.length,
    });

    // 4) Normalize Promise results
    const finalOutput = results.map((r, i) => {
      if (r.status === "fulfilled") {
        logSuccess(req, {
          msg: "Square-off promise fulfilled",
          orderDbId: openOrders[i]?.id,
          result: r.value?.result || "OK",
        });
        return r.value;
      }

      logError(req, r.reason, {
        msg: "Square-off promise rejected",
        orderDbId: openOrders[i]?.id,
      });

      return { orderId: openOrders[i].id, result: "PROMISE_REJECTED" };
    });

    logSuccess(req, {
      msg: "Bulk square-off completed",
      outputCount: finalOutput.length,
    });

     console.log("===================group req end=====================");

    return res.json({
      status: true,
      message: "Bulk square-off complete",
      data: finalOutput,
    });
  } catch (error) {
    logError(req, error, { msg: "adminMultipleSquareOff failed unexpectedly" });

    return res.json({
      status: false,
      message: "Something went wrong",
      error: safeErr(error),
    });
  }
};

// ==============update logger code ==============================
export const adminSingleSquareOff = async (req, res) => {
  try {

    let orderId = req.body.orderId
    let reqStrategyUniqueId = req.body.strategyUniqueId

    console.log(req.body,'=========== Single Req coming=================');
    

    // 1️⃣ Request received
    logSuccess(req, {
      msg: "Admin single square-off request received",
      orderId,
      body: req.body,
    });

     //  Generate strategyUniqueId
    const strategyUniqueId = await generateStrategyUniqueId(reqStrategyUniqueId);

    // ✅ Strategy log
logSuccess(req, {
  msg: "Strategy Unique ID generated",
  strategyUniqueId,
});

    if (!orderId) {
      logSuccess(req, { msg: "Square-off validation failed: orderId missing" });
      return res.json({
        status: false,
        message: "orderId is required",
      });
    }

    // 2️⃣ Today window (kept as-is)
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    logSuccess(req, {
      msg: "Computed start/end of day for square-off",
      startOfDay,
      endOfDay,
    });

    // 3️⃣ Fetch OPEN BUY order
    logSuccess(req, {
      msg: "Fetching OPEN BUY order for square-off",
      lookup: {
        orderid: String(orderId),
        orderstatuslocaldb: "OPEN",
        transactiontype: "BUY",
        strategyUniqueId:strategyUniqueId
      },
    });

    const o = await Order.findOne({
      where: {
        orderid: String(orderId),
        orderstatuslocaldb: "OPEN",
        transactiontype: "BUY",

      },
      raw: true,
    });

    logSuccess(req, {
      msg: "Order lookup result",
      orderFound: !!o,
      userId: o?.userId,
      broker: o?.broker,
      tradingsymbol: o?.tradingsymbol,
      exchange: o?.exchange,
    });

    if (!o) {
      logSuccess(req, {
        msg: "No OPEN BUY order found for square-off",
        orderId: String(orderId),
      });

      return res.json({
        status: false,
        message: "No OPEN BUY order found with this id",
      });
    }

    // 4️⃣ Fetch user
    logSuccess(req, {
      msg: "Fetching user for this order",
      userId: o.userId,
    });

    const user = await User.findOne({
      where: { id: o.userId },
      raw: true,
    });

    logSuccess(req, {
      msg: "User lookup result",
      userFound: !!user,
      userId: user?.id,
      brokerName: user?.brokerName,
      role: user?.role,
      hasAuthToken: !!user?.authToken,
    });

    if (!user) {
      logSuccess(req, { msg: "Square-off failed: user not found", userId: o.userId });
      return res.json({
        status: false,
        message: "User not found for this order",
      });
    }

    if (!user.authToken) {
      logSuccess(req, { msg: "Square-off failed: user missing authToken", userId: user.id });
      return res.json({
        status: false,
        message: "User does not have broker authToken",
      });
    }

    if (!user.brokerName) {
      logSuccess(req, { msg: "Square-off failed: user broker not selected", userId: user.id });
      return res.json({
        status: false,
        message: "User broker not selected",
      });
    }

    // 5️⃣ Build reqInput for SELL leg
    const transactiontype = "SELL";

    console.log(o,'==============0=============');
    

    const reqInput = {
      variety: o.variety,
      symbol: o.tradingsymbol,
      instrumenttype: o.instrumenttype,
      token: o.symboltoken||o.angelOneToken,
      exch_seg: o.exchange,
      orderType: o.ordertype,
      quantity: o.quantity,
      productType: o.producttype,
      duration: o.duration,
      price: o.price,
      transactiontype,
      totalPrice: o.totalPrice,
      actualQuantity: o.actualQuantity,
      userId: user.id,
      userNameId: user.username,
      angelOneToken: o?.angelOneToken || o.token,
      angelOneSymbol: o?.angelOneSymbol || o?.symbol,
      broker: o?.broker,
      buyOrderId: String(orderId),
       groupName:o?.strategyName||"",
       strategyUniqueId:strategyUniqueId,
       kiteSymbol: o.tradingsymbol || o.angelOneSymbol,
       kiteToken: o.symboltoken || o.angelOneToken,
       finavasiaSymbol : o.tradingsymbol || o.angelOneSymbol ,
       finavasiaToken : o?.symboltoken||o?.angelOneToken,
       fyersSymbol: o.tradingsymbol || o.angelOneSymbol,
       fyersToken: o.symboltoken || o.angelOneToken,

    };

    logSuccess(req, {
      msg: "Prepared square-off reqInput (SELL leg)",
      orderId: String(orderId),
      reqInput,
    });

    // 6️⃣ Route to broker service
    const broker = (user.brokerName || "").toLowerCase();

    logSuccess(req, {
      msg: "Routing square-off to broker",
      broker,
      userId: user.id,
      role: user.role,
    });

    if (broker === "angelone" && user.role === "user") {
      logSuccess(req, { msg: "Calling placeAngelOrder for square-off", userId: user.id, orderId: String(orderId) });

      // ✅ keeping your existing call exactly (even if args look odd)
      await placeAngelOrder(user, reqInput, req);

      logSuccess(req, { msg: "AngelOne square-off call completed", userId: user.id, orderId: String(orderId) });
    } else if (broker === "kite" && user.role === "user") {
      logSuccess(req, { msg: "Calling placeKiteOrder for square-off", userId: user.id, orderId: String(orderId) });

      await placeKiteOrder(user, reqInput, req, false);

      logSuccess(req, { msg: "Kite square-off call completed", userId: user.id, orderId: String(orderId) });
    } else if (broker === "fyers" && user.role === "user") {
      logSuccess(req, { msg: "Calling placeFyersOrder for square-off", userId: user.id, orderId: String(orderId) });

      await placeFyersOrder(user, reqInput, req);

      logSuccess(req, { msg: "Fyers square-off call completed", userId: user.id, orderId: String(orderId) });
    } else if (broker === "finvasia" && user.role === "user") {
      logSuccess(req, { msg: "Calling placeFinavasiaOrder for square-off", userId: user.id, orderId: String(orderId) });

      await placeFinavasiaOrder(user, reqInput, req, true);

      logSuccess(req, { msg: "Finvasia square-off call completed", userId: user.id, orderId: String(orderId) });
    } else {
      logSuccess(req, {
        msg: "Square-off failed: unknown/invalid broker",
        broker: user.broker,
        brokerName: user.brokerName,
        userId: user.id,
      });

      return res.json({
        status: false,
        message: `Unknown or invalid broker: ${user.broker}`,
      });
    }

    // 7️⃣ Response
    logSuccess(req, {
      msg: "Single order square-off completed successfully",
      orderId: String(orderId),
      userId: user.id,
      brokerName: user.brokerName,
    });

      console.log(req.body,'=========== Single Req end =================');

    return res.json({
      status: true,
      message: "Single order square-off complete",
    });

  } catch (error) {
    logError(req, error, { msg: "adminSingleSquareOff failed unexpectedly" });

    return res.json({
      status: false,
      message: "Something went wrong",
      error: safeErr(error),
    });
  }
};

// ==============update logger code ==============================


// helper: upsert oco group
async function upsertOcoGroupRow({
  userId,
  broker,
  symbol,
  exchange,
  buyOrderId,
  targetOrderId,
  stoplossOrderId,
  quantity,
}) {

  
  // buyOrderId unique rakhna best (you can also add unique index)
  const [row] = await OcoGroup.upsert(
    {
      userId,
      broker,
      symbol,
      exchange,
      buyOrderId: String(buyOrderId),
      targetOrderId: targetOrderId ? String(targetOrderId) : null,
      stoplossOrderId: stoplossOrderId ? String(stoplossOrderId) : null,
      quantity: Number(quantity || 0),
      status: "ACTIVE",
      winner: null,
    },
    { returning: true }
  );

  return row;
}


export const adminPlaceMultiTargetStoplossOrder = async (req, res) => {
  try {
    
    logSuccess(req, {
      msg: "🚀 adminPlaceMultiTargetStoplossOrder called",
      body: req.body,
    });

    const reqStrategyUniqueId = req.body.strategyUniqueId;
    const afterUnderscore = String(reqStrategyUniqueId || "").split("_").pop();

    const targetPrice = Number(req.body.targetPrice);
    const stoplossPrice = Number(req.body.stoplossPrice);

    logSuccess(req, {
      msg: "Parsed input values",
      reqStrategyUniqueId,
      afterUnderscore,
      targetPrice,
      stoplossPrice,
    });

    if (!Number.isFinite(targetPrice) || !Number.isFinite(stoplossPrice)) {
      logError(req, null, {
        msg: "Invalid target/stoploss received",
        targetPrice,
        stoplossPrice,
      });

      return res.json({
        status: false,
        message: "Invalid targetPrice/stoplossPrice",
      });
    }

    // ================= Strategy ID =================
    const strategyUniqueId = await generateStrategyUniqueId(afterUnderscore);

    logSuccess(req, {
      msg: "Generated new strategyUniqueId for OCO",
      strategyUniqueId,
    });

    // ================= Fetch OPEN BUY Orders =================
    logSuccess(req, {
      msg: "Fetching OPEN BUY orders",
      strategyUniqueId: reqStrategyUniqueId,
    });

    const openOrders = await Order.findAll({
      where: {
        orderstatuslocaldb: "OPEN",
        transactiontype: "BUY",
        strategyUniqueId: reqStrategyUniqueId,
      },
      raw: true,
    });

    logSuccess(req, {
      msg: "OPEN BUY orders fetched",
      count: openOrders.length,
      orderIds: openOrders.map((o) => o.orderid),
    });

    if (!openOrders.length) {
      logSuccess(req, {
        msg: "No OPEN BUY orders found, exiting",
      });

      return res.json({
        status: false,
        message: "No OPEN (BUY) orders found",
        data: [],
      });
    }

    // ================= Process Each Order =================
    const results = await Promise.allSettled(
      openOrders.map(async (o, idx) => {
        logSuccess(req, {
          msg: "▶️ Processing order for OCO",
          index: idx,
          orderDbId: o.id,
          buyOrderId: o.orderid,
          userId: o.userId,
          order:o
        });

        try {
          // ---------- Fetch user ----------
          const user = await User.findOne({
            where: { id: o.userId },
            raw: true,
          });

          logSuccess(req, {
            msg: "User lookup completed",
            orderDbId: o.id,
            userFound: !!user,
            brokerName: user?.brokerName,
            role: user?.role,
            user:user
          });

         

          if (!user) {
            logSuccess(req, { msg: "Skipping order: user not found", orderDbId: o.id });
            return { orderId: o.id, result: "NO_USER" };
          }



          if (!user.authToken) {
            logSuccess(req, { msg: "Skipping order: authToken missing", orderDbId: o.id });
            return { orderId: o.id, result: "NO_TOKEN" };
          }

          if (!user.brokerName) {
            logSuccess(req, { msg: "Skipping order: broker not selected", orderDbId: o.id });
            return { orderId: o.id, result: "NO_BROKER" };
          }

          const broker = (user.brokerName || "").toLowerCase();

          logSuccess(req, {
            msg: "Broker resolved",
            broker,
            orderDbId: o.id,
          });

          // ---------- Base reqInput ----------
          const baseReqInput = {
            variety: o.variety,
            symbol: o.tradingsymbol,
            instrumenttype: o.instrumenttype,
            token: o.symboltoken,
            exch_seg: o.exchange,
            orderType: o.ordertype,
            quantity: o.quantity,
            productType: o.producttype,
            duration: o.duration,
            transactiontype: "SELL",
            totalPrice: o.totalPrice,
            actualQuantity: o.actualQuantity,
            userId: user.id,
            userNameId: user.username,
            angelOneToken: o?.angelOneToken || o.token,
            angelOneSymbol: o?.angelOneSymbol || o?.symbol,
            buyOrderId: String(o.orderid),
            groupName: o?.strategyName || "",
            strategyUniqueId,
            kiteSymbol: o.tradingsymbol,
            kiteToken: o.symboltoken,
          };

          logSuccess(req, {
            msg: "Prepared baseReqInput",
            baseReqInput,
          });

          // ---------- Target Leg ----------
          const targetReqInput = {
            ...baseReqInput,
            orderType: "LIMIT",
            price: targetPrice,
            triggerprice: 0,
          };

          logSuccess(req, {
            msg: "Prepared TARGET order input",
            targetReqInput,
          });

          const triggerPrice = stoplossPrice;     // e.g. 120
          const limitPrice = stoplossPrice - 0.5; // 119.5


          // ---------- Stoploss Leg ----------
          const slReqInput = {
            ...baseReqInput,
            orderType: broker === "kite" ? "SL" : "STOPLOSS_LIMIT",
            price: limitPrice,
            triggerprice: triggerPrice,
          };

          logSuccess(req, {
            msg: "Prepared STOPLOSS order input",
            slReqInput,
          });

          let targetRes, slRes;

          // ---------- Place Orders ----------
          if (broker === "angelone") {
            logSuccess(req, { msg: "Placing AngelOne TARGET order", orderDbId: o.id });
            targetRes = await placeTargetAndStoplossAngelOrder(user, targetReqInput, req);

            logSuccess(req, { msg: "AngelOne TARGET response", targetRes });

            if (!targetRes?.status) return { orderId: o.id, result: "TARGET_FAILED" };

            logSuccess(req, { msg: "Placing AngelOne STOPLOSS order", orderDbId: o.id });
            slRes = await placeTargetAndStoplossAngelOrder(user, slReqInput, req);

            logSuccess(req, { msg: "AngelOne STOPLOSS response", slRes });

            if (!slRes?.status) return { orderId: o.id, result: "SL_FAILED" };
          } 
          else if (broker === "kite") {
            logSuccess(req, { msg: "Placing Kite TARGET order", orderDbId: o.id });
            targetRes = await placeTargetAndStoplossKiteOrder(user, targetReqInput, req, false);

            logSuccess(req, { msg: "Kite TARGET response", targetRes });

            if (!targetRes?.status) return { orderId: o.id, result: "TARGET_FAILED" };

            logSuccess(req, { msg: "Placing Kite STOPLOSS order", orderDbId: o.id });
            slRes = await placeTargetAndStoplossKiteOrder(user, slReqInput, req, false);

            logSuccess(req, { msg: "Kite STOPLOSS response", slRes });

            if (!slRes?.status) return { orderId: o.id, result: "SL_FAILED" };
          } 
          else {
            logSuccess(req, { msg: "Unsupported broker", broker });
            return { orderId: o.id, result: "INVALID_BROKER" };
          }

          return {
            orderId: o.id,
            buyOrderId: o.orderid,
            broker,
            targetOrderId: targetRes.orderid,
            stoplossOrderId: slRes.orderid,
            result: "OK",
          };
        } catch (e) {
          logError(req, e, {
            msg: "❌ Exception while processing OCO order",
          });

          return { orderId: o.id, result: "FAILED", message: safeErr(e) };
        }
      })
    );

    const finalOutput = results.map((r, i) =>
      r.status === "fulfilled"
        ? r.value
        : { orderId: openOrders[i]?.id, result: "PROMISE_REJECTED" }
    );

    logSuccess(req, {
      msg: "🎯 adminPlaceMultiTargetStoplossOrder completed",
      total: finalOutput.length,
      finalOutput,
    });

    return res.json({
      status: true,
      message: "Bulk Target+Stoploss placed",
      data: finalOutput,
      meta: {
        count: finalOutput.length,
        strategyUniqueId,
      },
    });
  } catch (error) {
    logError(req, error, {
      msg: "🔥 adminPlaceMultiTargetStoplossOrder crashed",
    });

    return res.json({
      status: false,
      message: "Something went wrong",
      error: safeErr(error),
    });
  }
};













