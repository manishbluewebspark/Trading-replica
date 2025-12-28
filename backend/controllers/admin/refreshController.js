import axios from "axios";
import Order from "../../models/orderModel.js";
import Trade from "../../models/tradeModel.js";
import User from "../../models/userModel.js";
import { logSuccess, logError } from "../../utils/loggerr.js";
import { getKiteClientForUserId } from "../../services/userKiteBrokerService.js";


/* ======================================================
   BROKER FETCH FUNCTIONS
====================================================== */
const fetchAngelOrders = async (user) => {

  if (!user.authToken) return [];

  const res = await axios.get(
    "https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/getOrderBook",
    {
      headers: {
        Authorization: `Bearer ${user.authToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-UserType": "USER",
        "X-SourceID": "WEB",
        "X-ClientLocalIP": process.env.CLIENT_LOCAL_IP,
        "X-ClientPublicIP": process.env.CLIENT_PUBLIC_IP,
        "X-MACAddress": process.env.MAC_Address,
        "X-PrivateKey": process.env.PRIVATE_KEY,
      },
    }
  );

  return (res.data?.data || [])
    .filter(o => o.status === "complete")
    .map(o => ({
      broker: "angelone",
      tradingsymbol: o.tradingsymbol,
      transactiontype: o.transactiontype, // BUY / SELL
      quantity: Number(o.filledshares),
      price: Number(o.averageprice),
      orderid: o.orderid,
      uniqueorderid:o.uniqueorderid,
      filltime:o.exchtime
    }));
};


const fetchKiteOrders = async (user) => {
  const kite = await getKiteClientForUserId(user.id);
  const orders = await kite.getOrders();

  return (orders || [])
    .filter(o => o.status === "COMPLETE")
    .map(o => ({
      broker: "kite",
      tradingsymbol: o.tradingsymbol,
      transactiontype: o.transaction_type, // BUY / SELL
      quantity: Number(o.filled_quantity),
      price: Number(o.average_price),
      orderid: o.order_id,
      uniqueorderid:o.exchange_order_id,
      filltime:o.exchange_timestamp
    }));
};


/* ================= DUMMY BROKER FETCH ================= */

const fetchBrokerOrders = async (user) => {
  if (user.brokerName === "angelone") return fetchAngelOrders(user);
  if (user.brokerName === "kite") return fetchKiteOrders(user);
  return [];
};


/* =====================================================
   MAIN API
===================================================== */


export const GetOrderStatusPerticularSymbol = async (req, res) => {
  try {

    const openBuys = await Order.findAll({
      where: {
        transactiontype: "BUY",
        orderstatuslocaldb: "OPEN",
        status: "COMPLETE",
      },
      raw: true,
    });

    if (!openBuys.length) {
      return res.json({ status: true, message: "No open positions" });
    }

    const userCache = {};
    const brokerCache = {};

    for (const buy of openBuys) {

      /* ---------- USER ---------- */
      let user = userCache[buy.userId];
      if (!user) {
        user = await User.findOne({ where: { id: buy.userId }, raw: true });
        userCache[buy.userId] = user;
      }
      if (!user) continue;

      /* ---------- BROKER DATA ---------- */
      if (!brokerCache[user.id]) {
        brokerCache[user.id] = await fetchBrokerOrders(user);
      }

      /* ---------- FILTER ONLY AFTER THIS BUY ---------- */
      const brokerTrades = brokerCache[user.id].filter(t =>
        t.tradingsymbol === buy.tradingsymbol &&
        new Date(t.filltime) >= new Date(buy.filltime)
      );

      if (!brokerTrades.length) continue;

      /* ---------- AGGREGATION ---------- */
      let buyQty = 0, buyValue = 0;
      let sellQty = 0, sellValue = 0;

      for (const t of brokerTrades) {
        if (t.transactiontype === "BUY") {
          buyQty += Number(t.quantity);
          buyValue += t.quantity * t.price;

          // 🔥 AUDIT BUY
          await Trade.findOrCreate({
            where: { orderid: t.orderid },
            defaults: {
              ...t,
              transactiontype: "BUY",
              positionId: buy.orderid,
              source: "DEMAT",
              status: "COMPLETE",
            },
          });
        }

        if (t.transactiontype === "SELL") {
          sellQty += Number(t.quantity);
          sellValue += t.quantity * t.price;

          // 🔥 AUDIT SELL
          await Trade.findOrCreate({
            where: { orderid: t.orderid },
            defaults: {
              ...t,
              transactiontype: "SELL",
              positionId: buy.orderid,
              source: "DEMAT",
              status: "COMPLETE",
            },
          });
        }
      }

      const buyAvg = buyQty ? buyValue / buyQty : 0;
      const sellAvg = sellQty ? sellValue / sellQty : 0;

      /* ================= ONLY BUY ================= */
      if (sellQty === 0) {
  
        await Order.update(
          {
            quantity: buyQty,
            fillsize: buyQty,
            price: buyAvg,
            fillprice: buyAvg,
            tradedValue: buyQty * buyAvg,
          },
          { where: { id: buy.id } }
        );
        continue;
      }

      /* ================= PARTIAL SELL ================= */
      if (sellQty < buyQty) {
        const remaining = buyQty - sellQty;

        await Order.update(
          {
            quantity: remaining,
            fillsize: remaining,
            tradedValue: remaining * buyAvg,
          },
          { where: { id: buy.id } }
        );
        continue;
      }

      /* ================= FULL SELL ================= */
      if (sellQty >= buyQty) {

        const lastSell = brokerTrades
          .filter(t => t.transactiontype === "SELL")
          .pop();

        const pnl = (sellAvg - buyAvg) * buyQty;

        await Order.update(
          {
            orderstatuslocaldb: "COMPLETE",
            positionStatus: "COMPLETE",
          },
          { where: { id: buy.id } }
        );

        await Order.create({
          ...buy,

          id: undefined,
          transactiontype: "SELL",

          quantity: buyQty,
          price: sellAvg,

          tradedValue: sellAvg * buyQty,
          fillprice: sellAvg,
          fillsize: buyQty,

          buyprice: buyAvg,
          buyvalue: buyAvg * buyQty,
          buysize: buyQty,
          buyTime: buy.filltime,

          pnl,

          orderid: lastSell.orderid,
          uniqueorderid: lastSell?.uniqueorderid,
          fillid: lastSell?.fillid,
          filltime: lastSell.filltime,

          orderstatuslocaldb: "COMPLETE",
          positionStatus: "COMPLETE",
        });
      }
    }

    return res.json({ status: true, message: "Order sync done" });

  } catch (err) {
    console.error(err);
    logError(req, err);
    return res.json({ status: false, message: err.message });
  }
};



















// ======================ref code ==============

// import axios from "axios";
// import Order from "../../models/orderModel.js";
// import Trade from "../../models/tradeModel.js";
// import User from "../../models/userModel.js";
// import { logSuccess, logError } from "../../utils/loggerr.js";


// /* ======================================================
//    UTILS
// ====================================================== */

// import { randomUUID } from "crypto";
// import { DATE } from "sequelize";

// export const generateUniqueOrderId = () => {
//   return randomUUID();
// };

// export const generateFillId = () => {
//   // 7–8 digit numeric id
//   return Math.floor(1000000 + Math.random() * 9000000).toString();
// };

// export const generateOrderId = () => {
//   const timestamp = Date.now();        // milliseconds
//   const random = Math.floor(Math.random() * 10000); // 4 digit
//   return `${timestamp}${random}`;
// };

// const avgPrice = (q1, p1, q2, p2) =>
//   (q1 * p1 + q2 * p2) / (q1 + q2);

// const calcPNL = (buy, sell, qty) =>
//   (sell - buy) * qty;


// const fetchAngelOrders = (user) => {
    
//   return [ 

//     //  second trade
     
//     {
//     userId: 20,
//     userNameId: '34038',
//     variety: 'NORMAL',
//     ordertype: 'MARKET',
//     producttype: 'INTRADAY',
//     duration: 'DAY',
//     price: 99.7,
//     totalPrice: 15366,
//     triggerprice: 0,
//     quantity: '65',
//     actualQuantity: null,
//     disclosedquantity: null,
//     squareoff: 0,
//     stoploss: 0,
//     trailingstoploss: 0,
//     tradingsymbol: 'NIFTY20JAN2626550CE',
//     transactiontype: 'BUY',
//     exchange: 'NFO',
//     symboltoken: '47681',
//     instrumenttype: 'OPTIDX',
//     strikeprice: 0,
//     optiontype: '',
//     expirydate: '',
//     lotsize: null,
//     cancelsize: '0',
//     averageprice: 0,
//     filledshares: '0',
//     unfilledshares: '0',
//     orderid:"17669293313914973",
//     text: '',
//     status: 'COMPLETE',
//     orderstatus: 'COMPLETE',
//     orderstatuslocaldb: 'OPEN',
//     ordertag: 'MANUAL_ORDER',
//     uniqueorderid:"02488088-8509-42b9-a622-84c9cb4ba0a3",
//     tradedValue: 15366,
//     fillprice: 99.7,
//     fillsize: 65,
//     buyvalue: 0,
//     buyprice: 0,
//     buysize: 0,
//     pnl: 0,
//     fillid: "6771078",
//     filltime: "2025-12-28T13:42:11.391Z",
//     broker: null,
//     angelOneToken: '47681',
//     angelOneSymbol: 'NIFTY20JAN2626550CE',
//     buyTime: '',
//     buyOrderId: null,
//     strategyName: null,
//     strategyUniqueId: '3182a1f0_clone_user',
//     positionStatus: 'OPEN',
//     createdAt: "2025-12-28T10:35:55.262Z",
//     updatedAt: "2025-12-28T12:52:01.449Z"
//   },

//     {
//     userId: 20,
//     userNameId: '34038',
//     variety: 'NORMAL',
//     ordertype: 'MARKET',
//     producttype: 'INTRADAY',
//     duration: 'DAY',
//     price: 102.87,
//     totalPrice: 15366,
//     triggerprice: 0,
//     quantity: '65',
//     actualQuantity: null,
//     disclosedquantity: null,
//     squareoff: 0,
//     stoploss: 0,
//     trailingstoploss: 0,
//     tradingsymbol: 'NIFTY20JAN2626550CE',
//     transactiontype: 'SELL',
//     exchange: 'NFO',
//     symboltoken: '47681',
//     instrumenttype: 'OPTIDX',
//     strikeprice: 0,
//     optiontype: '',
//     expirydate: '',
//     lotsize: null,
//     cancelsize: '0',
//     averageprice: 0,
//     filledshares: '0',
//     unfilledshares: '0',
//     orderid:"17669292251801240",
//     text: '',
//     status: 'COMPLETE',
//     orderstatus: 'COMPLETE',
//     orderstatuslocaldb: 'OPEN',
//     ordertag: 'MANUAL_ORDER',
//     uniqueorderid:"ec75c052-7ebe-435e-8c72-45fcfc40582c",
//     tradedValue: 15366,
//     fillprice: 102.87,
//     fillsize: 65,
//     buyvalue: 0,
//     buyprice: 0,
//     buysize: 0,
//     pnl: 0,
//     fillid: "1490027",
//    filltime: "2025-12-28T13:46:11.391Z",
//     broker: null,
//     angelOneToken: '47681',
//     angelOneSymbol: 'NIFTY20JAN2626550CE',
//     buyTime: '',
//     buyOrderId: null,
//     strategyName: null,
//     strategyUniqueId: '3182a1f0_clone_user',
//     positionStatus: 'OPEN',
//     createdAt: "2025-12-28T10:35:55.262Z",
//     updatedAt: "2025-12-28T12:52:01.449Z"
//   },


//   //  trade first 

//   //    {
//   //   userId: 20,
//   //   userNameId: '34038',
//   //   variety: 'NORMAL',
//   //   ordertype: 'MARKET',
//   //   producttype: 'INTRADAY',
//   //   duration: 'DAY',
//   //   price: 236.4,
//   //   totalPrice: 15366,
//   //   triggerprice: 0,
//   //   quantity: '65',
//   //   actualQuantity: null,
//   //   disclosedquantity: null,
//   //   squareoff: 0,
//   //   stoploss: 0,
//   //   trailingstoploss: 0,
//   //   tradingsymbol: 'NIFTY20JAN2626550CE',
//   //   transactiontype: 'BUY',
//   //   exchange: 'NFO',
//   //   symboltoken: '47681',
//   //   instrumenttype: 'OPTIDX',
//   //   strikeprice: 0,
//   //   optiontype: '',
//   //   expirydate: '',
//   //   lotsize: null,
//   //   cancelsize: '0',
//   //   averageprice: 0,
//   //   filledshares: '0',
//   //   unfilledshares: '0',
//   //   orderid: "17669286674961576",
//   //   text: '',
//   //   status: 'COMPLETE',
//   //   orderstatus: 'COMPLETE',
//   //   orderstatuslocaldb: 'OPEN',
//   //   ordertag: 'MANUAL_ORDER',
//   //   uniqueorderid:"00182c53-59e3-4677-a7b6-dff95020b66f",
//   //   tradedValue: 15366,
//   //   fillprice: 236.4,
//   //   fillsize: 65,
//   //   buyvalue: 0,
//   //   buyprice: 0,
//   //   buysize: 0,
//   //   pnl: 0,
//   //   fillid: "8668793",
//   //   filltime: "2025-12-28T13:31:07.496Z",
//   //   broker: null,
//   //   angelOneToken: '47681',
//   //   angelOneSymbol: 'NIFTY20JAN2626550CE',
//   //   buyTime: '',
//   //   buyOrderId: null,
//   //   strategyName: null,
//   //   strategyUniqueId: '3182a1f0_clone_user',
//   //   positionStatus: 'OPEN',
//   //   createdAt: "2025-12-28T10:35:55.262Z",
//   //   updatedAt: "2025-12-28T12:52:01.449Z"
//   // },

 
//   //   {
//   //   userId: 20,
//   //   userNameId: '34038',
//   //   variety: 'NORMAL',
//   //   ordertype: 'MARKET',
//   //   producttype: 'INTRADAY',
//   //   duration: 'DAY',
//   //   price: 240.5,
//   //   totalPrice: 15366,
//   //   triggerprice: 0,
//   //   quantity: '650',
//   //   actualQuantity: null,
//   //   disclosedquantity: null,
//   //   squareoff: 0,
//   //   stoploss: 0,
//   //   trailingstoploss: 0,
//   //   tradingsymbol: 'NIFTY20JAN2626550CE',
//   //   transactiontype: 'BUY',
//   //   exchange: 'NFO',
//   //   symboltoken: '47681',
//   //   instrumenttype: 'OPTIDX',
//   //   strikeprice: 0,
//   //   optiontype: '',
//   //   expirydate: '',
//   //   lotsize: null,
//   //   cancelsize: '0',
//   //   averageprice: 0,
//   //   filledshares: '0',
//   //   unfilledshares: '0',
//   //   orderid: "17669266130005276",
//   //   text: '',
//   //   status: 'COMPLETE',
//   //   orderstatus: 'COMPLETE',
//   //   orderstatuslocaldb: 'OPEN',
//   //   ordertag: 'MANUAL_ORDER',
//   //   uniqueorderid:"1409a6da-682c-4066-81be-a2d800efc762",
//   //   tradedValue: 15366,
//   //   fillprice: 240.5,
//   //   fillsize: 650,
//   //   buyvalue: 0,
//   //   buyprice: 0,
//   //   buysize: 0,
//   //   pnl: 0,
//   //   fillid: "2595217",
//   //   filltime: "2025-12-28T13:35:07.496Z",
//   //   broker: null,
//   //   angelOneToken: '47681',
//   //   angelOneSymbol: 'NIFTY20JAN2626550CE',
//   //   buyTime: '',
//   //   buyOrderId: null,
//   //   strategyName: null,
//   //   strategyUniqueId: '3182a1f0_clone_user',
//   //   positionStatus: 'OPEN',
//   //   createdAt: "2025-12-28T10:40:55.262Z",
//   //   updatedAt: "2025-12-28T12:52:01.449Z"
//   // },

//   //   {
//   //   userId: 20,
//   //   userNameId: '34038',
//   //   variety: 'NORMAL',
//   //   ordertype: 'MARKET',
//   //   producttype: 'INTRADAY',
//   //   duration: 'DAY',
//   //   price: 250,
//   //   totalPrice: 15366,
//   //   triggerprice: 0,
//   //   quantity: '325',
//   //   actualQuantity: null,
//   //   disclosedquantity: null,
//   //   squareoff: 0,
//   //   stoploss: 0,
//   //   trailingstoploss: 0,
//   //   tradingsymbol: 'NIFTY20JAN2626550CE',
//   //   transactiontype: 'SELL',
//   //   exchange: 'NFO',
//   //   symboltoken: '47681',
//   //   instrumenttype: 'OPTIDX',
//   //   strikeprice: 0,
//   //   optiontype: '',
//   //   expirydate: '',
//   //   lotsize: null,
//   //   cancelsize: '0',
//   //   averageprice: 0,
//   //   filledshares: '0',
//   //   unfilledshares: '0',
//   //   orderid:"17669284770023556" ,
//   //   text: '',
//   //   status: 'COMPLETE',
//   //   orderstatus: 'COMPLETE',
//   //   orderstatuslocaldb: 'OPEN',
//   //   ordertag: 'MANUAL_ORDER',
//   //   uniqueorderid: "3d3327fb-ec9a-4e97-b372-8fc22615c7e6",
//   //   tradedValue: 15366,
//   //   fillprice:250,
//   //   fillsize: 325,
//   //   buyvalue: 0,
//   //   buyprice: 0,
//   //   buysize: 0,
//   //   pnl: 0,
//   //   fillid: "7792360",
//   //    filltime: "2025-12-28T13:37:07.496Z",
//   //   broker: null,
//   //   angelOneToken: '47681',
//   //   angelOneSymbol: 'NIFTY20JAN2626550CE',
//   //   buyTime: '',
//   //   buyOrderId: null,
//   //   strategyName: null,
//   //   strategyUniqueId: '3182a1f0_clone_user',
//   //   positionStatus: 'OPEN',
//   //   createdAt: "2025-12-28T10:35:55.262Z",
//   //   updatedAt: "2025-12-28T12:52:01.449Z"
//   // },

//   //   {
//   //   id: 684,
//   //   userId: 20,
//   //   userNameId: '34038',
//   //   variety: 'NORMAL',
//   //   ordertype: 'MARKET',
//   //   producttype: 'INTRADAY',
//   //   duration: 'DAY',
//   //   price: 220,
//   //   totalPrice: 15366,
//   //   triggerprice: 0,
//   //   quantity: '390',
//   //   actualQuantity: null,
//   //   disclosedquantity: null,
//   //   squareoff: 0,
//   //   stoploss: 0,
//   //   trailingstoploss: 0,
//   //   tradingsymbol: 'NIFTY20JAN2626550CE',
//   //   transactiontype: 'SELL',
//   //   exchange: 'NFO',
//   //   symboltoken: '47681',
//   //   instrumenttype: 'OPTIDX',
//   //   strikeprice: 0,
//   //   optiontype: '',
//   //   expirydate: '',
//   //   lotsize: null,
//   //   cancelsize: '0',
//   //   averageprice: 0,
//   //   filledshares: '0',
//   //   unfilledshares: '0',
//   //   orderid: "17669288899563431",
//   //   text: '',
//   //   status: 'COMPLETE',
//   //   orderstatus: 'COMPLETE',
//   //   orderstatuslocaldb: 'OPEN',
//   //   ordertag: 'MANUAL_ORDER',
//   //   uniqueorderid:"77e750cd-1051-41fd-8e22-772f9ec12798",
//   //   tradedValue: 15366,
//   //   fillprice: 220,
//   //   fillsize: 390,
//   //   buyvalue: 0,
//   //   buyprice: 0,
//   //   buysize: 0,
//   //   pnl: 0,
//   //   fillid: "1426259",
//   //   filltime: "2025-12-28T13:40:07.496Z",
//   //   broker: null,
//   //   angelOneToken: '47681',
//   //   angelOneSymbol: 'NIFTY20JAN2626550CE',
//   //   buyTime: '',
//   //   buyOrderId: null,
//   //   strategyName: null,
//   //   strategyUniqueId: '3182a1f0_clone_user',
//   //   positionStatus: 'OPEN',
//   //   createdAt: "2025-12-28T10:35:55.262Z",
//   //   updatedAt: "2025-12-28T12:52:01.449Z"
//   // },




// ]

// }

// const fetchKiteOrders = (user) => {

//     return [
  
//   //     {
//   //   id: 683,
//   //   userId: 22,
//   //   userNameId: '37665',
//   //   variety: 'NORMAL',
//   //   ordertype: 'MARKET',
//   //   producttype: 'INTRADAY',
//   //   duration: 'DAY',
//   //   price: 165.8,
//   //   totalPrice: 10777,
//   //   triggerprice: 0,
//   //   quantity: '65',
//   //   actualQuantity: null,
//   //   disclosedquantity: null,
//   //   squareoff: 0,
//   //   stoploss: 0,
//   //   trailingstoploss: 0,
//   //   tradingsymbol: 'NIFTY13JAN2626800CE',
//   //   transactiontype: 'BUY',
//   //   exchange: 'NFO',
//   //   symboltoken: '46219',
//   //   instrumenttype: 'OPTIDX',
//   //   strikeprice: 0,
//   //   optiontype: '',
//   //   expirydate: '',
//   //   lotsize: null,
//   //   cancelsize: '0',
//   //   averageprice: 0,
//   //   filledshares: '0',
//   //   unfilledshares: '0',
//   //   orderid: generateOrderId,
//   //   text: '',
//   //   status: 'COMPLETE',
//   //   orderstatus: 'COMPLETE',
//   //   orderstatuslocaldb: 'OPEN',
//   //   ordertag: 'MANUAL_ORDER',
//   //   uniqueorderid: generateUniqueOrderId,
//   //   tradedValue: 10777,
//   //   fillprice: 165.8,
//   //   fillsize: 65,
//   //   buyvalue: 0,
//   //   buyprice: 0,
//   //   buysize: 0,
//   //   pnl: 0,
//   //   fillid: generateFillId,
//   //   filltime: '2025-12-28T10:35:40.084Z',
//   //   broker: null,
//   //   angelOneToken: '46219',
//   //   angelOneSymbol: 'NIFTY13JAN2626800CE',
//   //   buyTime: '',
//   //   buyOrderId: null,
//   //   strategyName: null,
//   //   strategyUniqueId: '98c00b95_clone_user',
//   //   positionStatus: 'OPEN',
//   //   createdAt: "2025-12-28T10:35:40.086Z",
//   //   updatedAt: "2025-12-28T12:52:01.453Z"
//   // }

// ]

// }









// /* ================= DUMMY BROKER FETCH ================= */

// const fetchBrokerOrders = async (user) => {
//   if (user.brokerName === "angelone") return fetchAngelOrders(user);
//   if (user.brokerName === "kite") return fetchKiteOrders(user);
//   return [];
// };


// /* =====================================================
//    MAIN API
// ===================================================== */


// export const GetOrderStatusPerticularSymbol = async (req, res) => {
//   try {

//     const openBuys = await Order.findAll({
//       where: {
//         transactiontype: "BUY",
//         orderstatuslocaldb: "OPEN",
//         status: "COMPLETE",
//       },
//       raw: true,
//     });

//     if (!openBuys.length) {
//       return res.json({ status: true, message: "No open positions" });
//     }

//     const userCache = {};
//     const brokerCache = {};

//     for (const buy of openBuys) {

//       /* ---------- USER ---------- */
//       let user = userCache[buy.userId];
//       if (!user) {
//         user = await User.findOne({ where: { id: buy.userId }, raw: true });
//         userCache[buy.userId] = user;
//       }
//       if (!user) continue;

//       /* ---------- BROKER DATA ---------- */
//       if (!brokerCache[user.id]) {
//         brokerCache[user.id] = await fetchBrokerOrders(user);
//       }

//       /* ---------- FILTER ONLY AFTER THIS BUY ---------- */
//       const brokerTrades = brokerCache[user.id].filter(t =>
//         t.tradingsymbol === buy.tradingsymbol &&
//         new Date(t.filltime) >= new Date(buy.filltime)
//       );

//       if (!brokerTrades.length) continue;

//       /* ---------- AGGREGATION ---------- */
//       let buyQty = 0, buyValue = 0;
//       let sellQty = 0, sellValue = 0;

//       for (const t of brokerTrades) {
//         if (t.transactiontype === "BUY") {
//           buyQty += Number(t.quantity);
//           buyValue += t.quantity * t.price;

//           // 🔥 AUDIT BUY
//           await Trade.findOrCreate({
//             where: { fillid: t.fillid },
//             defaults: {
//               ...t,
//               transactiontype: "BUY",
//               positionId: buy.orderid,
//               source: "DEMAT",
//               status: "COMPLETE",
//             },
//           });
//         }

//         if (t.transactiontype === "SELL") {
//           sellQty += Number(t.quantity);
//           sellValue += t.quantity * t.price;

//           // 🔥 AUDIT SELL
//           await Trade.findOrCreate({
//             where: { fillid: t.fillid },
//             defaults: {
//               ...t,
//               transactiontype: "SELL",
//               positionId: buy.orderid,
//               source: "DEMAT",
//               status: "COMPLETE",
//             },
//           });
//         }
//       }

//       const buyAvg = buyQty ? buyValue / buyQty : 0;
//       const sellAvg = sellQty ? sellValue / sellQty : 0;

     
      

//       /* ================= ONLY BUY ================= */
//       if (sellQty === 0) {
  
//         await Order.update(
//           {
//             quantity: buyQty,
//             fillsize: buyQty,
//             price: buyAvg,
//             fillprice: buyAvg,
//             tradedValue: buyQty * buyAvg,
//           },
//           { where: { id: buy.id } }
//         );
//         continue;
//       }

//       /* ================= PARTIAL SELL ================= */
//       if (sellQty < buyQty) {
//         const remaining = buyQty - sellQty;

//         await Order.update(
//           {
//             quantity: remaining,
//             fillsize: remaining,
//             tradedValue: remaining * buyAvg,
//           },
//           { where: { id: buy.id } }
//         );
//         continue;
//       }

//       /* ================= FULL SELL ================= */
//       if (sellQty >= buyQty) {

//         const lastSell = brokerTrades
//           .filter(t => t.transactiontype === "SELL")
//           .pop();

//         const pnl = (sellAvg - buyAvg) * buyQty;

//         await Order.update(
//           {
//             orderstatuslocaldb: "COMPLETE",
//             positionStatus: "COMPLETE",
//           },
//           { where: { id: buy.id } }
//         );

//         await Order.create({
//           ...buy,

//           id: undefined,
//           transactiontype: "SELL",

//           quantity: buyQty,
//           price: sellAvg,

//           tradedValue: sellAvg * buyQty,
//           fillprice: sellAvg,
//           fillsize: buyQty,

//           buyprice: buyAvg,
//           buyvalue: buyAvg * buyQty,
//           buysize: buyQty,
//           buyTime: buy.filltime,

//           pnl,

//           orderid: lastSell.orderid,
//           uniqueorderid: lastSell.uniqueorderid,
//           fillid: lastSell.fillid,
//           filltime: lastSell.filltime,

//           orderstatuslocaldb: "COMPLETE",
//           positionStatus: "COMPLETE",
//         });
//       }
//     }

//     return res.json({ status: true, message: "Order sync done" });

//   } catch (err) {
//     console.error(err);
//     logError(req, err);
//     return res.json({ status: false, message: err.message });
//   }
// };



// /* ======================================================
//    BROKER FETCH FUNCTIONS
// ====================================================== */
// const fetchAngelOrders1 = async (user) => {
//   if (!user.authToken) return [];

//   const res = await axios.get(
//     "https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/getOrderBook",
//     {
//       headers: {
//         Authorization: `Bearer ${user.authToken}`,
//         "Content-Type": "application/json",
//         Accept: "application/json",
//         "X-UserType": "USER",
//         "X-SourceID": "WEB",
//         "X-ClientLocalIP": process.env.CLIENT_LOCAL_IP,
//         "X-ClientPublicIP": process.env.CLIENT_PUBLIC_IP,
//         "X-MACAddress": process.env.MAC_Address,
//         "X-PrivateKey": process.env.PRIVATE_KEY,
//       },
//     }
//   );

//   return (res.data?.data || [])
//     .filter(o => o.status === "complete")
//     .map(o => ({
//       broker: "angelone",
//       tradingsymbol: o.tradingsymbol,
//       transactiontype: o.transactiontype, // BUY / SELL
//       quantity: Number(o.filledshares),
//       price: Number(o.averageprice),
//       orderid: o.orderid,
//     }));
// };


// const fetchKiteOrders1 = async (user) => {
//   const kite = await getKiteClientForUserId(user.id);
//   const orders = await kite.getOrders();

//   return (orders || [])
//     .filter(o => o.status === "COMPLETE")
//     .map(o => ({
//       broker: "kite",
//       tradingsymbol: o.tradingsymbol,
//       transactiontype: o.transaction_type, // BUY / SELL
//       quantity: Number(o.filled_quantity),
//       price: Number(o.average_price),
//       orderid: o.order_id,
//     }));
// };




