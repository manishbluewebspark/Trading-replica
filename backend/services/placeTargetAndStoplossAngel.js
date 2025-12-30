
import Order from "../models/orderModel.js";
import {  logError } from "../utils/loggerr.js";



export const updateTargetAndStoploss = async (user,buyOrderReq, targetPrice,stoplossPrice, req) => {

  try {

     await Order.update(
            {
              squareoff: targetPrice,
              stoploss: stoplossPrice,

            },
            {
              where: {
                userId: user.id,
                orderid: buyOrderReq.orderid,
              },
            }
          );

  } catch (error) {

    logError(req, error, { msg: "placeAngelOrder failed unexpectedly" });

    return { status: false, broker: "angelone", message: error?.message };
  }
}