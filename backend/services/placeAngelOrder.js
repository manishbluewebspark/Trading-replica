// services/angel/placeAngelOrder.js
import axios from "axios";
import { Op } from "sequelize";
import Order from "../models/orderModel.js";

// -----------------------
// API ENDPOINTS
// -----------------------
const ANGEL_ONE_PLACE_URL =
  "https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/placeOrder";

const ANGEL_ONE_DETAILS_URL = (uniqueId) =>
  `https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/details/${uniqueId}`;

const ANGEL_ONE_TRADE_BOOK_URL =
  "https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/getTradeBook";

// -----------------------
// COMMON HEADERS
// -----------------------
const angelHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
  Accept: "application/json",
  "X-UserType": "USER",
  "X-SourceID": "WEB",
  "X-ClientLocalIP": "127.0.0.1",
  "X-ClientPublicIP": "127.0.0.1",
  "X-MACAddress": "00-00-00-00-00-00",
  "X-PrivateKey": process.env.PRIVATE_KEY,
});

// -----------------------
// SAFE ERROR MESSAGE
// -----------------------
const safeErr = (err) => err?.response?.data || err?.message || err.toString();

// -----------------------
// MAIN LOGIC
// -----------------------
export const placeAngelOrder = async (user, reqInput, startOfDay, endOfDay) => {
  try {
    // 1) Prepare local order data
    const orderData = {
      variety: reqInput.variety,
      tradingsymbol: reqInput.symbol,
      symboltoken: reqInput.token,
      transactiontype: reqInput.transactiontype,
      exchange: reqInput.exch_seg,
      ordertype: reqInput.orderType,
      quantity: reqInput.quantity,
      producttype: reqInput.productType,
      duration: reqInput.duration,
      price: reqInput.price,
      squareoff: "0",
      stoploss: "0",
      orderstatuslocaldb: "PENDING",
      userId: user.id,
      totalPrice: reqInput.totalPrice,
      actualQuantity: reqInput.actualQuantity,
    };

    // 2) Save pending order locally
    const newOrder = await Order.create(orderData);

    // 3) Call Angel: PLACE ORDER
    const placeRes = await axios.post(ANGEL_ONE_PLACE_URL, orderData, {
      headers: angelHeaders(user.authToken),
    });

    if (placeRes.data?.status !== true) {
      await newOrder.update({ orderstatuslocaldb: "FAILED",status:'FAILED',text:'Order rejected by AngelOne' });
      return {
        userId: user.id,
        broker: "AngelOne",
        result: "BROKER_REJECTED",
        message: placeRes.data?.message || "Order rejected by AngelOne",
      };
    }

    // Extract IDs
    const orderid = placeRes?.data?.data?.orderid;
    const uniqueOrderId = placeRes?.data?.data?.uniqueorderid;

    await newOrder.update({ orderid, uniqueorderid: uniqueOrderId });

    // ---------------------------
    // 4) Get ORDER DETAILS
    // ---------------------------
    let detailsData = null;

    try {
      const det = await axios.get(ANGEL_ONE_DETAILS_URL(uniqueOrderId), {
        headers: angelHeaders(user.authToken),
      });

      if (det.data?.status === true) {
        detailsData = det.data.data;
      }
    } catch (e) {
      return {
        userId: user.id,
        broker: "AngelOne",
        result: "PLACED_NO_DETAILS",
        orderid,
        uniqueOrderId,
        error: safeErr(e),
      };
    }

    // BUY → just mark OPEN
    // SELL → close opposite BUY trades for today
    let finalStatus = "OPEN";
    let buyOrder

    if (reqInput.transactiontype === "SELL") {


       buyOrder = await Order.findOne({
              where: {
                userId: user.id,
                variety: reqInput.variety,
                tradingsymbol: reqInput.symbol,
                symboltoken: reqInput.token,
                exchange: reqInput.exch_seg,
                ordertype: reqInput.orderType,
                orderstatuslocaldb:"OPEN",
                transactiontype: "BUY",
                createdAt: { [Op.between]: [startOfDay, endOfDay] },
              },
              raw: true
            });

        if (buyOrder) {
        await Order.update(
          { orderstatuslocaldb: "COMPLETE" },
          { where: { id: buyOrder.id } }
        );
      }

      
      finalStatus = "COMPLETE";
    }

    // Update newOrder with broker order details
    await newOrder.update({ ...detailsData, orderstatuslocaldb: finalStatus });

    // ---------------------------
    // 5) Fetch TRADE BOOK
    // ---------------------------
    try {
      
      const tradeRes = await axios.get(ANGEL_ONE_TRADE_BOOK_URL, {
        headers: angelHeaders(user.authToken),
      });

      if (tradeRes.data?.status === true && Array.isArray(tradeRes.data.data)) {

        const matched = tradeRes.data.data.find((t) => t.orderid === orderid);

         const buyPrice  = buyOrder?.fillprice     || 0;
        const buySize   = buyOrder?.fillsize      || 0;
        const buyValue  = buyOrder?.tradedValue   || 0;


        let pnl = (matched.fillsize*matched.fillprice)-(buyPrice*buySize)

          if(t.transaction_type==='BUY') {
             pnl = 0
         }

        if (matched) {
          await newOrder.update({
            tradedValue: matched.tradevalue,
            fillprice: matched.fillprice,
            fillsize: matched.fillsize,
            filltime: matched.filltime,
            fillid: matched.fillid,
            pnl:pnl,
            buyprice:buyPrice,
            buysize:buySize,
            buyvalue:buyValue,
          });
        }
      }
    } catch (e) {
      // Trade book is optional — continue
    }

    // SUCCESS
    return {
      userId: user.id,
      broker: "AngelOne",
      result: "SUCCESS",
      orderid,
      uniqueOrderId,
    };
  } catch (err) {
    return {
      userId: user.id,
      broker: "AngelOne",
      result: "ERROR",
      message: safeErr(err),
    };
  }
};
