// services/kite/placeKiteOrder.js

import { getKiteClientForUserId } from "../services/userKiteBrokerService.js";
import Order from "../models/orderModel.js";
import { Op } from "sequelize";

function getKiteProductCode(type) {
  
  if (!type) return "";

  switch (type.toUpperCase()) {
    case "DELIVERY":
      return "CNC";     // Cash & Carry for equity

    case "CARRYFORWARD":
      return "NRML";    // F&O Carryforward (Normal)

    case "MARGIN":
      return "MTF";     // Margin Trading Facility (MTF)

    case "INTRADAY":
      return "MIS";     // MIS Intraday

    case "BO":
      return "MIS";     // Bracket orders use MIS internally

    default:
      return type.toUpperCase(); // fallback, safe
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


export const placeKiteOrderTest = async (req,res,next) => {
  try {

    // 1) Set access token
  let kite = await getKiteClientForUserId(15)

    // ----------------------------------------
    // 4) PLACE ORDER IN KITE
    // ----------------------------------------
    let placeRes = {
      order_id:"1998326319347163136"
    }

    let newOrder = await Order.findOne(
      { where: { orderid: placeRes.order_id }}
    )

    console.log(newOrder,'newOrder');
    

    const orderid = placeRes.order_id;

    // ----------------------------------------
    // 5) GET ORDER DETAILS FROM KITE
    // ----------------------------------------
    let detailsData = {};
    try {
        
      const detailRes = await kite.getOrderTrades(orderid);

      console.log(detailRes,'detailRes');
      
    

      if (Array.isArray(detailRes) && detailRes.length > 0) {

       detailsData = await detailRes[0]
       
      }
    } catch (err) {
      
    return res.json({
      status: false,
      data: null,
      message: err.message,
      error:'1'
    });

    }

    // ----------------------------------------
    // 6) HANDLE BUY / SELL LOGIC
    // ----------------------------------------
    let finalStatus = "OPEN";
    let buyOrder
    let pnl = 0
    let buyTime = ''
    
    console.log(detailsData,'detailsData');
    
    let updateDB =  await newOrder.update({
      uniqueorderid:detailsData.exchange_order_id,
      averageprice:detailsData.average_price,
      lotsize:detailsData.quantity,
      symboltoken:newOrder.symboltoken,
      triggerprice:detailsData.average_price,
      price:detailsData.average_price,
      orderstatuslocaldb: finalStatus,
    });


    
    

    // ----------------------------------------
    // 8) (OPTIONAL) TRADES FETCH
    // ----------------------------------------
    try {
      const trades = await kite.getOrderTrades(orderid);

      console.log(trades,'trades');
      

      if (Array.isArray(trades) && trades.length > 0) {
        
        const t = await trades[0];

        console.log(t,'t');
        
         if(t.transaction_type==='BUY') {
             pnl = 0 ;
             buyTime = "NA";
         }

         console.log(t?.fill_timestamp,'this');
         

           // Update order
          await newOrder.update({
            tradedValue: t.average_price * Number(newOrder.quantity),
            fillprice: t.average_price,
            fillsize: newOrder.quantity,
            fillid: t.trade_id,
            filltime: t?.fill_timestamp
              ? new Date(t.fill_timestamp).toISOString()
              : null,
            status: "COMPLETE",
            pnl: pnl,

          });

    return res.json({
      status: true,
      data: null,
      message: 'update done',
  })
      }else{

        
      }

    } catch (err) {
    return res.json({
      status: false,
      data: null,
      message: err.message,
       error:'2'
    });
        
    }

  } catch (err) {

  return res.json({
      status: false,
      data: null,
      message: err.message,
      error:'3'
  })

  }
};


export const placeKiteOrder = async (user, reqInput, startOfDay, endOfDay) => {
  try {

    // 1) Set access token
  let kite = await getKiteClientForUserId(user.id)

  const kiteProductType = await getKiteProductCode( reqInput.productType);

  const kiteVerity = await mapVarietyToKite(reqInput.variety)

    // ----------------------------------------
    // 2) CREATE LOCAL PENDING ORDER
    // ----------------------------------------
    const orderData = {
      symboltoken:reqInput.kiteToken||reqInput.token,
      variety:kiteVerity || "regular",    // mistage in fields 
      tradingsymbol:reqInput.kiteSymbol|| reqInput.symbol,
      instrumenttype:reqInput.instrumenttype,
      transactiontype: reqInput.transactiontype,
      exchange: reqInput.exch_seg,
      ordertype: reqInput.orderType,
      quantity: reqInput.quantity,
      producttype: kiteProductType,
      price: reqInput.price,
      orderstatuslocaldb: "PENDING",
      totalPrice: reqInput.totalPrice,
      actualQuantity: reqInput.actualQuantity,
      userId: user.id,
      broker:'kite',
      angelOneSymbol:reqInput.angelOneSymbol||reqInput.symbol,
      angelOneToken:reqInput.angelOneToken||reqInput.token,
      userNameId: user.username,
    };


    console.log(orderData,'orderData');
    

    const newOrder = await Order.create(orderData);


    console.log(' db local done');
    

    // ----------------------------------------
    // 3) KITE PAYLOAD
    // ----------------------------------------
    const orderParams = {
      exchange: reqInput.exch_seg,
      tradingsymbol: reqInput.kiteSymbol|| reqInput.symbol,
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

    console.log(placeRes,'kite place order');
    

    } catch (err) {

      console.log(err,'kite place order');
      

      await newOrder.update({ orderstatuslocaldb: "FAILED",status:"FAILED",text:err.message,
        // filltime: new Date().toISOString().replace(/\.\d+Z$/, ".000Z"),
        buyTime:new Date().toISOString().replace(/\.\d+Z$/, ".000Z"),
       });

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
        
      const detailRes = await kite.getOrderTrades(orderid);

      console.log(detailRes,'detailRes');
      
    

      if (Array.isArray(detailRes) && detailRes.length > 0) {

       detailsData = await detailRes[0]
       
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
            tradingsymbol: reqInput.kiteSymbol|| reqInput.symbol,
            exchange: reqInput.exch_seg,
            quantity:reqInput.quantity,
            transactiontype: "BUY",
            status:"COMPLETE",
            orderstatuslocaldb: "OPEN",
            // createdAt: { [Op.between]: [startOfDay, endOfDay] },
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


    console.log(detailsData,'detailsData');
    

    // ----------------------------------------
    // 7) UPDATE LOCAL ORDER WITH FINAL STATUS
    // ----------------------------------------


    let objUpdate1 = await newOrder.update({
      uniqueorderid:detailsData.exchange_order_id,
      averageprice:detailsData.average_price,
      lotsize:detailsData.quantity,
      symboltoken:reqInput.kiteToken||reqInput.token,
      triggerprice:detailsData.average_price,
      price:detailsData.average_price,
      orderstatuslocaldb: finalStatus,
    });

    console.log('update in local db 2',objUpdate1);
    

    // ----------------------------------------
    // 8) (OPTIONAL) TRADES FETCH
    // ----------------------------------------
    try {
      const trades = await kite.getOrderTrades(orderid);

      console.log(trades,'trades');
      

      if (Array.isArray(trades) && trades.length > 0) {
        
        const t = await trades[0];

        console.log(t,'t');
        

        const buyPrice  = buyOrder?.fillprice     || 0;
        const buySize   = buyOrder?.fillsize      || 0;
        const buyValue  = buyOrder?.tradedValue   || 0;
         let buyTime  =   buyOrder?.filltime|| 'NA';

        // Calculate PNL safely
        let  pnl = ( Number(reqInput.quantity) * t.average_price) - (buyPrice * buySize);

           
         if(t.transaction_type==='BUY') {
             pnl = 0 ;
             buyTime = "NA";
         }

         console.log(t,'trade data');
         
         

          // Update order
        let updateObj2 =   await newOrder.update({
            tradedValue: t.average_price * Number(reqInput.quantity),
            fillprice: t.average_price,
             fillprice: t.average_price,
            fillsize: Number(reqInput.quantity),
            fillid: t.trade_id,
            price:t.average_price,
            filltime: t?.fill_timestamp
              ? t?.fill_timestamp.toISOString()
              : null,
            status: "COMPLETE",
            pnl: pnl,
            buyTime:buyTime,
            buyprice: buyPrice,
            buysize: buySize,
            buyvalue: buyValue,
          });

              console.log(updateObj2,'update in local db 3');
      }else{

          console.log(trades,'hhhy');
          

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

export const placeKiteOrderLocalDb = async (user, reqInput, startOfDay, endOfDay) => {
  try {

    // 1) Set access token
    let kite = await getKiteClientForUserId(user.id)

    // ----------------------------------------
    // 2) CREATE LOCAL PENDING ORDER
    // ----------------------------------------
    const orderData = {
      symboltoken:reqInput.kiteToken||reqInput.token,
      variety:reqInput.variety || "regular",    // mistage in fields 
      tradingsymbol:reqInput.kiteSymbol|| reqInput.symbol,
      instrumenttype:reqInput.instrumenttype,
      transactiontype: reqInput.transactiontype,
      exchange: reqInput.exch_seg,
      ordertype: reqInput.orderType,
      quantity: reqInput.quantity,
      producttype: reqInput.productType,
      price: reqInput.price,
      orderstatuslocaldb: "PENDING",
      totalPrice: reqInput.totalPrice,
      actualQuantity: reqInput.actualQuantity,
      userId: user.id,
      broker:'kite',
      angelOneSymbol:reqInput.angelOneSymbol||reqInput.symbol,
      angelOneToken:reqInput.angelOneToken||reqInput.token,
      userNameId: user.username,
      buyOrderId:reqInput?.buyOrderId
    };


    console.log(orderData,'orderData');
    

    const newOrder = await Order.create(orderData);


   
    

    // ----------------------------------------
    // 3) KITE PAYLOAD
    // ----------------------------------------
    const orderParams = {
      exchange: reqInput.exch_seg,
      tradingsymbol: reqInput.kiteSymbol|| reqInput.symbol,
      transaction_type: reqInput.transactiontype,
      quantity: Number(reqInput.quantity),
      product:reqInput.productType,  // DELIVERY.                // mistake in fields 
      order_type: reqInput.orderType,
      price: reqInput.price,
    };

     console.log(orderParams,' db orderParams done');

    // ----------------------------------------
    // 4) PLACE ORDER IN KITE
    // ----------------------------------------
    let placeRes;
    try {

    placeRes = await kite.placeOrder(orderData.variety, orderParams);

    console.log(placeRes,'kite place order');
    

    } catch (err) {

      console.log(err,'kite place order');
      

      await newOrder.update({ orderstatuslocaldb: "FAILED",status:"FAILED",text:err.message,
        // filltime: new Date().toISOString().replace(/\.\d+Z$/, ".000Z"),
        buyTime:new Date().toISOString().replace(/\.\d+Z$/, ".000Z"),
       });

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
        
       const detailRes = await kite.getOrderTrades(orderid);
    

      if (Array.isArray(detailRes) && detailRes.length > 0) {

        detailsData = detailRes[0]; // fallback
       
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
            status:"COMPLETE",
            orderstatuslocaldb: "OPEN",
            orderid:String(reqInput?.buyOrderId)
              },
              raw: true
            });
            

        if (buyOrder) {

        await Order.update(
          { orderstatuslocaldb: "COMPLETE" },
          { where: { orderid: reqInput?.buyOrderId } }
        );

      }

      finalStatus = "COMPLETE";
    }

    // ----------------------------------------
    // 7) UPDATE LOCAL ORDER WITH FINAL STATUS
    // ----------------------------------------

    await newOrder.update({
      uniqueorderid:detailsData.exchange_order_id,
      exchorderupdatetime:detailsData.fill_timestamp.toISOString(),
      exchtime:detailsData.fill_timestamp.toISOString(),
      updatetime:detailsData.fill_timestamp.toISOString(),
      averageprice:detailsData.average_price,
      lotsize:detailsData.quantity,
      symboltoken:reqInput.kiteToken||reqInput.token,
      triggerprice:detailsData.average_price,
      price:detailsData.average_price,
      orderstatuslocaldb: finalStatus,
    });

    // ----------------------------------------
    // 8) (OPTIONAL) TRADES FETCH
    // ----------------------------------------
    try {
      const trades = await kite.getOrderTrades(orderid);

    
      

      if (Array.isArray(trades) && trades.length > 0) {
        
        const t = await trades[0];

        const buyPrice  = buyOrder?.fillprice     || 0;
        const buySize   = buyOrder?.fillsize      || 0;
        const buyValue  = buyOrder?.tradedValue   || 0;
         let buyTime  =   buyOrder?.filltime|| 0;

        // Calculate PNL safely
        let  pnl = ( Number(reqInput.quantity) * t.average_price) - (buyPrice * buySize);

           
         if(t.transaction_type==='BUY') {
             pnl = 0 ;
             buyTime = "NA";
         }

         console.log(t,'trade data');
         
         

          // Update order
          await newOrder.update({
            tradedValue: t.average_price * Number(reqInput.quantity),
            fillprice: t.average_price,
            fillsize: Number(reqInput.quantity),
            fillid: t.trade_id,
            filltime: t?.fill_timestamp.toISOString(),
            status: "COMPLETE",
            pnl: pnl,
            buyTime:buyTime,
            buyprice: buyPrice,
            buysize: buySize,
            buyvalue: buyValue,
          });
      }else{

          console.log(trades,'hhhy');
          

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



export const testLocalSell = async (req,res,next) => {

  let array = {
  symboltoken: '532648',
  variety: 'regular',
  tradingsymbol: 'YESBANK',
  instrumenttype: '',
  transactiontype: 'SELL',
  exchange: 'BSE',
  ordertype: 'MARKET',
  quantity: '1',
  producttype: 'MIS',
  price: 22.11,
  orderstatuslocaldb: 'PENDING',
  totalPrice: null,
  actualQuantity: null,
  userId: 3,
  broker: 'kite',
  angelOneSymbol: 'YESBANK',
  angelOneToken: '532648',
  userNameId: '02439',
  buyOrderId: '251210170353170'
}


  let buyOrder = await Order.findOne({
          where: {
            userId: array.userId,
            status:"COMPLETE",
            orderstatuslocaldb: "OPEN",
            orderid:String(array?.buyOrderId)
              },
              raw: true
            });



            console.log(buyOrder);
            
  
}