import User from "../../models/userModel.js";
import Order from "../../models/orderModel.js";
import { placeAngelOrder } from "../../services/placeAngelOrder.js";
import { placeKiteOrder, placeKiteOrderLocalDb } from "../../services/placeKiteOrder.js";
import { placeFyersOrder } from "../../services/placeFyersOrder.js";
import { Op } from "sequelize";
import { emitOrderGet } from "../../services/smartapiFeed.js";

export const getTokenStatusSummary = async (req, res) => {
  try {
    // Fetch both groups
    const generatedUsers = await User.findAll({
      where: { angelLoginUser: true },
      attributes: [["id", "_id"], "firstName","lastName"]
    });

    const notGeneratedUsers = await User.findAll({
      where: { angelLoginUser: false },
      attributes: [["id", "_id"], "firstName","lastName"]
    });

    // Prepare the summary response
    return res.json({
      generatedCount: generatedUsers.length,
      notGeneratedCount: notGeneratedUsers.length,
      generatedUsers,
      notGeneratedUsers
    });

  } catch (error) {
    console.error("Error fetching token summary:", error);
    res.status(500).json({ message: "Server error" });
  }
};



export const adminPlaceMultiBrokerOrder = async (req, res) => {

  try {

    const input = req.body;
    
    const users = await User.findAll({
      where: { strategyName: input.groupName },
      raw: true,
    });

    if (!users.length) {
      return res.json({
        status: false,
        message: "No users found for this group",
      });
    }


    // console.log(users,'users');
    

    
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // -------------------------------
    // ⭐ RUN ALL BROKER ORDERS TOGETHER
    // -------------------------------
    const settled = await Promise.allSettled(
      
      users.map(async (user) => {
        
        if (user.brokerName.toLowerCase() === "angelone") {
          return await placeAngelOrder(user, input, startOfDay, endOfDay);
        }
        if (user.brokerName.toLowerCase() === "kite") {
          return await placeKiteOrder(user, input,startOfDay, endOfDay);
        }
        if (user.brokerName.toLowerCase() === "fyers") {
          return await placeFyersOrder(user, input,startOfDay, endOfDay);
        }

        return {
          userId: user.id,
          broker: user.brokerName,
          result: "UNSUPPORTED",
        };
      })
    );

    // -------------------------------
    // ⭐ FORMAT RESULTS PROPERLY
    // -------------------------------
    const results = settled.map((item, idx) => {
      const user = users[idx];

      if (item.status === "fulfilled") {
        return item.value; // Your service returned an object
      } else {
        return {
          userId: user.id,
          broker: user.brokerName,
          result: "REJECTED",
          message: item.reason?.message || String(item.reason),
        };
      }
    });

    await emitOrderGet()

    return res.json({
      status: true,
      message: "Orders executed for all brokers",
      data: results,
    });
 
  } catch (err) {
    return res.json({
      status: false,
      message: err.message,
    });
  }
};

const safeErr = (e) => e?.message || e?.response?.data || String(e);



export const adminMultipleSquareOff = async (req, res) => {

  try {

    // 1) Time window for today
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // 2) Fetch all OPEN (BUY) orders today
    const openOrders = await Order.findAll({
      where: {
        orderstatuslocaldb: "OPEN",
        transactiontype: "BUY",
        createdAt: { [Op.between]: [startOfDay, endOfDay] },
      },
      raw: true,
    });

    if (!openOrders.length) {
      return res.json({
        status: false,
        message: "No OPEN (BUY) orders found today to square off",
        data: [],
      });
    }

    // 3) Process each order
    const results = await Promise.allSettled(
      openOrders.map(async (o) => {
        try {
          // 3a) Fetch user of the order
          const user = await User.findOne({
            where: { id: o.userId },
            raw: true,
          });

          if (!user) {
            return {
              orderId: o.id,
              result: "NO_USER",
              message: "User not found",
            };
          }

          if (!user.authToken) {
            return {
              orderId: o.id,
              result: "NO_TOKEN",
              message: "User does not have broker authToken",
            };
          }

          if (!user.brokerName) {
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
            angelOneToken:o?.angelOneToken||o.token,
            angelOneSymbol:o?.angelOneSymbol||o?.symbol,
            broker: o?.broker,
            
          };

          //=============== CALL BROKER SPECIFIC SERVICE ===============//

          let brokerRes;

          if (user.brokerName.toLowerCase() === "angelone"&&user.role==='user') {
            brokerRes = await placeAngelOrder(
              user,
              reqInput,
              startOfDay,
              endOfDay
            );
          } else if (user.brokerName.toLowerCase() === "kite"&&user.role==='user') {
            brokerRes = await placeKiteOrderLocalDb(
              user,
              reqInput,
              startOfDay,
              endOfDay
            );
          }else if (user.brokerName.toLowerCase() === "fyers"&&user.role==='user') {
            brokerRes =  await placeFyersOrder(
              user,
              reqInput,
              startOfDay,
               endOfDay
              );
          }else {
            return {
              orderId: o.id,
              result: "INVALID_BROKER",
              message: `Unknown broker: ${user.broker}`,
            };
          }

          return {
            orderId: o.id,
            broker: user.broker,
            ...brokerRes,
          };
        } catch (e) {
          return {
            orderId: o.id,
            result: "FAILED",
            message: safeErr(e),
          };
        }
      })
    );

    // 4) Normalize Promise results
    const finalOutput = results.map((r, i) => {
      if (r.status === "fulfilled") return r.value;
      return { orderId: openOrders[i].id, result: "PROMISE_REJECTED" };
    });

    return res.json({
      status: true,
      message: "Bulk square-off complete",
      data: finalOutput,
    });
  } catch (error) {
    return res.json({
      status: false,
      message: "Something went wrong",
      error: safeErr(error),
    });
  }

};


export const adminSingleSquareOff = async (req, res) => {
  try {
    const { orderId } = req.body; // 👈 ya req.params.orderId agar URL se bhejna ho

    if (!orderId) {
      return res.json({
        status: false,
        message: "orderId is required",
      });
    }

    // 1) Optional: Time window for today (agar tum services me chahiye)
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

   

    // 2) Fetch that specific OPEN BUY order
    const o = await Order.findOne({
      where: {
         orderid: String(orderId),   // 👈 CORRECT FIELD
        orderstatuslocaldb: "OPEN",   // sirf open
        transactiontype: "BUY",       // aur sirf BUY
        // 👇 agar sirf aaj ka allow karna ho to uncomment:
        // createdAt: { [Op.between]: [startOfDay, endOfDay] },
      },
      raw: true,
    });

       

    if (!o) {
      return res.json({
        status: false,
        message: "No OPEN BUY order found with this id",
      });
    }

    // 3) Fetch user
    const user = await User.findOne({
      where: { id: o.userId },
      raw: true,
    });

    if (!user) {
      return res.json({
        status: false,
        message: "User not found for this order",
      });
    }

    if (!user.authToken) {
      return res.json({
        status: false,
        message: "User does not have broker authToken",
      });
    }

    if (!user.brokerName) {
      return res.json({
        status: false,
        message: "User broker not selected",
      });
    }

    const transactiontype = "SELL"; // square off leg

    // 4) Common reqInput format
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
    };

    console.log(reqInput,'reqInput');
    
    // 5) Call broker specific service
    let brokerRes;

    if (user.brokerName.toLowerCase() === "angelone" && user.role === "user") {
      brokerRes = await placeAngelOrder(user, reqInput, startOfDay, endOfDay);
    } else if (user.brokerName.toLowerCase() === "kite" && user.role === "user") {
      brokerRes = await placeKiteOrderLocalDb(user, reqInput, startOfDay, endOfDay);
    } else if (user.brokerName.toLowerCase() === "fyers" && user.role === "user") {
      brokerRes = await placeFyersOrder(user, reqInput, startOfDay, endOfDay);
    } else {
      return res.json({
        status: false,
        message: `Unknown or invalid broker: ${user.broker}`,
      });
    }

    // 6) Response
    return res.json({
      status: true,
      message: "Single order square-off complete",
      data: {
        orderId: o.id,
        broker: user.broker,
        ...brokerRes,
      },
    });
  } catch (error) {

    console.log(error,'error');
    
    return res.json({
      status: false,
      message: "Something went wrong",
      error: safeErr(error),
    });
  }
};
