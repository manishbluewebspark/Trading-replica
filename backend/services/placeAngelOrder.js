
import axios from "axios";
import Order from "../models/orderModel.js";
import { logSuccess, logError } from "../utils/loggerr.js";


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
// HEADERS
// -----------------------



const angelHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
  "Accept": "application/json",
  "X-UserType": "USER",
  "X-SourceID": "WEB",
  'X-ClientLocalIP': process.env.CLIENT_LOCAL_IP, 
  'X-ClientPublicIP': process.env.CLIENT_PUBLIC_IP, 
  'X-MACAddress': process.env.MAC_Address, 
  'X-PrivateKey': process.env.PRIVATE_KEY, 
});

const safeErr = (e) => ({
  message: e?.message,
  status: e?.response?.status,
  data: e?.response?.data,
});






// =======================logger code =========================
export const placeAngelOrder = async (user, reqInput, req) => {
  
  let newOrder = null;

   const nowISOError = new Date().toISOString();

  try {
    logSuccess(req, {
      msg: "AngelOne order flow started",
      userId: user?.id,
      reqInput,
    });

    // 1️⃣ Prepare local order
    const orderData = {
      variety: reqInput.variety||'NORMAL',
      tradingsymbol: reqInput.symbol,
      instrumenttype: reqInput.instrumenttype,
      symboltoken: reqInput.token,
      transactiontype: (reqInput.transactiontype || "").toUpperCase(),
      exchange: reqInput.exch_seg,
      ordertype: reqInput.orderType,
      quantity: String(reqInput.quantity),
      producttype: reqInput.productType,
      duration: reqInput.duration,
      price: reqInput.price || "0",
      squareoff: "0",
      stoploss: "0",
      orderstatuslocaldb: "PENDING",
      totalPrice: reqInput.totalPrice ?? null,
      actualQuantity: reqInput.actualQuantity ?? null,
      userId: user.id,
      userNameId: user.username,
      broker: "angelone",
      angelOneSymbol: reqInput.angelOneSymbol || reqInput.symbol,
      angelOneToken: reqInput.angelOneToken || reqInput.token,
      buyOrderId: reqInput?.buyOrderId || null,
      strategyName:reqInput?.groupName||"",
      strategyUniqueId:reqInput?.strategyUniqueId||""
    };

    
    

    logSuccess(req, { msg: "Prepared local AngelOne order", orderData });

    // 2️⃣ Save locally
    newOrder = await Order.create(orderData);
    logSuccess(req, { msg: "Local order saved", localOrderId: newOrder.id });

    // 3️⃣ Place AngelOne Order
    let placeRes;
    try {

      const brokerPayload = {
          variety: (reqInput.variety || "NORMAL").toUpperCase(),
          tradingsymbol: reqInput.symbol,   // try "YESBANK-EQ" if needed
          symboltoken: String(reqInput.token),
          transactiontype: (reqInput.transactiontype || "").toUpperCase(),
          exchange: reqInput.exch_seg,               // "NSE" / "BSE" / "NFO"
          ordertype: (reqInput.orderType || "").toUpperCase(),   // "MARKET"
          producttype: (reqInput.productType || "").toUpperCase(), // "INTRADAY"
          duration: "DAY",                           // ✅ MUST NOT be empty :contentReference[oaicite:2]{index=2}
          price: 0,                                  // MARKET => 0
          squareoff: 0,
          stoploss: 0,
          quantity: Number(reqInput.quantity),       // ✅ send number
        };
      
      
      placeRes = await axios.post(ANGEL_ONE_PLACE_URL, brokerPayload, {
        headers: angelHeaders(user.authToken),
      });

      logSuccess(req, {
        msg: "AngelOne placeOrder response received",
        response: placeRes.data,
        brokerPayload:brokerPayload
      });
    } catch (err) {

      console.log('===============angelone=================',err.message);
      
      logError(req, err, { msg: "AngelOne placeOrder API failed" });

     

      await newOrder.update({
        orderstatuslocaldb: "FAILED",
        status: "FAILED",
        text: err?.message || "AngelOne order placement failed",
        buyTime: nowISOError,
        filltime: nowISOError,

      });

      return {
        userId: user.id,
        broker: "AngelOne",
        result: "BROKER_REJECTED",
        message: err?.message,
      };
    }

    if (placeRes.data?.status !== true) {
      logSuccess(req, {
        msg: "AngelOne rejected order",
        reason: placeRes.data?.message,
      });

      await newOrder.update({
        orderstatuslocaldb: "FAILED",
        status: "FAILED",
        text: placeRes.data?.message || "Order rejected",
        buyTime: nowISOError,
        filltime: nowISOError,
      });

      return {
        userId: user.id,
        broker: "AngelOne",
        result: "BROKER_REJECTED",
        message: placeRes.data?.message,
      };
    }

    // 4️⃣ Save broker IDs
    const orderid = placeRes.data.data.orderid;
    const uniqueOrderId = placeRes.data.data.uniqueorderid;

    await newOrder.update({ orderid, uniqueorderid: uniqueOrderId, });

    logSuccess(req, {
      msg: "AngelOne order placed successfully",
      orderid,
      uniqueOrderId,
    });

    // 5️⃣ Fetch order details
    let detailsData = null;
    try {
      const det = await axios.get(ANGEL_ONE_DETAILS_URL(uniqueOrderId), {
        headers: angelHeaders(user.authToken),
      });

      console.log(det.data,'================del================');
      

      logSuccess(req, {
        msg: "AngelOne order details response",
        details: det.data,
      });

      // 
      if (det.data?.status === true&&det.data.data.status==='complete') {
         
        detailsData = det.data.data;
      }
      
      else if(det.data.status===true&&det.data.data.status==='rejected') {

        return await newOrder.update({
           status:"REJECTED",
           orderstatus:"REJECTED",
           orderstatuslocaldb:"REJECTED",
           buyTime: nowISOError,
           filltime: nowISOError,
           text:det?.data?.data?.text||""
           });

      }else if(det.data.status===true&&det.data.data.status==='cancelled'){

        return await newOrder.update({ 
          status:"CANCELLED",
          orderstatuslocaldb:"CANCELLED",
          orderstatus:"CANCELLED",
            buyTime: nowISOError,
           filltime: nowISOError,
          text:det?.data?.data?.text||""
         });
        
      }else{

      logSuccess(req, {
        msg: "AngelOne order with check response",
        details: det.data,
      }); 
      }

    } catch (err) {
      logError(req, err, { msg: "AngelOne order details fetch failed" });
    }

    // 6️⃣ SELL pairing
    let finalStatus = "OPEN";
    let buyOrder = null;
    let buyOrderId = "NA";

    if (reqInput.transactiontype === "SELL") {
      buyOrderId = String(reqInput.buyOrderId || "NA");

      buyOrder = await Order.findOne({
        where: {
          userId: user.id,
          orderstatuslocaldb: "OPEN",
          status: "COMPLETE",
          orderid: buyOrderId,
        },
        raw: true,
      });

      logSuccess(req, {
        msg: "SELL pairing lookup",
        buyOrderFound: !!buyOrder,
        buyOrder:buyOrder
      });

      if (buyOrder) {
        await Order.update(
          { orderstatuslocaldb: "COMPLETE" },
          { where: { id: buyOrder.id } }
        );
        logSuccess(req, {
          msg: "BUY order marked COMPLETE",
          buyOrderDbId: buyOrder.id,
        });
      }

      finalStatus = "COMPLETE";
    }

     console.log(detailsData,'================detailsData================');

    // 7️⃣ Update details in DB
    if (detailsData) {
      await newOrder.update({
        status: detailsData.status,
        price:detailsData.price,
        quantity:detailsData.quantity,
        orderstatus: detailsData.orderstatus,
        variety: detailsData.variety,
        ordertype: detailsData.ordertype,
        producttype: detailsData.producttype,
        exchange: detailsData.exchange,
      });

      logSuccess(req, { msg: "Order updated with AngelOne details" });
    }

    // 8️⃣ Fetch Tradebook
    try {
      const tradeRes = await axios.get(ANGEL_ONE_TRADE_BOOK_URL, {
        headers: angelHeaders(user.authToken),
      });

       console.log(tradeRes.data,'================tradeRes================');

      logSuccess(req, {
        msg: "AngelOne tradebook response",
        count: tradeRes.data?.data,
      });

       console.log( tradeRes.data?.data?.find(
        (t) => String(t.orderid) === String(orderid)
      ),String(orderid),'================matched 1================');

      const matched = tradeRes.data?.data?.find(
        (t) => String(t.orderid) === String(orderid)
      );

        console.log(matched,'================matched================');


      if (matched) {

        console.log('hhhy 1');
        
        const buyPrice = Number(buyOrder?.fillprice || 0);
        const buyQty = Number(buyOrder?.fillsize || 0);
        const buyValue = Number(buyOrder?.tradedValue || 0);

          const buyTime = buyOrder?.filltime || 'NA'

           console.log('hhhy 2');

        let pnl =
          matched.transaction_type === "BUY"
            ? 0
            : matched.fillprice * matched.fillsize - buyPrice * buyQty;

             const createdAtDate = new Date(newOrder.createdAt);

            const [h, m, s] = matched.filltime.split(":");
            createdAtDate.setHours(h, m, s, 0);

            const fillTimeISO = createdAtDate.toISOString();

       let update2Final =  await newOrder.update({
          tradedValue: matched.tradevalue,
          price: matched.fillprice,
          fillprice: matched.fillprice,
          fillsize: matched.fillsize,
          // filltime: new Date(matched.filltime).toISOString(),
           filltime: fillTimeISO,
          fillid: matched.fillid,
          pnl,
          buyTime:buyTime,
          buyOrderId,
          buyprice: buyPrice,
          buysize: buyQty,
          buyvalue: buyValue,
          status: "COMPLETE",
          orderstatuslocaldb:finalStatus

        });

        logSuccess(req, {
          msg: "Trade matched & order finalized",
          pnl,
        });
      }
    } catch (err) {

      console.log(err,'=============final error=============');
      
      logError(req, err, { msg: "AngelOne tradebook fetch failed" });
    }

    // ✅ SUCCESS
    return {
      userId: user.id,
      broker: "AngelOne",
      result: "SUCCESS",
      orderid,
      uniqueOrderId,
    };
  } catch (err) {
    logError(req, err, { msg: "Unexpected AngelOne order failure" });

    if (newOrder?.id) {
      await newOrder.update({
        orderstatuslocaldb: "FAILED",
        status: "FAILED",
        text: err?.message || "Unexpected error",
         buyTime: nowISOError,
        filltime: nowISOError,
      });
    }

    return {
      userId: user?.id,
      broker: "AngelOne",
      result: "ERROR",
      message: err?.message,
      error: safeErr(err),
    };
  }
};



// ============= old working code====================
export const placeAngelOrder1 = async (user, reqInput,req) => {
  try {
    // 1) Prepare local order data
    const orderData = {
      variety: reqInput.variety,
      tradingsymbol: reqInput.symbol,
      instrumenttype:reqInput.instrumenttype,
      symboltoken: reqInput.token,
      transactiontype: reqInput.transactiontype,
      exchange: reqInput.exch_seg,
      ordertype: reqInput.orderType,
      quantity: reqInput.quantity,
      producttype: reqInput.productType,
      duration: reqInput.duration,
      price: reqInput.price||"0",
      squareoff: "0",
      stoploss: "0",
      orderstatuslocaldb: "PENDING",
      totalPrice: reqInput.totalPrice,
      actualQuantity: reqInput.actualQuantity,
      userId: user.id,
      userNameId: user.username,
      broker:'angelone',
      angelOneSymbol:reqInput?.angelOneSymbol||reqInput.symbol,
      angelOneToken:reqInput.angelOneToken||reqInput.token,
        buyOrderId:reqInput?.buyOrderId
    };

    // 2) Save pending order locally
    const newOrder = await Order.create(orderData);

    // 3) Call Angel: PLACE ORDER
    const placeRes = await axios.post(ANGEL_ONE_PLACE_URL, orderData, {
      headers: angelHeaders(user.authToken),
    });

    if (placeRes.data?.status !== true) {

      await newOrder.update({ orderstatuslocaldb: "FAILED",status:'FAILED',text:'Order rejected by AngelOne',
        //  filltime: new Date().toISOString().replace(/\.\d+Z$/, ".000Z"),
         buyTime:new Date().toISOString().replace(/\.\d+Z$/, ".000Z"),
       });
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
      console.log(e, ' e catch ');
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
    let buyOrderId = 'NA'
    let buyOrder

    if (reqInput.transactiontype === "SELL") {


       buyOrder = await Order.findOne({
              where: { 
            userId: user.id,
            status:"COMPLETE",
            orderstatuslocaldb: "OPEN",
            orderid:String(reqInput?.buyOrderId)
              },
              raw: true
            });

        if (buyOrder) {
        await Order.update(
          { orderstatuslocaldb: "COMPLETE" },
          { where: { id: buyOrder.id } }
        );
      }

      buyOrderId = String(reqInput?.buyOrderId)
      finalStatus = "COMPLETE";
    }

    // Update newOrder with broker order details
    await newOrder.update({ 
      status:detailsData.status,
      orderstatus:detailsData.orderstatus,
      unfilledshares:detailsData.unfilledshares,
      filledshares:detailsData.filledshares,
      cancelsize:detailsData.cancelsize,
      lotsize:detailsData.lotsize,
      optiontype:detailsData.optiontype,
      strikeprice:detailsData.strikeprice,
      instrumenttype:detailsData.instrumenttype,
      exchange:detailsData.exchange,
      symboltoken:detailsData.symboltoken,
      trailingstoploss:detailsData.trailingstoploss,
      stoploss:detailsData.stoploss,
      squareoff:detailsData.squareoff,
      disclosedquantity:detailsData.disclosedquantity,
      triggerprice:detailsData.triggerprice,
      duration:detailsData.duration,
      variety:detailsData.variety,
      ordertype:detailsData.ordertype,
      duration:detailsData.duration,
      orderstatuslocaldb: finalStatus
     });

    // ---------------------------
    // 5) Fetch TRADE BOOK
    // ---------------------------
    try {
      
      const tradeRes = await axios.get(ANGEL_ONE_TRADE_BOOK_URL, {
        headers: angelHeaders(user.authToken),
      });

      if (tradeRes.data?.status === true && Array.isArray(tradeRes.data.data)) {

        const matched = tradeRes.data.data.find((t) => t.orderid === orderid);

        if (matched) {

        const buyPrice  = buyOrder?.fillprice     || 0;
        const buySize   = buyOrder?.fillsize      || 0;
        const buyValue  = buyOrder?.tradedValue   || 0;
        let buyTime  = buyOrder?.filltime ||0

        let pnl = (matched?.fillsize*matched?.fillprice)-(buyPrice*buySize)
       

          if(matched.transaction_type==='BUY') {
             pnl = 0
             buyTime = "NA";
         }


          await newOrder.update({
            tradedValue: matched.tradevalue,
            fillprice: matched.fillprice,
            fillsize: matched.fillsize,
            filltime: matched.filltime.toISOString(),
            fillid: matched.fillid,
            pnl:pnl,
            buyOrderId:buyOrderId,
            buyTime:buyTime,
            buyprice:buyPrice,
            buysize:buySize,
            buyvalue:buyValue,
          });
        }
      }
    } catch (e) {
      console.log(e ,'angel errr 1');
      
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
    console.log(err, 'catch ');
    
    return {
      userId: user.id,
      broker: "AngelOne",
      result: "ERROR",
      message: safeErr(err),
    };
  }
};
