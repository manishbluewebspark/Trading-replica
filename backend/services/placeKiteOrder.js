import { getKiteClientForUserId } from "../services/userKiteBrokerService.js";
import Order from "../models/orderModel.js";
import { logSuccess, logError } from "../utils/loggerr.js";



// -------------------- MAPPERS --------------------
function getKiteProductCode(type) {
  if (!type) return "";
  switch (type.toUpperCase()) {
    case "DELIVERY": return "CNC";
    case "CARRYFORWARD": return "NRML";
    case "MARGIN": return "MTF";
    case "INTRADAY": return "MIS";
    case "BO": return "MIS";
    default: return type.toUpperCase();
  }
}

function mapVarietyToKite(variety) {
  if (!variety) return "regular";
  switch (variety.toUpperCase()) {
    case "NORMAL": return "regular";
    case "STOPLOSS": return "co";
    case "ROBO": return "iceberg";
    default: return "regular";
  }
}

// -------------------- HELPERS --------------------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchTradesWithRetry(kite, orderid, req, retries = 3, delayMs = 1200) {
  for (let i = 1; i <= retries; i++) {
    try {
      const trades = await kite.getOrderTrades(orderid);
      logSuccess(req, {
        msg: "Kite getOrderTrades retry",
        attempt: i,
        orderid,
        tradesCount: Array.isArray(trades) ? trades.length : 0,
      });
      if (Array.isArray(trades) && trades.length > 0) return trades;
    } catch (e) {
      logError(req, e, { msg: "Kite getOrderTrades failed", attempt: i, orderid });
    }
    if (i < retries) await sleep(delayMs);
  }
  return [];
}

async function findBuyOrderForSell({ userId, reqInput, req }) {
  if (reqInput?.buyOrderId) {
    const buyOrder = await Order.findOne({
      where: {
        userId,
        orderid: String(reqInput.buyOrderId),
        transactiontype: "BUY",
        status: "COMPLETE",
        orderstatuslocaldb: "OPEN",
      },
      raw: true,
    });
    logSuccess(req, { msg: "BUY match by buyOrderId", buyOrderId: reqInput.buyOrderId, found: !!buyOrder });
    if (buyOrder) return buyOrder;
  }

}

// Calculate weighted average price from trades
function calculateWeightedAveragePrice(trades) {
  let totalValue = 0;
  let totalQuantity = 0;

  trades.forEach(trade => {
    totalValue += trade.average_price * trade.quantity;
    totalQuantity += trade.quantity;
  });

  return totalValue / totalQuantity;
}

// ======================================================================
// ✅ Unified placeKiteOrder (handles both mapped and direct inputs)
// ======================================================================
export const placeKiteOrder = async (user, reqInput, req, useMappings = true) => {
  
  let newOrder = null;
   let orderExitstingOrNot = false
  
  const nowISOError = new Date().toISOString();

  try {

    logSuccess(req, { msg: "Kite order flow started", userId: user?.id, reqInput });

    // 1) Kite instance
    const kite = await getKiteClientForUserId(user.id);
    logSuccess(req, { msg: "Kite client created", userId: user.id });

    // 2) Mappings (if required)
    const kiteProductType = useMappings ? getKiteProductCode(reqInput.productType) : reqInput.productType;
    logSuccess(req, { msg: "Mapped product type", input: reqInput.productType, kiteProductType });

    const kiteVariety = useMappings ? mapVarietyToKite(reqInput.variety) : reqInput.variety;
    logSuccess(req, { msg: "Mapped order variety", input: reqInput.variety, kiteVariety });

    // 3) Local pending order
    const orderData = {
      symboltoken: reqInput.kiteToken || reqInput.token,
      variety: kiteVariety || "regular",
      tradingsymbol: reqInput.kiteSymbol || reqInput.symbol,
      instrumenttype: reqInput.instrumenttype,
      transactiontype: (reqInput.transactiontype || "").toUpperCase(),
      exchange: reqInput.exch_seg,
      ordertype: reqInput.orderType,
      quantity: String(reqInput.quantity),
      producttype: kiteProductType,
      price: Number(reqInput.price || 0),
      orderstatuslocaldb: "PENDING",
       ordertag:"softwaresetu",
      totalPrice: reqInput.totalPrice ?? null,
      actualQuantity: reqInput.actualQuantity ?? null,
      userId: user.id,
      broker: "kite",
      angelOneSymbol: reqInput.angelOneSymbol || reqInput.symbol,
      angelOneToken: reqInput.angelOneToken || reqInput.token,
      userNameId: user.username,
      buyOrderId: reqInput?.buyOrderId || null,
      strategyName:reqInput?.groupName||"",
      strategyUniqueId:reqInput?.strategyUniqueId||""
    };


     // 2️⃣ Check existing OPEN/PENDING order for same symbol
    newOrder = await Order.findOne({
      where: {
        userId: user.id,
        tradingsymbol: reqInput.symbol,
        transactiontype: reqInput.transactiontype,
        orderstatuslocaldb: ["PENDING", "OPEN"],
      },
    });

    if (newOrder) {
      // ✅ UPDATE instead of CREATE
      const newQty = Number(newOrder.quantity || 0) + Number(reqInput.quantity);
      const newTradeValue =
        Number(newOrder.tradedValue || 0) +
        Number(reqInput.quantity) * Number(reqInput.price || 0);

      const newAvgPrice =
        newQty > 0 ? newTradeValue / newQty : newOrder.price;

      await newOrder.update({
        totalPrice: newTradeValue,
      });

      logSuccess(req, {
        msg: "Existing order updated (same tradingsymbol)",
        orderId: newOrder.id,
        newQty,
        newAvgPrice,
      });
      orderExitstingOrNot = true
    } else {
      //  Only here CREATE
      newOrder = await Order.create(orderData);

      logSuccess(req, {
        msg: "New local order created",
        localOrderId: newOrder.id,
      });
    }


    logSuccess(req, { msg: "Prepared local order object", orderData });
    // newOrder = await Order.create(orderData);
    logSuccess(req, { msg: "Local order saved", localRowId: newOrder.id });

    // 4) Kite payload
    const orderParams = {
      exchange: reqInput.exch_seg,
      tradingsymbol: reqInput.kiteSymbol || reqInput.symbol,
      transaction_type: (reqInput.transactiontype || "").toUpperCase(),
      quantity: Number(reqInput.quantity),
      product: kiteProductType,
      tag:"softwaresetu",
      order_type: reqInput.orderType,
      price: Number(reqInput.price || 0),
      market_protection: 5,
    };

    logSuccess(req, { msg: "Prepared Kite payload", orderParams });

    // 5) Place order
    let placeRes;
    try {

      placeRes = await kite.placeOrder(orderData.variety, orderParams);
 
      logSuccess(req, { msg: "Kite order placed", placeRes });
    } catch (err) {

      logError(req, err, { msg: "Kite order placement failed" });

      await newOrder.update({
        orderstatuslocaldb: "FAILED",
        status: "FAILED",
        positionStatus: "FAILED",
        text: err?.message || "Kite order placement failed",
        buyTime: nowISOError,
        filltime: nowISOError,
      });
      return { userId: user.id, broker: "Kite", result: "BROKER_REJECTED", message: err?.message };
    }

    const orderid = placeRes?.order_id;
    await newOrder.update({ orderid });
    logSuccess(req, { msg: "Order ID saved locally", orderid });

    // 6) Fetch trades
    const trades = await fetchTradesWithRetry(kite, orderid, req, 3, 1200);
    if (trades.length === 0) {
      logSuccess(req, { msg: "No trades found after retries", orderid });
      return { userId: user.id, broker: "Kite", result: "SUCCESS", orderid };
    }

    logSuccess(req, { msg: "Fetched trades", orderid, trades: trades });

    //  logSuccess(req, { msg: "Fetched trades", orderid, tradesCount: trades.length });

    // 7) Calculate weighted average price
    const weightedAvgPrice = calculateWeightedAveragePrice(trades);
    const totalFilledQty = trades.reduce((sum, trade) => sum + trade.quantity, 0);

    logSuccess(req, {
      msg: "Calculated weighted average price",
      orderid,
      weightedAvgPrice,
      totalFilledQty,
    });

    // 8) SELL pairing
    let buyOrder = null;
    let finalStatus = "OPEN";
    let positionStatus = "OPEN"
    let buyOrderId = 'NA'
    const txType = (reqInput.transactiontype || "").toUpperCase();

    if (txType === "SELL") {
      buyOrder = await findBuyOrderForSell({ userId: user.id, reqInput, req });
      if (buyOrder) {
        await Order.update(
          { 
             orderstatuslocaldb: "COMPLETE",
             positionStatus:"COMPLETE",
           },
          { where: { id: buyOrder.id } }
        );
        logSuccess(req, { msg: "BUY order marked COMPLETE", buyOrderDbId: buyOrder.id,findByObject:buyOrder });
      }
      finalStatus = "COMPLETE";
      positionStatus = "COMPLETE";
      buyOrderId = buyOrder?.orderid || 'NA'
    }

    // 9) Calculate PnL
    const buyPrice = Number(buyOrder?.fillprice || 0);
    const buyQty = Number(buyOrder?.fillsize || 0);
    const buyValue = Number(buyOrder?.tradedValue || 0);
    let buyTime = buyOrder?.filltime || "NA";

    let pnl = ((weightedAvgPrice * totalFilledQty) - (buyPrice * buyQty));
    if (txType === "BUY") {
      pnl = 0;
      buyTime = "NA";
    }

    logSuccess(req, {
      msg: "Calculated PnL",
      orderid,
      pnl,
      weightedAvgPrice,
      totalFilledQty,
      buyPrice,
      buyQty,
    });





    if(orderExitstingOrNot) {

        // 🔑 Existing fillsize already stored
       const existingFillSize = Number(newOrder.fillsize || 0);
      //  const existingFillPrice = Number(newOrder.fillprice || 0);
       const existingFillTradedValue = Number(newOrder.tradedValue || 0);

      

       const newQty = totalFilledQty
      //  const newPrice = avgPrice
       const newFillId = trades[0].trade_id
       const newTradeValue =  weightedAvgPrice * totalFilledQty



        const UpdateNewQty = existingFillSize + newQty
        const UpdateNewTradeValue = existingFillTradedValue+newTradeValue
        const UpdateNewPrice =  UpdateNewTradeValue/UpdateNewQty


      await newOrder.update({

        tradedValue: UpdateNewTradeValue,
        price: UpdateNewPrice,
        fillprice:UpdateNewPrice,
        fillsize: UpdateNewQty,
        quantity:UpdateNewQty,
        fillid: newFillId,
      });

      logSuccess(req, { msg: "Trade matched & order finalized", pnl });

       }else{

      await newOrder.update({
        tradedValue:  weightedAvgPrice * totalFilledQty,
        price: weightedAvgPrice,
        fillprice:weightedAvgPrice,
        fillsize: totalFilledQty,
        filltime: trades[0].fill_timestamp ? new Date(trades[0].fill_timestamp).toISOString() : null,
        fillid: trades[0].trade_id || null,
        pnl,
        buyOrderId: buyOrderId,
        buyTime,
        buyprice: buyPrice,
        buysize: buyQty,
        buyvalue: buyValue,
        positionStatus:positionStatus,
        status: "COMPLETE",
        orderstatuslocaldb: finalStatus, // ✅ SELL => COMPLETE, BUY => OPEN/COMPLETE based on your logic
      });

      logSuccess(req, { msg: "Trade matched & order finalized", pnl });

    }


    // // 10) Update order in DB
    // await newOrder.update({
    //   tradedValue: weightedAvgPrice * totalFilledQty,
    //   fillprice: weightedAvgPrice,
    //   price:weightedAvgPrice,
    //   fillsize: totalFilledQty,
    //   fillid: trades[0].trade_id || null,
    //   uniqueorderid: trades[0].exchange_order_id,
    //   buyOrderId: buyOrderId,
    //   filltime: trades[0].fill_timestamp ? new Date(trades[0].fill_timestamp).toISOString() : null,
    //   status: "COMPLETE",
    //   orderstatuslocaldb:finalStatus,
    //   positionStatus:positionStatus,
    //   pnl,
    //   buyTime,
    //   buyprice: buyPrice,
    //   buysize: buyQty,
    //   buyvalue: buyValue,
    // });

    // logSuccess(req, { msg: "Final order updated in DB", orderid });
    return { userId: user.id, broker: "Kite", result: "SUCCESS", orderid };
  } catch (err) {
    logError(req, err, { msg: "Unexpected Kite order failure" });
    try {
      if (newOrder?.id) {
        await newOrder.update({
          orderstatuslocaldb: "FAILED",
          status: "FAILED",
           positionStatus: "FAILED",
          text: err?.message || "Unexpected error",
         buyTime: nowISOError,
        filltime: nowISOError,
        });
      }
    } catch (e2) {

      logError(req, e2, { msg: "Failed to mark local order FAILED in catch" });
    }
    return { userId: user?.id, broker: "Kite", result: "ERROR", message: err?.message };
  }
};
















// import { getKiteClientForUserId } from "../services/userKiteBrokerService.js";
// import Order from "../models/orderModel.js";
// import { logSuccess, logError } from "../utils/loggerr.js";

// // -------------------- MAPPERS --------------------
// function getKiteProductCode(type) {
//   if (!type) return "";
//   switch (type.toUpperCase()) {
//     case "DELIVERY": return "CNC";
//     case "CARRYFORWARD": return "NRML";
//     case "MARGIN": return "MTF";
//     case "INTRADAY": return "MIS";
//     case "BO": return "MIS";
//     default: return type.toUpperCase();
//   }
// }

// function mapVarietyToKite(variety) {
//   if (!variety) return "regular";
//   switch (variety.toUpperCase()) {
//     case "NORMAL": return "regular";
//     case "STOPLOSS": return "co";
//     case "ROBO": return "iceberg";
//     default: return "regular";
//   }
// }

// // -------------------- HELPERS --------------------
// const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// async function fetchTradesWithRetry(kite, orderid, req, retries = 3, delayMs = 1200) {
//   for (let i = 1; i <= retries; i++) {
//     try {
//       const trades = await kite.getOrderTrades(orderid);
//       logSuccess(req, {
//         msg: "Kite getOrderTrades retry",
//         attempt: i,
//         orderid,
//         tradesCount: Array.isArray(trades) ? trades.length : 0,
//       });
//       if (Array.isArray(trades) && trades.length > 0) return trades;
//     } catch (e) {
//       logError(req, e, { msg: "Kite getOrderTrades failed", attempt: i, orderid });
//     }
//     if (i < retries) await sleep(delayMs);
//   }
//   return [];
// }

// async function findBuyOrderForSell({ userId, reqInput, req }) {
//   // ✅ 1) best: buyOrderId
//   if (reqInput?.buyOrderId) {
//     const buyOrder = await Order.findOne({
//       where: {
//         userId,
//         orderid: String(reqInput.buyOrderId),
//         transactiontype: "BUY",
//         status: "COMPLETE",
//       },
//       raw: true,
//     });
//     logSuccess(req, { msg: "BUY match by buyOrderId", buyOrderId: reqInput.buyOrderId, found: !!buyOrder });
//     if (buyOrder) return buyOrder;
//   }

//   // ✅ 2) fallback: symbol + exchange + qty + OPEN
//   const buyOrder2 = await Order.findOne({
//     where: {
//       userId,
//       tradingsymbol: reqInput.kiteSymbol || reqInput.symbol,
//       exchange: reqInput.exch_seg,
//       quantity: String(reqInput.quantity),
//       transactiontype: "BUY",
//       status: "COMPLETE",
//       orderstatuslocaldb: "OPEN",
//     },
//     order: [["createdAt", "DESC"]],
//     raw: true,
//   });

//   logSuccess(req, {
//     msg: "BUY match by fallback symbol/exchange/qty",
//     found: !!buyOrder2,
//     symbol: reqInput.kiteSymbol || reqInput.symbol,
//     exchange: reqInput.exch_seg,
//     qty: reqInput.quantity,
//   });

//   return buyOrder2 || null;
// }

// // ======================================================================
// // ✅ Unified placeKiteOrder (handles both mapped and direct inputs)
// // ======================================================================
// export const placeKiteOrder = async (user, reqInput,req, useMappings = true) => {
//   let newOrder = null;
//   try {
//     logSuccess(req, { msg: "Kite order flow started", userId: user?.id, reqInput });

//     // 1) Kite instance
//     const kite = await getKiteClientForUserId(user.id);
//     logSuccess(req, { msg: "Kite client created", userId: user.id });

//     // 2) Mappings (if required)
//     const kiteProductType = useMappings ? getKiteProductCode(reqInput.productType) : reqInput.productType;
//     logSuccess(req, { msg: "Mapped product type", input: reqInput.productType, kiteProductType });

//     const kiteVariety = useMappings ? mapVarietyToKite(reqInput.variety) : reqInput.variety;
//     logSuccess(req, { msg: "Mapped order variety", input: reqInput.variety, kiteVariety });

//     // 3) Local pending order
//     const orderData = {
//       symboltoken: reqInput.kiteToken || reqInput.token,
//       variety: kiteVariety || "regular",
//       tradingsymbol: reqInput.kiteSymbol || reqInput.symbol,
//       instrumenttype: reqInput.instrumenttype,
//       transactiontype: (reqInput.transactiontype || "").toUpperCase(),
//       exchange: reqInput.exch_seg,
//       ordertype: reqInput.orderType,
//       quantity: String(reqInput.quantity),
//       producttype: kiteProductType,
//       price: Number(reqInput.price || 0),
//       orderstatuslocaldb: "PENDING",
//       totalPrice: reqInput.totalPrice ?? null,
//       actualQuantity: reqInput.actualQuantity ?? null,
//       userId: user.id,
//       broker: "kite",
//       angelOneSymbol: reqInput.angelOneSymbol || reqInput.symbol,
//       angelOneToken: reqInput.angelOneToken || reqInput.token,
//       userNameId: user.username,
//       buyOrderId: reqInput?.buyOrderId || null,
//     };

//     logSuccess(req, { msg: "Prepared local order object", orderData });
//     newOrder = await Order.create(orderData);
//     logSuccess(req, { msg: "Local order saved", localRowId: newOrder.id });

//     // 4) Kite payload
//     const orderParams = {
//       exchange: reqInput.exch_seg,
//       tradingsymbol: reqInput.kiteSymbol || reqInput.symbol,
//       transaction_type: (reqInput.transactiontype || "").toUpperCase(),
//       quantity: Number(reqInput.quantity),
//       product: kiteProductType,
//       order_type: reqInput.orderType,
//       price: Number(reqInput.price || 0),
//       market_protection: 5,
//     };

//     logSuccess(req, { msg: "Prepared Kite payload", orderParams });

//     // 5) Place order
//     let placeRes;
//     try {
//       placeRes = await kite.placeOrder(orderData.variety, orderParams);
//       logSuccess(req, { msg: "Kite order placed", placeRes });
//     } catch (err) {
//       logError(req, err, { msg: "Kite order placement failed" });
//       await newOrder.update({
//         orderstatuslocaldb: "FAILED",
//         status: "FAILED",
//         text: err?.message || "Kite order placement failed",
//         buyTime: new Date().toISOString(),
//         filltime: new Date().toISOString(),
//       });
//       return { userId: user.id, broker: "Kite", result: "BROKER_REJECTED", message: err?.message };
//     }

//     const orderid = placeRes?.order_id;
//     await newOrder.update({ orderid });
//     logSuccess(req, { msg: "Order ID saved locally", orderid });

//     // 6) Fetch trades (no snapshot)
//     const trades = await fetchTradesWithRetry(kite, orderid, req, 3, 1200);
//     const trade = trades.length ? trades[0] : null;

//     if (trade) logSuccess(req, { msg: "Using trade[0]", trade });

//     // 7) SELL pairing
//     let buyOrder = null;
//     let finalStatus = "OPEN";
//     const txType = (reqInput.transactiontype || "").toUpperCase();

//     if (txType === "SELL") {
//       buyOrder = await findBuyOrderForSell({ userId: user.id, reqInput, req });
//       if (buyOrder) {
//         await Order.update(
//           { orderstatuslocaldb: "COMPLETE" },
//           { where: { id: buyOrder.id } }
//         );
//         logSuccess(req, { msg: "BUY order marked COMPLETE", buyOrderDbId: buyOrder.id });
//       }
//       finalStatus = "COMPLETE";
//     }

//     // 8) Update from trade (if exists)
//     if (trade) {
//       const tradePrice = Number(trade.average_price || 0);
//       const tradeQty = Number(trade.quantity || 0);

//       const buyPrice = Number(buyOrder?.fillprice || 0);
//       const buyQty = Number(buyOrder?.fillsize || 0);
//       const buyValue = Number(buyOrder?.tradedValue || 0);
//       let buyTime = buyOrder?.filltime || "NA";

//       let pnl = tradePrice * tradeQty - buyPrice * buyQty;
//       if (String(trade.transaction_type || "").toUpperCase() === "BUY") {
//         pnl = 0;
//         buyTime = "NA";
//       }

//       logSuccess(req, { msg: "Calculated PnL", orderid, pnl, tradePrice, tradeQty, buyPrice, buyQty });

//       await newOrder.update({
//         tradedValue: tradePrice * tradeQty,
//         fillprice: tradePrice,
//         fillsize: tradeQty,
//         fillid: trade.trade_id || null,
//         filltime: trade.fill_timestamp ? new Date(trade.fill_timestamp).toISOString() : null,
//         status: "COMPLETE",
//         pnl,
//         buyTime,
//         buyprice: buyPrice,
//         buysize: buyQty,
//         buyvalue: buyValue,
//       });

//       logSuccess(req, { msg: "Final order updated in DB using trade", orderid });
//     } else {
//       logSuccess(req, { msg: "No trade found after retries (non-fatal)", orderid });
//     }

//     logSuccess(req, { msg: "Kite order flow completed", orderid });
//     return { userId: user.id, broker: "Kite", result: "SUCCESS", orderid };
//   } catch (err) {
//     logError(req, err, { msg: "Unexpected Kite order failure" });
//     try {
//       if (newOrder?.id) {
//         await newOrder.update({
//           orderstatuslocaldb: "FAILED",
//           status: "FAILED",
//           text: err?.message || "Unexpected error",
//           buyTime: new Date().toISOString(),
//         });
//       }
//     } catch (e2) {
//       logError(req, e2, { msg: "Failed to mark local order FAILED in catch" });
//     }
//     return { userId: user?.id, broker: "Kite", result: "ERROR", message: err?.message };
//   }
// };