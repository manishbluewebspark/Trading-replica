

import Order from "../../models/orderModel.js";
import User from "../../models/userModel.js";
import { v4 as uuidv4 } from "uuid";
import { Op } from "sequelize";
import sequelize from "../../config/db.js";
import dayjs from "dayjs";
import {emitOrderGet} from "../../services/smartapiFeed.js"
import { generateStrategyUniqueId } from "../../utils/randomWords.js";


const input = "2025-12-03 04:12:29.272+00";

const converted = dayjs(input)
  .utc()
  .millisecond(0)
  .format("YYYY-MM-DDTHH:mm:ss.000[Z]");

console.log(converted,'update data');




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


export const createManualOrderWithBrokerPrice = async (req, res) => {
  try {

    let data = req.body;

     let strategyUniqueId = await generateStrategyUniqueId("clone-user")
  
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
    data.userNameId = data.username
    // -------- Default Values --------
    data.text = data.text || "";
    data.status = data.status || "COMPLETE";
    data.orderstatus = data.orderstatus || "COMPLETE";
    data.orderstatuslocaldb =  data.orderstatuslocaldb
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
    data.strategyUniqueId = strategyUniqueId||""

    data.angelOneSymbol =  data.tradingsymbol,
    data.angelOneToken =  data.symboltoken,



    console.log(now,'now');



    

    // ------------------------------------------------------
    //              FIND TODAY'S BUY ORDER
    // ------------------------------------------------------

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    let buyOrder = null;

    let pnlData = 0

    if (data.transactiontype === "SELL") {

    pnlData =   (data.fillsize * data.price) - 
          (buyOrder.fillsize * buyOrder.fillprice);


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
        data.buyTime = buyOrder.filltime;
        data.buysize = buyOrder.fillsize;
        data.buyvalue = buyOrder.tradedValue;
      }
    }



    // -------- Save Final Order --------
    const order = await Order.create(data);

     if(data.transactiontype === "SELL") {

       await User.increment(
        { DematFund: pnlData },                 // 👈 add pnl
        {
          where: { username: data.username }
        }
      );

     }

    

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


export const createManualOrder = async (req, res) => {
  
  const t = await sequelize.transaction();
  try {
    let data = { ...req.body };

    // -------- Basic Validations --------
    if (!data.tradingsymbol)
      return res.status(400).json({ status: false, message: "Tradingsymbol required" });

    if (!data.exchange)
      return res.status(400).json({ status: false, message: "Exchange required" });

    if (!data.lotSize)
      return res.status(400).json({ status: false, message: "lotSize required" });

    if (data.buyPrice == null || data.sellPrice == null)
      return res.status(400).json({ status: false, message: "buyPrice and sellPrice required" });

    if (!data.buyTime || !data.sellTime)
      return res.status(400).json({ status: false, message: "buyTime and sellTime required" });

    const fillsize = Number(data.lotSize) || 0;

    // Convert to UTC ISO (works correctly ONLY if input includes timezone like +05:30)
    const utcBuyTime = new Date(data.buyTime).toISOString();
    const utcSellTime = new Date(data.sellTime).toISOString();

    let strategyUniqueId = await generateStrategyUniqueId("clone-user")

    // Common defaults
    const common = {
      ...data,
      userNameId: data.username,
      text: data.text || "",
      status: "COMPLETE",
      orderstatus: "COMPLETE",
      orderstatuslocaldb: "COMPLETE",
      parentorderid: data.parentorderid || "",
      strikeprice: data.strikeprice || 0,
      optiontype: data.optiontype || "",
      expirydate: data.expirydate || "",
      cancelsize: data.cancelsize || "0",
      averageprice: data.averageprice || 0,
      filledshares: data.filledshares || "0",
      unfilledshares: data.unfilledshares || "0",
      quantity: fillsize,
      fillsize,
      buysize: fillsize,
      strategyUniqueId:strategyUniqueId
    };

    // =========================
    // 1️⃣ CREATE BUY ORDER FIRST
    // =========================

     let strategyUniqueIdBuy = await generateStrategyUniqueId("clone-user")

    const buyOrderData = {
      ...common,
      orderid: generateOrderId(),
      uniqueorderid: generateUniqueOrderUUID(),
      fillid: generateFillId(),

      transactiontype: "BUY",
      ordertag: "AUTO_BUY_FROM_MANUAL",

      // BUY-side mapping
      filltime: utcBuyTime,
      buyTime: utcBuyTime,

      price: Number(data.buyPrice),
      fillprice: Number(data.buyPrice),
      angelOneSymbol :  data.tradingsymbol,
      angelOneToken :  data.symboltoken,

      // optional store buyprice too (keeps your schema consistent)
      buyprice: Number(data.buyPrice),
      tradedValue: fillsize * Number(data.buyPrice),
      buyvalue: fillsize * Number(data.buyPrice),
      strategyUniqueId:strategyUniqueIdBuy,
      pnl: 0, // pnl usually computed after sell
    };

    const buyOrder = await Order.create(buyOrderData, { transaction: t });

    // =========================
    // 2️⃣ CREATE SELL ORDER AFTER
    // =========================

    let pnlData  = (fillsize * Number(data.sellPrice)) - (fillsize * Number(data.buyPrice))

    const sellOrderData = {
      ...common,
      orderid: generateOrderId(),
      uniqueorderid: generateUniqueOrderUUID(),
      fillid: generateFillId(),

      transactiontype: "SELL",
      ordertag: data.ordertag || "MANUAL_ORDER",

      // Link sell to buy (choose one)
      parentorderid: buyOrder.orderid, // ✅ strong link
      buyOrderId: buyOrder.orderid,    // ✅ if you already use this column

       angelOneSymbol :  data.tradingsymbol,
       angelOneToken :  data.symboltoken,

      // SELL-side mapping
      filltime: utcSellTime,
      buyTime: utcBuyTime, // keep stored as well

      price: Number(data.sellPrice),
      fillprice: Number(data.sellPrice),

      buyprice: Number(data.buyPrice),
      buyvalue: fillsize * Number(data.buyPrice),

      tradedValue: fillsize * Number(data.sellPrice),
      pnl: (fillsize * Number(data.sellPrice)) - (fillsize * Number(data.buyPrice)),
    };

    const sellOrder = await Order.create(sellOrderData, { transaction: t });

      await User.increment(
        { DematFund: pnlData },                 // 👈 add pnl
        {
          where: { username: data.username }
        }
      );
    await t.commit();

    return res.status(201).json({
      status: true,
      message: "BUY created first, then SELL created successfully",
      data: { buyOrder, sellOrder },
    });
  } catch (err) {
    await t.rollback();
    console.log("Create Order Error:", err);
    return res.status(500).json({
      status: false,
      message: err.message || "Internal Server Error",
    });
  }
};



export const createManualOrder1 = async (req, res) => {
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

    // -------- Generate IDs --------
    data.orderid = generateOrderId();
    data.uniqueorderid = generateUniqueOrderUUID();
    data.fillid = generateFillId();
    data.userNameId = data.username
    // -------- Default Values --------
    data.text = data.text || "";
    data.status = data.status || "COMPLETE";
    data.orderstatus = data.orderstatus || "COMPLETE";
    data.orderstatuslocaldb = 'COMPLETE'
    data.parentorderid = data.parentorderid || "";
    data.ordertag = data.ordertag || "MANUAL_ORDER";
    data.transactiontype = 'SELL',
    data.tradedValue = data.lotSize*data.sellPrice

    data.fillsize = data.lotSize || 0;

    const buyTime = data.buyTime

 // Treat input as IST and convert to UTC
   const utcString = new Date(buyTime).toISOString();

    data.buyTime = utcString

    const sellTime = data.sellTime

    const utcStringSell = new Date(sellTime).toISOString();

    data.filltime = utcStringSell;

    data.price =  Number(data.sellPrice)
     
    data.strikeprice = data.strikeprice || 0;
    data.optiontype = data.optiontype || "";
    data.expirydate = data.expirydate || "";

    data.cancelsize = data.cancelsize || "0";
    data.averageprice = data.averageprice || 0;
    data.filledshares = data.filledshares || "0";
    data.unfilledshares = data.unfilledshares || "0";


    data.quantity = data.fillsize;
    data.fillprice = Number(data.sellPrice)
    data.buyprice = Number(data.buyPrice)
    data.buysize =  data.fillsize;
    data.pnl = (data.fillsize*data.sellPrice)-(data.fillsize*data.buyPrice)
   
    data.buyvalue = data.fillsize*data.buyPrice;

    // -------- Save Final Order --------
    const order = await Order.create(data);

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