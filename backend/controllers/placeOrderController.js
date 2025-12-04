
import axios from 'axios';
import { getIO } from "../socket/index.js";
import Order from '../models/orderModel.js';
import dayjs from "dayjs";
import { getManyTokensFromSession } from '../utils/sessionUtils.js';
import {emitOrderGet} from "../services/smartapiFeed.js"

import { Sequelize, Op } from "sequelize";


export const searchOrders = async (req, res) => {
  try {

    const { search = "" } = req.query;

    const trimmed = search.trim();

    // If no search → return latest orders
    if (!trimmed) {
      const orders = await Order.findAll({
        // userId:"",
        order: [["createdAt", "DESC"]],
        limit: 200
      });

      return res.json({ status: true, data: orders });
    }

    // Split multiple keywords → "AWL 955 CE" → ["awl","955","ce"]
    const terms = trimmed.toLowerCase().split(/\s+/).filter(Boolean);

    // 🔥 Build dynamic AND conditions
    const whereConditions = terms.map((word) => {
      const like = `%${word}%`;

      return Sequelize.where(
        Sequelize.fn(
          "concat",
          Sequelize.col("orderid"), " ",
          Sequelize.col("tradingsymbol"), " ",
          Sequelize.col("transactiontype"), " ",
          Sequelize.col("ordertype"), " ",
          Sequelize.col("producttype"), " ",
          Sequelize.col("status"), " ",
          Sequelize.col("orderstatus"), " ",
          Sequelize.col("symboltoken"), " ",
          Sequelize.col("instrumenttype"), " ",
          Sequelize.col("variety"), " ",
          Sequelize.col("exchange"), " ",
          Sequelize.col("text"), " ",
          Sequelize.col("fillprice"), " ",
          Sequelize.col("fillsize"), " ",
          Sequelize.col("averageprice"), " ",
          Sequelize.col("price"), " ",
          Sequelize.col("quantity"), " ",
          Sequelize.col("lotsize"), " ",
          Sequelize.col("triggerprice"), " ",
          Sequelize.col("expirydate"), " ",
          Sequelize.col("createdAt")
        ),
        {
          [Op.iLike]: like
        }
      );
    });

    // 🔥 Final Query
    const orders = await Order.findAll({
      where: {
        [Op.and]: whereConditions
      },
      order: [["createdAt", "DESC"]],
      limit: 200,
      raw:true
    });

    
    

    res.json({ status: true, data: orders });

  } catch (err) {
    console.error("searchOrders error:", err);
    res.status(500).json({ status: false, message: "Internal server error" });
  }
};




let saveData = [
        {
            "userId": 19,
            "variety": "NORMAL",
            "ordertype": "MARKET",
            "producttype": "INTRADAY",
            "duration": "DAY",
            "price": 239,
            "totalPrice": 18435,
            "triggerprice": 0,
            "quantity": "75",
            "actualQuantity": "75",
            "disclosedquantity": "0",
            "squareoff": 0,
            "stoploss": 0,
            "trailingstoploss": 0,
            "tradingsymbol": "NIFTY18NOV2525800CE",
            "transactiontype": "SELL",
            "exchange": "NFO",
            "symboltoken": "44285",
            "instrumenttype": "OPTIDX",
            "strikeprice": 25800,
            "optiontype": "CE",
            "expirydate": "18NOV2025",
            "lotsize": "75",
            "cancelsize": "0",
            "averageprice": 0,
            "filledshares": "0",
            "unfilledshares": "75",
            "orderid": "",
            "text": "",
            "status": "open",
            "orderstatus": "open",
            "updatetime": "",
            "exchtime": "",
            "exchorderupdatetime": "",
            "parentorderid": "",
            "ordertag": "",
            "uniqueorderid": "9fe69142-06b8-4c1a-b99a-7c8dfe4341d3",
            "tradedValue": 18378.75,
            "fillprice": 245.05,
            "fillsize": 75,
            "fillid": "1264289",
            "filltime": "10:50:28"
        },
        {
           "userId": 19,
            "variety": "NORMAL",
            "ordertype": "MARKET",
            "producttype": "INTRADAY",
            "duration": "DAY",
            "price": 230.55,
            "totalPrice": 17606.25,
            "triggerprice": 0,
            "quantity": "75",
            "actualQuantity": "75",
            "disclosedquantity": "0",
            "squareoff": 0,
            "stoploss": 0,
            "trailingstoploss": 0,
            "tradingsymbol": "NIFTY18NOV2525800CE",
            "transactiontype": "SELL",
            "exchange": "NFO",
            "symboltoken": "44285",
            "instrumenttype": "OPTIDX",
            "strikeprice": 25800,
            "optiontype": "CE",
            "expirydate": "18NOV2025",
            "lotsize": "75",
            "cancelsize": "0",
            "averageprice": 0,
            "filledshares": "0",
            "unfilledshares": "75",
            "orderid": "251113000278904",
            "text": "",
            "status": "open",
            "orderstatus": "",
            "updatetime": "13-Nov-2025 10:49:29",
            "exchtime": "",
            "exchorderupdatetime": "",
            "parentorderid": "",
            "ordertag": "",
            "uniqueorderid": "7e9e94ac-6532-4401-8a06-bebf3946f077",
            "tradedValue": 17711.25,
            "fillprice": 236.15,
            "fillsize": 75,
            "fillid": "1243034",
            "filltime": "10:49:29",
        },
        {
            "userId": 19,
            "variety": "NORMAL",
            "ordertype": "MARKET",
            "producttype": "INTRADAY",
            "duration": "DAY",
            "price": 222.6,
            "totalPrice": 32745,
            "triggerprice": 0,
            "quantity": "150",
            "actualQuantity": "75",
            "disclosedquantity": "0",
            "squareoff": 0,
            "stoploss": 0,
            "trailingstoploss": 0,
            "tradingsymbol": "NIFTY18NOV2525800CE",
            "transactiontype": "BUY",
            "exchange": "NFO",
            "symboltoken": "44285",
            "instrumenttype": "OPTIDX",
            "strikeprice": 25800,
            "optiontype": "CE",
            "expirydate": "18NOV2025",
            "lotsize": "75",
            "cancelsize": "0",
            "averageprice": 0,
            "filledshares": "0",
            "unfilledshares": "150",
            "orderid": "",
            "text": "",
            "status": "open",
            "orderstatus": "open",
            "updatetime": "",
            "exchtime": "",
            "exchorderupdatetime": "",
            "parentorderid": "",
            "ordertag": "",
            "uniqueorderid": "bd21e984-871d-4761-ac33-bdc26e5a4c62",
            "tradedValue": 16320,
            "fillprice": 217.6,
            "fillsize": 75,
            "fillid": "1085126",
            "filltime": "10:23:57",
        }
  ]

 const saveOrderData = async function () {
  try {
    
      await Order.bulkCreate(saveData, { ignoreDuplicates: true });

       console.log('save trade data',saveData.length);

  } catch (error) {
     console.log(error,'hhy');
     
  }
      
     
       
  } 


// saveOrderData()



export const getOrderPerticular = async (req, res,next) => {
    try {

        let orderId = "7d87d261-7c7d-4e55-a8bd-67ce2e179634"

        let token ='eyJhbGciOiJIUzUxMiJ9.eyJ1c2VybmFtZSI6IkFSSk1BMTkyMSIsInJvbGVzIjowLCJ1c2VydHlwZSI6IlVTRVIiLCJ0b2tlbiI6ImV5SmhiR2NpT2lKU1V6STFOaUlzSW5SNWNDSTZJa3BYVkNKOS5leUoxYzJWeVgzUjVjR1VpT2lKamJHbGxiblFpTENKMGIydGxibDkwZVhCbElqb2lkSEpoWkdWZllXTmpaWE56WDNSdmEyVnVJaXdpWjIxZmFXUWlPalFzSW5OdmRYSmpaU0k2SWpNaUxDSmtaWFpwWTJWZmFXUWlPaUl4WlROa04yWTVZUzAwTkRWaUxUTmtZelV0T1RFeFlTMDJOR1ZtT1RZNE5qQTFZbVFpTENKcmFXUWlPaUowY21Ga1pWOXJaWGxmZGpJaUxDSnZiVzVsYldGdVlXZGxjbWxrSWpvMExDSndjbTlrZFdOMGN5STZleUprWlcxaGRDSTZleUp6ZEdGMGRYTWlPaUpoWTNScGRtVWlmU3dpYldZaU9uc2ljM1JoZEhWeklqb2lZV04wYVhabEluMTlMQ0pwYzNNaU9pSjBjbUZrWlY5c2IyZHBibDl6WlhKMmFXTmxJaXdpYzNWaUlqb2lRVkpLVFVFeE9USXhJaXdpWlhod0lqb3hOell5TURRek5UazBMQ0p1WW1ZaU9qRTNOakU1TlRjd01UUXNJbWxoZENJNk1UYzJNVGsxTnpBeE5Dd2lhblJwSWpvaVlUSm1aREZsTmpBdFlqYzJZUzAwT0dVNExUZ3hOekV0WVRjeE1qZGpPVFF5T0dObElpd2lWRzlyWlc0aU9pSWlmUS5ybHFzLTk3QUVoZ2NwMDhhOWtRM2VMdkhNMmVaREVMRERlMzNCTXFUT1dFN2dIRDFvUktHcVZ2a1hkSnBIc1ZmLVphaWxIZ3JKcU5CejA2Zm00NDg5XzBGN0hCVEN3QU1US25IN3YxNFF6aDlkVFdfTVZPckx2VEtxckNiVTBFRFNhQ05JUm5IX2pqdmxkWXJWb2Y0ZElId0xFNU0wcktJbWY1eFhVVnRpZm8iLCJBUEktS0VZIjoieUpicm5ua3giLCJYLU9MRC1BUEktS0VZIjp0cnVlLCJpYXQiOjE3NjE5NTcxOTQsImV4cCI6MTc2MjAyMTgwMH0.EHrnDiNaQEmlkvpexlJC04iz3yazrlaq84f6EQlkLpnh2Ae-2Bmj7W5a5O8Cm_UezeC_5YfSBO6YgTVC1X1Wbg'
       
        var config = {
        method: 'get',
        url: `https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/details/${orderId}`,
        headers: { 
       'X-PrivateKey': process.env.PRIVATE_KEY, 
      'Accept': 'application/json', 
      'X-SourceID': 'WEB', 
    'X-ClientLocalIP': process.env.CLIENT_LOCAL_IP, 
       'X-ClientPublicIP': process.env.CLIENT_PUBLIC_IP, 
       'X-MACAddress': process.env.MAC_Address, 
      'X-UserType': 'USER', 
      'Authorization': `Bearer ${token}`, 
      'Content-Type': 'application/json'
    },
        };

        let {data} = await axios(config)

      
        

        if(data.status==true) {
  
            return res.json({
            status: true,
            statusCode:200,
           data: data?.data ?? [],
            message:'get data'
        });

         }else{

        return res.json({
            status: false,
            statusCode:data.errorcode,
            message: "Unexpected error occurred. Please try again.",
            data:null,
            error: data.message,
        });
    }

    } catch (error) {


        

        return res.json({
            status: false,
            statusCode:500,
            message: "Unexpected error occurred. Please try again.",
            data:null,
            error: error.message,
        });
    }
};


function parseDateTime(str) {
  const [datePart, timePart] = str.split(" ");
  const [day, mon, year] = datePart.split("-");
  
  const months = {
    Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
    Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11
  };

  const [hour, min, sec] = timePart.split(":");

  return new Date(year, months[mon], day, hour, min, sec);
}


//   WOKRING 


// getOrderWithDate *update
export const getOrderWithDate = async (req, res,next) => {
    try {
 
       if(req.body===undefined) {
           
         return res.json({
            status: false,
            statusCode:401,
            message: "Select Date",
            data:null,
            error:"Select Date",
        });

       }

        let fromDate = dayjs(req.body[0]);
        let toDate = dayjs(req.body[1]);

        fromDate  = new Date(fromDate)
        toDate = new Date(toDate)

        toDate.setDate(toDate.getDate() + 1);
         fromDate.setDate(fromDate.getDate() + 1);

     
        
      // fromDate/toDate should be "YYYY-MM-DD" strings
      const data = await Order.findAll({
        where: {
          userId: req.userId,
          transactiontype:"SELL",
          [Op.and]: Sequelize.where(
            Sequelize.fn("DATE", Sequelize.col("createdAt")),
            { [Op.between]: [fromDate, toDate] }
          ),
        },
        order: [["createdAt", "ASC"]],
        raw: true,
      });

    
      

      const buyCount = await Order.count({
          where: {
            userId: req.userId,
            transactiontype:"SELL",
            status:"COMPLETE",
           [Op.and]: Sequelize.where(
            Sequelize.fn("DATE", Sequelize.col("createdAt")),
            { [Op.between]: [fromDate, toDate] }
          ),
          },
        });

       

            const formatted = data.map(o => ({
            ...o,
            createdAt: dayjs(o.createdAt).format("DD MMMM YYYY [at] hh:mm a"),
            updatedAt: dayjs(o.updatedAt).format("DD MMMM YYYY [at] hh:mm a"),
          }));
        

            return res.json({
            status: true,
            statusCode:200,
            buydata:buyCount,
            data: formatted ,
            message:'get data'
        });
        

    } catch (error) {


        

        return res.json({
            status: false,
            statusCode:500,
            message: "Unexpected error occurred. Please try again.",
            data:null,
            error: error.message,
        });
    }
};

export const getTradeWithDate = async (req, res,next) => {
    try {

       if(req.body===undefined) {
           
         return res.json({
            status: false,
            statusCode:401,
            message: "Select Date",
            data:null,
            error:"Select Date",
        });

       }

        let fromDate = dayjs(req.body[0]);
        let toDate = dayjs(req.body[1]);

        fromDate  = new Date(fromDate)
        toDate = new Date(toDate)

        toDate.setDate(toDate.getDate() + 1);
         fromDate.setDate(fromDate.getDate() + 1);

       
        

       const data = await Order.findAll({
  where: {
    [Op.and]: [
      Sequelize.where(
        Sequelize.fn("DATE", Sequelize.col("createdAt")),
        {
          [Op.between]: [fromDate, toDate], // e.g., "2025-11-07" to "2025-11-13"
        }
      ),
      {
        status: "complete", // Only include records with status = "complete"
      },
    ],
  },
  order: [["createdAt", "ASC"]],
  raw: true,
});

        


        console.log(data,'data');
        
         


            return res.json({
            status: true,
            statusCode:200,
           data: data ,
            message:'get data'
        });
        

      


          

        

    } catch (error) {


        

        return res.json({
            status: false,
            statusCode:500,
            message: "Unexpected error occurred. Please try again.",
            data:null,
            error: error.message,
        });
    }
};



// WOKRING
export const ModifyOrder = async (req, res, next) => {
  try {
    const { orderid } = req.body;

    if (!orderid) {
      return res.json({
        status: false,
        statusCode: 400,
        message: "orderid is required",
        data: null,
        error: "orderid is required",
      });
    }

    // 1️⃣ Fetch existing order from DB
    const existingOrder = await Order.findOne({ where: { orderid } });

    if (!existingOrder) {
      return res.json({
        status: false,
        statusCode: 404,
        message: "Order not found in PG DB",
        data: null,
        error: "Order not found in PG DB",
      });
    }

    // 2️⃣ Decide whether to sync with Angel One
    const shouldSyncWithAngel =
      existingOrder.flag === true &&
      ["open", "pending"].includes((existingOrder.status || "").toLowerCase());

    // Helper: update only local DB
    const updateLocalOrder = async () => {
      const where = { orderid };

      const [affected] = await Order.update(req.body, {
        where,
        returning: false, // we don't really need rows here
      });

      if (affected === 0) {
        return res.json({
          status: false,
          statusCode: 404,
          message: "Order not updated in PG DB",
          data: null,
          error: "Order not updated in PG DB",
        });
      }

      return res.json({
        status: true,
        statusCode: 201,
        data: null,
        message: shouldSyncWithAngel
          ? "Order updated locally (Angel One update skipped by condition)"
          : "Order updated locally",
      });
    };

    // 3️⃣ If conditions NOT matched → local DB only
    if (!shouldSyncWithAngel) {
      return await updateLocalOrder();
    }

    // 4️⃣ Conditions matched (flag true + status open/pending) → call Angel One first
    const data = JSON.stringify(req.body);

    const config = {
      method: "post",
      url: "https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/modifyOrder",
      headers: {
        Authorization: `Bearer ${req.headers.angelonetoken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-UserType": "USER",
        "X-SourceID": "WEB",
        "X-ClientLocalIP": process.env.CLIENT_LOCAL_IP,
        "X-ClientPublicIP": process.env.CLIENT_PUBLIC_IP,
        "X-MACAddress": process.env.MAC_Address,
        "X-PrivateKey": process.env.PRIVATE_KEY,
      },
      data,
    };

    const resData = await axios(config);

    if (resData.data?.status === true) {
      // ✅ Angel One updated, now update local DB too
      const where = { orderid };

      const [affected] = await Order.update(req.body, {
        where,
        returning: false,
      });

      if (affected === 0) {
        return res.json({
          status: false,
          statusCode: 404,
          message: "Order updated on Angel One but not found in PG DB",
          data: null,
          error: "Order updated on Angel One but not found in PG DB",
        });
      }

      return res.json({
        status: true,
        statusCode: 201,
        data: null,
        message: "Order updated in Angel One and local DB",
      });
    } else {
      // ❌ Angel One failed, do NOT update local (to avoid mismatch)
      return res.json({
        status: false,
        statusCode: resData.data?.errorcode || 400,
        message: resData.data?.message || "Order not updated in Angel One",
        data: null,
        error: "Order not updated in Angel One",
      });
    }
  } catch (error) {
    console.error("ModifyOrder error:", error.message);

    return res.json({
      status: false,
      statusCode: 500,
      message: "Unexpected error occurred. Please try again.",
      data: null,
      error: error.message,
    });
  }
};




// export const ModifyOrder = async (req, res,next) => {
//    try{

//      var data = JSON.stringify(req.body);

//     var config = {
//     method: 'post',
//     url: 'https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/modifyOrder',
//     headers: { 
//       'Authorization': `Bearer ${req.headers.angelonetoken}`,
//         'Content-Type': 'application/json', 
//         'Accept': 'application/json', 
//         'X-UserType': 'USER', 
//         'X-SourceID': 'WEB', 
//        'X-ClientLocalIP': process.env.CLIENT_LOCAL_IP, 
//             'X-ClientPublicIP': process.env.CLIENT_PUBLIC_IP, 
//             'X-MACAddress': process.env.MAC_Address, 
//             'X-PrivateKey': process.env.PRIVATE_KEY, 
//     },
//     data : data
//     };

//       let resData = await axios(config)

//        if(resData.data.status==true){

//     // normalize if needed
//     const where = { orderid: req.body.orderid };

//     // Postgres can return the updated row(s)
//     const [affected, rows] = await Order.update(
//      req.body,
//       {
//         where,
//         returning: true,            // only works on Postgres
//       }
//     );

//     if (affected === 0) {

//          return res.json({
//             status: false,
//             statusCode:404,
//             message: "Order not Found in PG DB and Update in Angel Account",
//             data:null,
//             error: "Order not Found in PG DB and Update in Angel Account",
//         });     
//     }
//         return res.json({
//         status: true,
//         statusCode:201,
//         data:null,
//         message:'Order is Updated'
//     });

//     }else{
        
//      return res.json({
//             status: false,
//             statusCode:data.errorcode,
//             message: resData?.data?.message,
//             data:null,
//             error: "Order is not Update",
//         });     

//     }
      	
//    }catch(error){
       
//      return res.json({
//             status: false,
//             statusCode:500,
//             message: "Unexpected error occurred. Please try again.",
//             data:null,
//             error: error.message,
//         });

//    }

// }

//   WOKRING   give a verity fields in fornted when user is cancel 


//   WOKRING 
export const placeOrder = async (req, res,next) => {

    // try {

    //     const saveObj = {
    //         variety: req.body.variety,
    //         tradingsymbol: req.body.symbol,
    //         symboltoken: req.body.token,
    //         transactiontype: req.body.transactiontype,
    //         exchange: req.body.exch_seg,
    //         ordertype: req.body.orderType,
    //         producttype: req.body.producttype || "INTRADAY",
    //         duration: req.body.duration || "DAY",
    //         price: req.body.price,
    //         producttype:req.body.productType,
    //         squareoff: "0",
    //         stoploss: "0",
    //         quantity: req.body.quantity,
    //         userId: req.userId,
    //         totalPrice:req.body.totalPrice,
    //         actualQuantity:req.body.actualQuantity
    //         };


             

    //     // 1. Store pending order
    //     const newOrder = await Order.create(saveObj);

    //     var config = {
    //         method: 'post',
    //         url: 'https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/placeOrder',
    //         headers: { 
    //         'Authorization': `Bearer ${req.headers.angelonetoken}`,
    //         'Content-Type': 'application/json', 
    //         'Accept': 'application/json', 
    //         'X-UserType': 'USER', 
    //         'X-SourceID': 'WEB', 
    //         'X-ClientLocalIP': process.env.CLIENT_LOCAL_IP, 
    //         'X-ClientPublicIP': process.env.CLIENT_PUBLIC_IP, 
    //         'X-MACAddress': process.env.MAC_Address, 
    //         'X-PrivateKey': process.env.PRIVATE_KEY, 
    //         },
    //         data : JSON.stringify(saveObj)
    //     };

    // let response = await axios(config)



    // const total = 190

    // getIO().to("orders").emit("orders:count", {total});

    // // 4️⃣ Handle API response
    // if (response.data?.status === true) {

    //   let orderid = response?.data?.data?.orderid || null;
    //    let uniqueOrderId =  response?.data?.data?.uniqueorderid ||null

    //     // Update local order with broker ids
    //         await newOrder.update({
    //           orderid,
    //           uniqueorderid: uniqueOrderId,
    //         });
    
    //     var configStatus = {
    //         method: 'get',
    //         url: `https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/details/${uniqueOrderId}`,
    //         headers: { 
    //         'Authorization': `Bearer ${req.headers.angelonetoken}`,
    //         'Content-Type': 'application/json', 
    //         'Accept': 'application/json', 
    //         'X-UserType': 'USER', 
    //         'X-SourceID': 'WEB', 
    //         'X-ClientLocalIP': process.env.CLIENT_LOCAL_IP, 
    //         'X-ClientPublicIP': process.env.CLIENT_PUBLIC_IP, 
    //         'X-MACAddress': process.env.MAC_Address, 
    //         'X-PrivateKey': process.env.PRIVATE_KEY, 
    //         },
    //     };   
        
    // let responseStatus = await axios(configStatus)

    //  await newOrder.update(responseStatus.data.data);

    //       // 4️⃣ Handle API response
    // if (responseStatus.data?.status === true) {
    
   

    //     // 3️⃣ Fetch trade book AFTER order details success
    //     const tradeCfg = await {
    //     method: 'get',
    //      url: 'https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/getTradeBook',
    //     headers: {
    //         'Authorization': `Bearer ${req.headers.angelonetoken}`,
    //         'Content-Type': 'application/json',
    //         'Accept': 'application/json',
    //         'X-UserType': 'USER',
    //         'X-SourceID': 'WEB',
    //         'X-ClientLocalIP': process.env.CLIENT_LOCAL_IP,
    //         'X-ClientPublicIP': process.env.CLIENT_PUBLIC_IP,
    //         'X-MACAddress': process.env.MAC_Address,
    //         'X-PrivateKey': process.env.PRIVATE_KEY,
    //     },
    // };

    //     const tradeRes = await axios(tradeCfg);

    //     if(tradeRes.data.status===true&&tradeRes.data.data!==null) {

    //     const orderId = response?.data?.data?.orderid || null;

    //     // AngelOne often returns { status, data: [ ...trades ] } or { data: { data: [ ... ] } }
    //     const tradeList = tradeRes?.data?.data

    //     // find an uniqueId with traded Object 
    //     const matchedTrade = tradeList.find((t) => t.orderid === orderId);

    //      // Update Values in Order Schema 
    //     const fillsize      = matchedTrade.fillsize
    //     const fillid  =  matchedTrade.fillid
    //     const fillprice      = matchedTrade.fillprice
    //     const tradevalue  =  matchedTrade.tradevalue
    //     const filltime  =  matchedTrade.filltime

    //     // ✅ Update exactly FIVE fields in PG
    //         await newOrder.update({
    //         tradedValue: tradevalue,
    //         fillprice: fillprice,
    //         fillsize:     fillsize,
    //         filltime:     filltime,
    //         fillid:       fillid,
    //         });
        
    //   return res.json({
    //     status: true,
    //     statusCode:200,
    //     message: "Order placed successfully",
    //     data: response.data.data,
    //   });


    //     }else if(tradeRes.data.status===true&&tradeRes.data.data===null) {

    //          return res.json({
    //             status: true,
    //             statusCode:200,
    //             message: "Order placed successfully But Status is Open",
    //             data: null,
    //             });

    //     }else{

    //           return res.json({
    //             status: true,
    //             statusCode:200,
    //             message: "Order placed successfully But Traded Value and Time not Update",
    //             data: null,
    //             });  

    //     }

    // }else{
           
    // return res.json({
    //     status: true,
    //     statusCode:201,
    //     data:null,
    //     message: "Order is Place But Not Update Status in PG DB ",
    // })
            
    // }

    // } else {

    //            // normalize if needed
    // const where = { id: newOrder.id };

    // // Postgres can return the updated row(s)
    // const [affected, rows] = await Order.update(
    //   {
    //     status: 'cancelled',        // or 'canceled' if you prefer US spelling
    //   },
    //   {
    //     where,
    //     returning: true,            // only works on Postgres
    //   }
    // );

    // if (affected === 0) {

    //      return res.json({
    //         status: false,
    //         statusCode:404,
    //         message: "Order not found in PG DB and Order is not Placed",
    //         data:null,
    //         error: "Order not found in PG DB and Order is not Placed",
    //     });     
    // }
    //     return res.json({
    //     status: true,
    //     statusCode:201,
    //     data:null,
    //     message: " Order is not Placed and Order status update in PG DB Cancell",
    // })

    // }

    // } catch (error) {

    //    return res.json({
    //         status: false,
    //         statusCode:500,
    //         message: "Unexpected error occurred. Please try again.",
    //         data:null,
    //         error: error.message,
    //     });
    // }
};

export const getOrderInTables = async (req, res,next) => {
    try {

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    
    // const orderData = await Order.findAll({
    //   where: {
    //     userId:req.userId,
    //     fillid: {
    //   [Op.ne]: null,      // 👈 fillid present (NOT NULL)
    // },
    //       orderstatuslocaldb: {
    //   [Op.in]: ["FAILED","REJECTED","COMPLETE"]},   // 👈 fetch both
    //      createdAt: {
    //   [Op.between]: [startOfDay, endOfDay], // 👈 Only today’s data
    // },
    //   },
    //   order: [['createdAt', 'DESC']], // 👈 sorts in descending order (latest first)
    //   raw: true,
    // });

const orderData = await Order.findAll({
  where: {
    userId: req.userId,

    createdAt: {
      [Op.between]: [startOfDay, endOfDay],
    },

    [Op.or]: [
      // 1️⃣ FAILED + REJECTED → BUY + SELL dono aayenge
      {
        orderstatuslocaldb: {
          [Op.in]: ["FAILED", "REJECTED"],
        },
      },

      // 2️⃣ COMPLETE → sirf SELL + fillid present
      {
        orderstatuslocaldb: "COMPLETE",
        transactiontype: "SELL",
        fillid: {
          [Op.and]: [
            { [Op.ne]: null },
            { [Op.ne]: "" },
          ],
        },
      },
    ],
  },

  order: [["createdAt", "DESC"]],
  raw: true,
});


    const buyCount = await Order.count({
     where: {
    userId: req.userId,
    transactiontype: "SELL",
    status:"COMPLETE",
    createdAt: {
      [Op.between]: [startOfDay, endOfDay],
    },
  },
});

   const formatted = orderData.map(o => ({
  ...o,
  createdAt: dayjs(o.createdAt).format("DD MMMM YYYY [at] hh:mm a"),
  filltime: dayjs(o.filltime).format("DD MMMM YYYY [at] hh:mm a"),
  buyTime: dayjs(o.buyTime).format("DD MMMM YYYY [at] hh:mm a"),
  updatedAt: dayjs(o.updatedAt).format("DD MMMM YYYY [at] hh:mm a"),
}));
    
     return res.json({
          status: true,
          statusCode:200,
          data:formatted,
          buydata:buyCount,
          message:'get data'
      });


       
   


    
    
    } catch (error) {

       return res.json({
            status: false,
            statusCode:500,
            message: "Unexpected error occurred. Please try again.",
            data:null,
            error: error.message,
        });
    }
};





export const adminGetOrderInTables = async (req, res,next) => {
    try {

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);


  const orderData = await Order.findAll({
      where: {
        // userId:req.headers.userid,
      transactiontype: "BUY",
      orderstatuslocaldb: {
      [Op.in]: ["OPEN"],   // 👈 fetch both
    },
      createdAt: {
      [Op.between]: [startOfDay, endOfDay], // 👈 Only today’s data

    },
      },
      order: [['createdAt', 'DESC']], // 👈 sorts in descending order (latest first)
      raw: true,
    });


      const buyCount = await Order.count({
        where: {
          // userId: req.userId,
          transactiontype: "BUY",
          createdAt: {
            [Op.between]: [startOfDay, endOfDay],
          },
        },
      });

            const formatted = orderData.map(o => ({
  ...o,
  createdAt: dayjs(o.createdAt).format("DD MMMM YYYY [at] hh:mm a"),
  updatedAt: dayjs(o.updatedAt).format("DD MMMM YYYY [at] hh:mm a"),
}));

    
     return res.json({
          status: true,
          statusCode:200,
          data:formatted,
              buydata:buyCount,
          message:'get data'
      });
    
    
    } catch (error) {

       return res.json({
            status: false,
            statusCode:500,
            message: "Unexpected error occurred. Please try again.",
            data:null,
            error: error.message,
        });
    }
};


export const adminGetTradeInTables = async (req, res,next) => {
    try {

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);


  // const orderData = await Order.findAll({
  //     where: {
  //       // userId:req.headers.userid,
  //        transactiontype:"SELL",
  //        createdAt: {
  //     [Op.between]: [startOfDay, endOfDay], // 👈 Only today’s data
  //   },
  //     },
  //     order: [['createdAt', 'DESC']], // 👈 sorts in descending order (latest first)
  //     raw: true,
  //   });


  const orderData = await Order.findAll({
  where: {
  

    createdAt: {
      [Op.between]: [startOfDay, endOfDay],
    },

    [Op.or]: [
      // 1️⃣ FAILED + REJECTED → BUY + SELL dono aayenge
      {
        orderstatuslocaldb: {
          [Op.in]: ["FAILED", "REJECTED"],
        },
      },

      // 2️⃣ COMPLETE → sirf SELL + fillid present
      {
        orderstatuslocaldb: "COMPLETE",
        transactiontype: "SELL",
        fillid: {
          [Op.and]: [
            { [Op.ne]: null },
            { [Op.ne]: "" },
          ],
        },
      },
    ],
  },

  order: [["createdAt", "DESC"]],
  raw: true,
});

    const buyCount = await Order.count({
        where: {
          // userId: req.userId,
          transactiontype: "SELL",
          status:"COMPLETE",
          createdAt: {
            [Op.between]: [startOfDay, endOfDay],
          },
        },
      });

      const formatted = orderData.map(o => ({
  ...o,
  createdAt: dayjs(o.createdAt).format("DD MMMM YYYY [at] hh:mm a"),
  updatedAt: dayjs(o.updatedAt).format("DD MMMM YYYY [at] hh:mm a"),
    filltime: dayjs(o.filltime).format("DD MMMM YYYY [at] hh:mm a"),
  buyTime: dayjs(o.buyTime).format("DD MMMM YYYY [at] hh:mm a"),
}));
    
     return res.json({
          status: true,
          statusCode:200,
          data:formatted,
           buydata:buyCount,
          message:'get data'
      });
    
    } catch (error) {

       return res.json({
            status: false,
            statusCode:500,
            message: "Unexpected error occurred. Please try again.",
            data:null,
            error: error.message,
        });
    }
};


export const userGetTradeInTables = async (req, res,next) => {
    try {

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

  const orderData = await Order.findAll({
      where: {
        userId:req.userId,
         transactiontype: "BUY",
       orderstatuslocaldb: {
            [Op.in]: ["OPEN"],   // 👈 fetch both
          },
         createdAt: {
      [Op.between]: [startOfDay, endOfDay], // 👈 Only today’s data
    },
      },
      order: [['createdAt', 'DESC']], // 👈 sorts in descending order (latest first)
      raw: true,
    });

     const formatted = orderData.map(o => ({
  ...o,
  createdAt: dayjs(o.createdAt).format("DD MMMM YYYY [at] hh:mm a"),
  updatedAt: dayjs(o.updatedAt).format("DD MMMM YYYY [at] hh:mm a"),
}));

    
     return res.json({
          status: true,
          statusCode:200,
          data:formatted,
          message:'get data'
      });
    
    
    } catch (error) {

       return res.json({
            status: false,
            statusCode:500,
            message: "Unexpected error occurred. Please try again.",
            data:null,
            error: error.message,
        });
    }
};

//  update date
export const adminGetOrderWithDate = async (req, res,next) => {
    try {

       if(req.body===undefined) {
           
         return res.json({
            status: false,
            statusCode:401,
            message: "Select Date",
            data:null,
            error:"Select Date",
        });

       }

        let fromDate = dayjs(req.body[0]);
        let toDate = dayjs(req.body[1]);

        fromDate  = new Date(fromDate)
        toDate = new Date(toDate)

        toDate.setDate(toDate.getDate() + 1);
        fromDate.setDate(fromDate.getDate() + 1);

    
      // fromDate/toDate should be "YYYY-MM-DD" strings
      const data = await Order.findAll({
        where: {
          transactiontype:'SELL',
          status:'COMPLETE',
          [Op.and]: Sequelize.where(
            Sequelize.fn("DATE", Sequelize.col("createdAt")),
            { [Op.between]: [fromDate, toDate] }
          ),
        },
        order: [["createdAt", "ASC"]],
        raw: true,
      });


      const buyCount = await Order.count({
        where: {
          // userId: req.userId,
          transactiontype: "SELL",
         [Op.and]: Sequelize.where(
            Sequelize.fn("DATE", Sequelize.col("createdAt")),
            { [Op.between]: [fromDate, toDate] }
          ),
        },
      });

                  const formatted = data.map(o => ({
  ...o,
  createdAt: dayjs(o.createdAt).format("DD MMMM YYYY [at] hh:mm a"),
  updatedAt: dayjs(o.updatedAt).format("DD MMMM YYYY [at] hh:mm a"),
   filltime: dayjs(o.filltime).format("DD MMMM YYYY [at] hh:mm a"),
  buyTime: dayjs(o.buyTime).format("DD MMMM YYYY [at] hh:mm a"),
}));
    
        return res.json({
            status: true,
            statusCode:200,
            data: formatted ,
            buydata:buyCount,
            message:'get data'
        });
        

    } catch (error) {


        

        return res.json({
            status: false,
            statusCode:500,
            message: "Unexpected error occurred. Please try again.",
            data:null,
            error: error.message,
        });
    }
};




export const adminSearchOrders = async (req, res) => {
  try {

    const { search = "" } = req.query;

    const trimmed = search.trim();

    // If no search → return latest orders
    if (!trimmed) {
      const orders = await Order.findAll({
        order: [["createdAt", "DESC"]],
        limit: 200
      });

      return res.json({ status: true, data: orders });
    }

    // Split multiple keywords → "AWL 955 CE" → ["awl","955","ce"]
    const terms = trimmed.toLowerCase().split(/\s+/).filter(Boolean);

    // 🔥 Build dynamic AND conditions
    const whereConditions = terms.map((word) => {
      const like = `%${word}%`;

      return Sequelize.where(
        Sequelize.fn(
          "concat",
          Sequelize.col("orderid"), " ",
          Sequelize.col("tradingsymbol"), " ",
          Sequelize.col("transactiontype"), " ",
          Sequelize.col("ordertype"), " ",
          Sequelize.col("producttype"), " ",
          Sequelize.col("status"), " ",
          Sequelize.col("orderstatus"), " ",
          Sequelize.col("symboltoken"), " ",
          Sequelize.col("instrumenttype"), " ",
          Sequelize.col("variety"), " ",
          Sequelize.col("exchange"), " ",
          Sequelize.col("text"), " ",
          Sequelize.col("fillprice"), " ",
          Sequelize.col("fillsize"), " ",
          Sequelize.col("averageprice"), " ",
          Sequelize.col("price"), " ",
          Sequelize.col("quantity"), " ",
          Sequelize.col("lotsize"), " ",
          Sequelize.col("triggerprice"), " ",
          Sequelize.col("expirydate"), " ",
          Sequelize.col("createdAt")
        ),
        {
          [Op.iLike]: like
        }
      );
    });

    // 🔥 Final Query
    const orders = await Order.findAll({
      where: {
        [Op.and]: whereConditions
      },
      order: [["createdAt", "DESC"]],
      limit: 200,
      raw:true
    });

    console.log(orders);
    
    

    res.json({ status: true, data: orders });

  } catch (err) {
    console.error("searchOrders error:", err);
    res.status(500).json({ status: false, message: "Internal server error" });
  }
};

