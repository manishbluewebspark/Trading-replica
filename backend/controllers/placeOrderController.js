
import axios from 'axios';
import { getIO } from "../socket/index.js";
import Order from '../models/orderModel.js';

import { getManyTokensFromSession } from '../utils/sessionUtils.js';
import {emitOrderGet} from "../services/smartapiFeed.js"

import { Sequelize, Op } from "sequelize";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
import { formatUTCToIST } from '../utils/dateUtils.js';

dayjs.extend(utc);
dayjs.extend(timezone);




 const saveOrderData = async function () {
  try {
    
    const sourceUserId = 20; // copy FROM this user
    const targetUserId = 22; // copy TO this user
    const usernameId = "37665"


  const startOfRange = new Date("2025-12-01T05:14:00.000Z");
  const endOfRange   = new Date("2025-12-11T05:14:00.000Z");

    // 🔁 Since filltime is VARCHAR with ISO UTC string -> compare with ISO strings
    const startISO = startOfRange.toISOString(); // e.g. "2025-12-03T18:30:00.000Z"
    const endISO = endOfRange.toISOString();

    // 🔍 Since filltime is VARCHAR (ISO strings), we compare as strings
    const sourceOrders = await Order.findAll({
      where: {
        userId: sourceUserId,
        filltime: {
          [Op.between]: [startISO, endISO],
        },
      },
      raw: true,
    });


 const ordersToInsert = sourceOrders.map((o) => {
      const { id, createdAt, updatedAt, userId, ...rest } = o;
      return {
        ...rest,
        userId: targetUserId,
        userNameId:usernameId
      };
    });

     const inserted = await Order.bulkCreate(ordersToInsert);
    console.log(`Copied ${inserted.length} orders from user ${sourceUserId} to ${targetUserId}`);


    console.log(sourceOrders.length);
    

      
  } catch (error) {
     console.log(error,'hhy');
     
  }
       
  } 


// saveOrderData()


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





export const getOrderWithDate = async (req, res, next) => {
  try {
    // 🔹 Validate body (expecting [fromDate, toDate])
    if (!Array.isArray(req.body) || req.body.length < 2 || !req.body[0] || !req.body[1]) {
      return res.json({
        status: false,
        statusCode: 401,
        message: "Select Date",
        data: null,
        error: "Select Date",
      });
    }

    let [fromRaw, toRaw] = req.body; // e.g. ["2025-12-03", "2025-12-05"]

    // 🔹 Normalize to dayjs objects
    const fromDay = dayjs(fromRaw).startOf("day");
    const toDay = dayjs(toRaw).endOf("day");

    // 🔹 For DATE(filltime) comparison, use YYYY-MM-DD strings
    const fromDateStr = fromDay.format("YYYY-MM-DD");
    const toDateStr = toDay.format("YYYY-MM-DD");

    // 🔹 Common date condition on filltime (stored as ISO string in DB)
    const filltimeDateCondition = Sequelize.where(
      Sequelize.fn("DATE", Sequelize.col("filltime")),
      { [Op.between]: [fromDateStr, toDateStr] }
    );

    // ================== MAIN DATA ==================
    const data = await Order.findAll({
      where: {
        userId: req.userId,
        transactiontype: "SELL",
        [Op.and]: filltimeDateCondition,
      },
      order: [["filltime", "ASC"]],
      raw: true,
    });

    // ================== COUNT ==================
    const buyCount = await Order.count({
      where: {
        userId: req.userId,
        transactiontype: "SELL",
        status: "COMPLETE",
        [Op.and]: filltimeDateCondition,
      },
    });

    // ================== FORMAT WITH COMMON UTILITY ==================
    const formatted = data.map((o) => ({
      ...o,
      createdAt: o.createdAt ? formatUTCToIST(o.createdAt) : null,
      updatedAt: o.updatedAt ? formatUTCToIST(o.updatedAt) : null,
      buyTime: o.buyTime ? formatUTCToIST(o.buyTime) : null,
      filltime: o.filltime ? formatUTCToIST(o.filltime) : null,
    }));

    return res.json({
      status: true,
      statusCode: 200,
      buydata: buyCount,
      data: formatted,
      message: "get data",
    });
  } catch (error) {
    console.error("getOrderWithDate error:", error);

    return res.json({
      status: false,
      statusCode: 500,
      message: "Unexpected error occurred. Please try again.",
      data: null,
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


export const getOrderInTables = async (req, res, next) => {
  try {
    // ⏰ Today range in JS (local)
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // 🔁 Since filltime is VARCHAR with ISO UTC string -> compare with ISO strings
    const startISO = startOfDay.toISOString(); // e.g. "2025-12-03T18:30:00.000Z"
    const endISO = endOfDay.toISOString();

    const orderData = await Order.findAll({
      where: {
        userId: req.userId,

        // ⚠️ filltime is STRING, so use ISO string range
        filltime: {
          [Op.between]: [startISO, endISO],
        },

        [Op.or]: [
          // 1️⃣ FAILED + REJECTED → BUY + SELL both
          {
            orderstatuslocaldb: {
              [Op.in]: ["FAILED", "REJECTED"],
            },
          },

          // 2️⃣ COMPLETE → only SELL + fillid present
          {
            orderstatuslocaldb: "COMPLETE",
            transactiontype: "SELL",
            fillid: {
              [Op.and]: [{ [Op.ne]: null }, { [Op.ne]: "" }],
            },
          },
        ],
      },

      order: [["filltime", "DESC"]],
      raw: true,
    });

    console.log("RAW orderData:", orderData);

    // SELL COMPLETE count
    const buyCount = await Order.count({
      where: {
        userId: req.userId,
        transactiontype: "SELL",
        status: "COMPLETE",
        filltime: {
          [Op.between]: [startISO, endISO],
        },
      },
    });

    // 🧯 Safely format dates (they are strings / ISO)
    const formatted = orderData.map((o) => ({
      ...o,
      createdAt: o.createdAt ? formatUTCToIST(o.createdAt) : null,
      updatedAt: o.updatedAt ? formatUTCToIST(o.updatedAt) : null,
      buyTime: o.buyTime ? formatUTCToIST(o.buyTime) : null,
      filltime: o.filltime ? formatUTCToIST(o.filltime) : null,
    }));

    return res.json({
      status: true,
      statusCode: 200,
      data: formatted,
      buydata: buyCount,
      message: "get data",
    });
  } catch (error) {
    console.error("getOrderInTables error:", error);
    return res.json({
      status: false,
      statusCode: 500,
      message: "Unexpected error occurred. Please try again.",
      data: null,
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

    // 🔁 Since filltime is VARCHAR with ISO UTC string -> compare with ISO strings
    const startISO = startOfDay.toISOString(); // e.g. "2025-12-03T18:30:00.000Z"
    const endISO = endOfDay.toISOString();

  const orderData = await Order.findAll({
  where: {
  

    
    filltime: {
          [Op.between]: [startISO, endISO],
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

  order: [["filltime", "DESC"]],
  raw: true,
});

    const buyCount = await Order.count({
        where: {
          // userId: req.userId,
          transactiontype: "SELL",
          status:"COMPLETE",
         filltime: {
          [Op.between]: [startISO, endISO],
        },
        },
      });

      const formatted = orderData.map(o => ({
  ...o,

    createdAt: o.createdAt ? formatUTCToIST(o.createdAt) : null,
      updatedAt: o.updatedAt ? formatUTCToIST(o.updatedAt) : null,
      buyTime: o.buyTime ? formatUTCToIST(o.buyTime) : null,
      filltime: o.filltime ? formatUTCToIST(o.filltime) : null,

  
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

         // 🔁 Since filltime is VARCHAR with ISO UTC string -> compare with ISO strings
    const toDateISO = toDate.toISOString(); // e.g. "2025-12-03T18:30:00.000Z"
    const fromDateISO = fromDate.toISOString();



    
      // fromDate/toDate should be "YYYY-MM-DD" strings
      const data = await Order.findAll({
        where: {
          transactiontype:'SELL',
          status:'COMPLETE',
          [Op.and]: Sequelize.where(
            Sequelize.fn("DATE", Sequelize.col("filltime")),
            { [Op.between]: [fromDateISO, toDateISO] }
          ),
        },
        order: [["filltime", "ASC"]],
        raw: true,
      });


      const buyCount = await Order.count({
        where: {
          // userId: req.userId,
          transactiontype: "SELL",
         [Op.and]: Sequelize.where(
            Sequelize.fn("DATE", Sequelize.col("filltime")),
            { [Op.between]: [fromDateISO, toDateISO] }
          ),
        },
      });

                  const formatted = data.map(o => ({
  ...o,
   createdAt: o.createdAt ? formatUTCToIST(o.createdAt) : null,
      updatedAt: o.updatedAt ? formatUTCToIST(o.updatedAt) : null,
      buyTime: o.buyTime ? formatUTCToIST(o.buyTime) : null,
      filltime: o.filltime ? formatUTCToIST(o.filltime) : null,
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










// ===================================Order table Update ======================

export async function linkBuyOrdersForAllUsers() {
  // 1) Sab relevant orders nikaalo (sirf BUY/SELL)
  const orders = await Order.findAll({
    where: {
      transactiontype: ["BUY", "SELL"],
    },
    raw: true,
    order: [
      ["userId", "ASC"],
      ["tradingsymbol", "ASC"],
      ["filltime", "ASC"], // FIFO style
      ["id", "ASC"],
    ],
  });

  // 2) BUY orders ko pool mein rakho (per user + symbol)
  const buyPool = {}; // key: "userId|symbol" -> BUY orders ka array

  for (const o of orders) {
    const key = `${o.userId}|${o.tradingsymbol}`;
    if (!buyPool[key]) buyPool[key] = [];

    if (o.transactiontype === "BUY") {
      buyPool[key].push({
        ...o,
        _used: false, // mark karenge jaise hi kisi SELL se match ho jaaye
      });
    }
  }

  // 3) SELL orders ke liye matching BUY dhundo
  const updates = [];

  for (const o of orders) {
    if (o.transactiontype !== "SELL") continue;
    if (o.buyOrderId) continue; // already mapped, skip

    const key = `${o.userId}|${o.tradingsymbol}`;
    const buys = buyPool[key];
    if (!buys || !buys.length) continue;

    // fillsize match karo + unused BUY
    const matchIndex = buys.findIndex(
      (b) => !b._used && Number(b.fillsize) === Number(o.fillsize)
    );

    if (matchIndex === -1) continue;

    const buy = buys[matchIndex];
    buy._used = true; // taaki same BUY dobara use na ho

    updates.push({
      sellId: o.id,
      buyOrderId: buy.orderid, // ya buy.id
      buyTime: buy.filltime,
    });
  }

  // 4) DB me updates apply karo
  await Promise.all(
    updates.map((u) =>
      Order.update(
        { buyOrderId: u.buyOrderId, buyTime: u.buyTime },
        { where: { id: u.sellId } }
      )
    )
  );

  console.log(`Linked ${updates.length} SELL orders with BUY orders.`);
  return updates.length;
}

// linkBuyOrdersForAllUsers();