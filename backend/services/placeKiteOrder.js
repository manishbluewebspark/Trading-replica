// services/kite/placeKiteOrder.js

import { setKiteAccessToken, kite } from "../utils/kiteClient.js";
import Order from "../models/orderModel.js";
import { Op } from "sequelize";

function getKiteProductCode(type) {
  if (!type) return ""; // handle empty or undefined
  switch (type.toUpperCase()) {
    case "INTRADAY":
      return "MIS"; // Kite code for intraday
    case "DELIVERY":
      return "CNC"; // Kite code for delivery
    default:
      return type; // fallback
  }
}

function mapVarietyToKite(variety) {
  if (!variety) return "regular"; // default

  switch (variety.toUpperCase()) {
    case "NORMAL":
      return "regular"; // Regular order
    case "STOPLOSS":
      return "co"; // Cover order (SL)
    case "ROBO":
      return "iceberg"; // Bracket order (ROBO)
    default:
      return "regular"; // fallback
  }
}

export const placeKiteOrder = async (user, reqInput, startOfDay, endOfDay) => {
  try {

    // 1) Set access token
    await setKiteAccessToken(user.authToken);

    const kiteProductType = await getKiteProductCode( reqInput.productType);

    const kiteVerity = await mapVarietyToKite(reqInput.variety)

    // ----------------------------------------
    // 2) CREATE LOCAL PENDING ORDER
    // ----------------------------------------
    const orderData = {
      symboltoken:reqInput.token,
      variety:kiteVerity || "regular",    // mistage in fields 
      tradingsymbol: reqInput.symbol,
      instrumenttype:reqInput.instrumenttype,
      transactiontype: reqInput.transactiontype,
      exchange: reqInput.exch_seg,
      ordertype: reqInput.orderType,
      quantity: reqInput.quantity,
      product: kiteProductType,
      price: reqInput.price,
      orderstatuslocaldb: "PENDING",
      userId: user.id,
      totalPrice: reqInput.totalPrice,
      actualQuantity: reqInput.actualQuantity,
    };

    const newOrder = await Order.create(orderData);

    // ----------------------------------------
    // 3) KITE PAYLOAD
    // ----------------------------------------
    const orderParams = {
      exchange: reqInput.exch_seg,
      tradingsymbol: reqInput.symbol,
      transaction_type: reqInput.transactiontype,
      quantity: Number(reqInput.quantity),
      product:kiteProductType,  // DELIVERY.                // mistake in fields 
      order_type: reqInput.orderType,
      price: reqInput.price,
    };


    

    // ----------------------------------------
    // 4) PLACE ORDER IN KITE
    // ----------------------------------------
    let placeRes;
    try {

    placeRes = await kite.placeOrder(orderData.variety, orderParams);

    } catch (err) {

      await newOrder.update({ orderstatuslocaldb: "FAILED",status:"FAILED",text:err.message });

      return {
        userId: user.id,
        broker: "Kite",
        result: "BROKER_REJECTED",
        message: err.message,
      };
    }

    const orderid = placeRes.order_id;

    // save order id
    await newOrder.update({ orderid });

    // ----------------------------------------
    // 5) GET ORDER DETAILS FROM KITE
    // ----------------------------------------
    let detailsData = {};
    try {
        
      const detailRes = await kite.getOrderHistory(orderid);

      if (Array.isArray(detailRes) && detailRes.length > 0) {

        const last = detailRes[detailRes.length - 1];

        detailsData = last; // store full details
      }
    } catch (e) {
       console.log(e,'get order histry');
      // details optional
    }

    // ----------------------------------------
    // 6) HANDLE BUY / SELL LOGIC
    // ----------------------------------------
    let finalStatus = "OPEN";
    let buyOrder
    
    // If SELL → close all BUY orders today
    if (reqInput.transactiontype === "SELL") {

       buyOrder = await Order.findOne({
          where: {
             userId: user.id,
            tradingsymbol: reqInput.symbol,
            exchange: reqInput.exch_seg,
            transactiontype: "BUY",
            orderstatuslocaldb: "OPEN",
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

    // ----------------------------------------
    // 7) UPDATE LOCAL ORDER WITH FINAL STATUS
    // ----------------------------------------

    await newOrder.update({
      ...detailsData,
      uniqueorderid:detailsData.exchange_order_id,
      exchorderupdatetime:detailsData.exchange_update_timestamp,
       exchtime:detailsData.exchange_timestamp,
      updatetime:detailsData.order_timestamp,
       text:detailsData.status_message,
       averageprice:detailsData.average_price,
       lotsize:detailsData.quantity,
       symboltoken:reqInput.token,
       disclosedquantity:detailsData.disclosed_quantity,
      triggerprice:detailsData.trigger_price,
      price:detailsData.average_price,
      duration:detailsData.validity,
      producttype:detailsData.product,
      orderstatuslocaldb: finalStatus,
    });

    // ----------------------------------------
    // 8) (OPTIONAL) TRADES FETCH
    // ----------------------------------------
    try {
      const trades = await kite.getOrderTrades(orderid);

      if (Array.isArray(trades) && trades.length > 0) {
        const t = trades[0];

        const buyPrice  = buyOrder?.fillprice     || 0;
        const buySize   = buyOrder?.fillsize      || 0;
        const buyValue  = buyOrder?.tradedValue   || 0;
        

        // Calculate PNL safely
        let  pnl = (t.quantity * t.average_price) - (buyPrice * buySize);

           
         if(t.transaction_type==='BUY') {
             pnl = 0
         }
         

          // Update order
          await newOrder.update({
            tradedValue: t.average_price * t.quantity,
            fillprice: t.average_price,
            fillsize: t.quantity,
            fillid: t.trade_id,
            // filltime: t.fill_timestamp,
            status: "COMPLETE",
            pnl: pnl,
            buyprice: buyPrice,
            buysize: buySize,
            buyvalue: buyValue,
          });
      }
    } catch (e) {
        console.log(e,'get order trade');
        
    }

    return {
      userId: user.id,
      broker: "Kite",
      result: "SUCCESS",
      orderid,
    };
  } catch (err) {

    console.log(err,'err');
    
    return {
      userId: user.id,
      broker: "Kite",
      result: "ERROR",
      message: err.message,
    };
  }
};
