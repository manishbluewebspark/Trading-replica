

import Order from "../../models/orderModel.js";
import { v4 as uuidv4 } from "uuid";
import { Op } from "sequelize";

import {emitOrderGet} from "../../services/smartapiFeed.js"

// 15 digit order ID
function generateOrderId() {
  return Date.now().toString() + Math.floor(1000 + Math.random() * 9000);
}

// UUID v4
function generateUniqueOrderUUID() {
  return uuidv4();
}

// 7 digit fill ID
function generateFillId() {
  return Math.floor(1000000 + Math.random() * 9000000);
}


export const createManualOrder = async (req, res) => {
  try {
    let data = req.body;

    // -------- Basic Validations --------
    if (!data.tradingsymbol)
      return res.status(400).json({ status: false, message: "Tradingsymbol required" });

    if (!data.transactiontype)
      return res.status(400).json({ status: false, message: "Transaction Type required" });

    if (!data.exchange)
      return res.status(400).json({ status: false, message: "Exchange required" });

    // -------- Auto Calculate Total Price --------
    if (data.lotSize && data.price) {
      data.totalPrice = Number(data.lotSize) * Number(data.price);
    }

    if (data.transactiontype === "BUY") {

      data.orderstatuslocaldb = "OPEN";

    } else if (data.transactiontype === "SELL") {

      data.orderstatuslocaldb = "COMPLETE";

    }

    // -------- Generate IDs --------
    let now = new Date().toISOString();
    data.orderid = generateOrderId();
    data.uniqueorderid = generateUniqueOrderUUID();
    data.fillid = generateFillId();

    // -------- Default Values --------
    data.text = data.text || "";
    data.status = data.status || "COMPLETE";
    data.orderstatus = data.orderstatus || "COMPLETE";
    data.orderstatuslocaldb =  data.orderstatuslocaldb
    data.updatetime = data.updatetime || now;
    data.exchtime = data.exchtime || now;
    data.exchorderupdatetime = data.exchorderupdatetime || now;
    data.parentorderid = data.parentorderid || "";
    data.ordertag = data.ordertag || "MANUAL_ORDER";

    data.tradedValue = data.totalPrice || 0;
    data.fillprice = data.price || 0;
    data.fillsize = data.lotSize || 0;
    data.filltime = data.filltime || now;

    data.strikeprice = data.strikeprice || 0;
    data.optiontype = data.optiontype || "";
    data.expirydate = data.expirydate || "";

    data.cancelsize = data.cancelsize || "0";
    data.averageprice = data.averageprice || 0;
    data.filledshares = data.filledshares || "0";
    data.unfilledshares = data.unfilledshares || "0";

    data.quantity = data.lotSize;

    // ------------------------------------------------------
    //              FIND TODAY'S BUY ORDER
    // ------------------------------------------------------

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    let buyOrder = null;

    if (data.transactiontype === "SELL") {
      buyOrder = await Order.findOne({
        where: {
          userId: data.userId,
          variety: data.variety,
          tradingsymbol: data.tradingsymbol,
          symboltoken: data.symboltoken,
          exchange: data.exchange,
          ordertype: data.ordertype,
          transactiontype: "BUY",
          orderstatuslocaldb:"OPEN",
          createdAt: { [Op.between]: [startOfDay, endOfDay] }
        },
        raw: true
      });

      // -------- If BUY order exists → Calculate PNL --------
      if (buyOrder) {

        buyOrder.orderstatuslocaldb = "COMPLETE";

       await Order.update(
          { orderstatuslocaldb: "COMPLETE" },
          { where: { id: buyOrder.id } }
        );

        const pnl =
          (data.fillsize * data.price) - 
          (buyOrder.fillsize * buyOrder.fillprice);

        data.pnl = pnl;
        data.buyprice = buyOrder.fillprice;
        data.buysize = buyOrder.fillsize;
        data.buyvalue = buyOrder.tradedValue;
      }
    }



    // -------- Save Final Order --------
    const order = await Order.create(data);

    emitOrderGet()

    return res.status(201).json({
      status: true,
      message: "Manual Order Created Successfully",
      data: order,
    });

  } catch (err) {
    console.log("Create Order Error:", err);
    return res.status(500).json({
      status: false,
      message: err.message || "Internal Server Error",
    });
  }
};


// export const createManualOrder = async (req, res) => {
//   try {

//     let data = req.body;

//     // Basic validations
//     if (!data.tradingsymbol)
//       return res.status(400).json({ status: false, message: "Tradingsymbol required" });

//     if (!data.transactiontype)
//       return res.status(400).json({ status: false, message: "Transaction Type required" });

//     if (!data.exchange)
//       return res.status(400).json({ status: false, message: "Exchange required" });

//     // Auto Calculate total price = price * lotSize
//     if (data.lotSize && data.price) {
//       data.totalPrice = Number(data.lotSize) * Number(data.price);
//     }

//     // Generate IDs
//     let orderId = generateOrderId();
//     let uniqueorderid = generateUniqueOrderUUID();
//     let fillid = generateFillId();

//     // Set auto IDs
//     data.orderid = orderId;
//     data.uniqueorderid = uniqueorderid;
//     data.fillid = fillid;

//     // Default values for missing fields
//     const now = new Date().toISOString();

//     data.text = data.text || "";
//     data.status = data.status || "COMPLETE";
//     data.orderstatus = data.orderstatus || "COMPLETE";
//     data.orderstatuslocaldb = data.orderstatuslocaldb || "COMPLETE";
//     data.updatetime = data.updatetime || now;
//     data.exchtime = data.exchtime || now;
//     data.exchorderupdatetime = data.exchorderupdatetime || now;
//     data.parentorderid = data.parentorderid || "";
//     data.ordertag = data.ordertag || "MANUAL_ORDER";
//     data.tradedValue = data.totalPrice || 0;
//     data.fillprice = data.price || 0;
//     data.fillsize = data.lotSize || 0;
//     data.filltime = data.filltime || now;
//     data.strikeprice = data.strikeprice || 0;
//     data.optiontype = data.optiontype || "";
//     data.expirydate = data.expirydate || "";
//     data.cancelsize = data.cancelsize || "0";
//     data.averageprice = data.averageprice || 0;
//     data.filledshares = data.filledshares || "0";
//     data.unfilledshares = data.unfilledshares || "0";
//     data.quantity = data.lotSize;


//     console.log(data,'create order !');
    

//     // Save order
//     const order = await Order.create(data);

//     return res.status(201).json({
//       status: true,
//       message: "Manual Order Created Successfully",
//       data: order,
//     });

//   } catch (err) {
//     console.log("Create Order Error:", err);
//     return res.status(500).json({
//       status: false,
//       message: err.message || "Internal Server Error",
//     });
//   }
// };



export const getAllManualOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });

    return res.status(200).json({
      status: true,
      message: "All orders fetched successfully",
      data: orders,
    });
  } catch (err) {
    console.log("Get Orders Error:", err);
    return res.status(500).json({
      status: false,
      message: err.message || "Internal Server Error",
    });
  }
};