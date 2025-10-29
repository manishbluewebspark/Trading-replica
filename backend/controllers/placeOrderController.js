
import axios from 'axios';
import { getIO } from "../socket/index.js";
import Order from '../models/orderModel.js';


//   WOKRING 
export const placeOrder = async (req, res,next) => {
    try {

        console.log(req.body);
        

        // 1️⃣ Prepare order payload
            const saveObj = {
            variety: "NORMAL",
            tradingsymbol: req.body.symbol,
            symboltoken: req.body.token,
            transactiontype: req.body.transactiontype,
            exchange: req.body.exch_seg,
            ordertype: req.body.orderType,
            producttype: req.body.producttype || "INTRADAY",
            duration: req.body.duration || "DAY",
            price: req.body.price,
            squareoff: "0",
            stoploss: "0",
            quantity: req.body.quantity,
            };

        
        // 1. Store pending order
        const newOrder = await Order.create(saveObj);

        var config = {
            method: 'post',
            url: 'https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/placeOrder',
            headers: { 
            'Authorization': `Bearer ${req.headers.angelonetoken}`,
            'Content-Type': 'application/json', 
            'Accept': 'application/json', 
            'X-UserType': 'USER', 
            'X-SourceID': 'WEB', 
            'X-ClientLocalIP': process.env.CLIENT_LOCAL_IP, 
            'X-ClientPublicIP': process.env.CLIENT_PUBLIC_IP, 
            'X-MACAddress': process.env.MAC_Address, 
            'X-PrivateKey': process.env.PRIVATE_KEY, 
            },
            data : JSON.stringify(saveObj)
        };

        let response = await axios(config)

        console.log(response,'response');
        

    //    const total = 190
    //    getIO().to("orders").emit("orders:count", {total});

        // 4️⃣ Handle API response
    if (response.data?.status === true) {

      await newOrder.update(response.data.data);

      return res.json({
        status: true,
        statusCode:200,
        message: "Order placed successfully",
        data: response.data.data,
      });

    } else {

      await newOrder.update(response.data.data);

        return res.json({
        status: false,
        statusCode:400,
        message: response?.data?.message||"Order rejected",
        data: null,
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

//   WOKRING 
export const cancelOrder = async (req, res,next) => {
    try {

    var data = JSON.stringify({
    "variety":req.body.variety,
    "orderid":req.body.orderid

    });

       var config = {
        method: 'post',
        url: 'https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/cancelOrder',
        headers: { 
           'Authorization': `Bearer ${req.headers.angelonetoken}`,
            'Content-Type': 'application/json', 
            'Accept': 'application/json', 
            'X-UserType': 'USER', 
            'X-SourceID': 'WEB', 
            'X-ClientLocalIP': process.env.CLIENT_LOCAL_IP, 
            'X-ClientPublicIP': process.env.CLIENT_PUBLIC_IP, 
            'X-MACAddress': process.env.MAC_Address, 
            'X-PrivateKey': process.env.PRIVATE_KEY, 
    },
    data : data
    };
    
    let resData = await axios(config)

    if(resData.data.status==true){

        // normalize if needed
    const where = { orderid: req.body.orderid };

    // Postgres can return the updated row(s)
    const [affected, rows] = await Order.update(
      {
        status: 'cancelled',        // or 'canceled' if you prefer US spelling
      },
      {
        where,
        returning: true,            // only works on Postgres
      }
    );

    if (affected === 0) {

         return res.json({
            status: false,
            statusCode:404,
            message: "Order not found for given orderid & variety",
            data:null,
            error: "Order not found for given orderid & variety",
        });     
    }
        return res.json({
        status: true,
        statusCode:201,
        data:null,
        message: resData?.data?.status
    });

    }else{
        
     return res.json({
            status: false,
            statusCode:data.errorcode,
            message: resData?.data?.message,
            data:null,
            error: "Unexpected error occurred. Please try again.",
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

//   WOKRING 
export const getOrder = async (req, res,next) => {
    try {

        var config = {
        method: 'get',
        url: 'https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/getOrderBook',
        headers: { 
           'Authorization': `Bearer ${req.headers.angelonetoken}`,
            'Content-Type': 'application/json', 
            'Accept': 'application/json', 
            'X-UserType': 'USER', 
            'X-SourceID': 'WEB', 
            'X-ClientLocalIP': process.env.CLIENT_LOCAL_IP, 
            'X-ClientPublicIP': process.env.CLIENT_PUBLIC_IP, 
            'X-MACAddress': process.env.MAC_Address, 
            'X-PrivateKey': process.env.PRIVATE_KEY, 
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

// export const getOrder = async (req, res,next) => {
//     try {

       
//         let orders = await Order.findAll({ raw: true });
      
//          return res.json({
//             status: true,
//             statusCode:200,
//             data: orders,
//             message:'get data'
//         });
    
    
//     } catch (error) {


//        return res.json({
//             status: false,
//             statusCode:500,
//             message: "Unexpected error occurred. Please try again.",
//             data:null,
//             error: error.message,
//         });
//     }
// };


//  
export const getBookOrder = async (req, res,next) => {
    try {

    var config = {
    method: 'get',
    url: 'https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/getTradeBook',
    headers: { 
    'Authorization': `Bearer ${req.headers.angelonetoken}`,
        'Content-Type': 'application/json', 
        'Accept': 'application/json', 
        'X-UserType': 'USER', 
        'X-SourceID': 'WEB', 
        'X-ClientLocalIP': process.env.CLIENT_LOCAL_IP, 
        'X-ClientPublicIP': process.env.CLIENT_PUBLIC_IP, 
        'X-MACAddress': process.env.MAC_Address, 
        'X-PrivateKey': process.env.PRIVATE_KEY, 
    },
    
    };

    let resData = await axios(config)

    return res.status(200).json( resData.data);


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



//   WOKRING 
export const getLTP = async (req, res,next) => {
    try {

       var data = JSON.stringify({
            "exchange":req.body.exchange,
            "tradingsymbol":req.body.tradingsymbol,
            "symboltoken":req.body.symboltoken
        });

      var config = {
        method: 'post',
        url: 'https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/getLtpData',

        headers: { 
             'Authorization': `Bearer ${req.headers.angelonetoken}`,
            'Content-Type': 'application/json', 
            'Accept': 'application/json', 
            'X-UserType': 'USER', 
            'X-SourceID': 'WEB', 
            'X-ClientLocalIP': process.env.CLIENT_LOCAL_IP, 
            'X-ClientPublicIP': process.env.CLIENT_PUBLIC_IP, 
            'X-MACAddress': process.env.MAC_Address, 
            'X-PrivateKey': process.env.PRIVATE_KEY, 
        },
        data : data
    };

    let resData = await axios(config)

     if(resData?.data?.status==true) {

         return res.json({
            status: true,
            statusCode:200,
            data: resData.data,
            message:''
        });
     }else{
       
        return res.json({
            status: false,
            statusCode:401,
            message: "Invalid symboltoken",
            error: resData?.data?.message,
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

//   WOKRING 
export const getTradeBook = async (req, res,next) => {
    try {

      var config = {
       method: 'get',
        url: 'https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/getTradeBook',
        headers: { 
           'Authorization': `Bearer ${req.headers.angelonetoken}`,
            'Content-Type': 'application/json', 
            'Accept': 'application/json', 
            'X-UserType': 'USER', 
            'X-SourceID': 'WEB', 
              'X-ClientLocalIP': process.env.CLIENT_LOCAL_IP, 
            'X-ClientPublicIP': process.env.CLIENT_PUBLIC_IP, 
            'X-MACAddress': process.env.MAC_Address, 
            'X-PrivateKey': process.env.PRIVATE_KEY, 
        },
        // data : data
    };

        let resData = await axios(config)

         return res.status(200).json({
            status: true,
            data: resData?.data
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
export const ModifyOrder = async (req, res,next) => {

   try{

     var data = JSON.stringify(req.body);

    var config = {
    method: 'post',
    url: 'https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/modifyOrder',
    headers: { 
      'Authorization': `Bearer ${req.headers.angelonetoken}`,
        'Content-Type': 'application/json', 
        'Accept': 'application/json', 
        'X-UserType': 'USER', 
        'X-SourceID': 'WEB', 
       'X-ClientLocalIP': process.env.CLIENT_LOCAL_IP, 
            'X-ClientPublicIP': process.env.CLIENT_PUBLIC_IP, 
            'X-MACAddress': process.env.MAC_Address, 
            'X-PrivateKey': process.env.PRIVATE_KEY, 
    },
    data : data
    };

      let resData = await axios(config)

       if(resData.data.status==true){

    // normalize if needed
    const where = { orderid: req.body.orderid };

    // Postgres can return the updated row(s)
    const [affected, rows] = await Order.update(
     req.body,
      {
        where,
        returning: true,            // only works on Postgres
      }
    );

    if (affected === 0) {

         return res.json({
            status: false,
            statusCode:404,
            message: "Order not found for given orderid & variety",
            data:null,
            error: "Order not found for given orderid & variety",
        });     
    }
        return res.json({
        status: true,
        statusCode:201,
        data:null,
        message: resData?.data?.status
    });

    }else{
        
     return res.json({
            status: false,
            statusCode:data.errorcode,
            message: resData?.data?.message,
            data:null,
            error: "Unexpected error occurred. Please try again.",
        });     

    }
      	
   }catch(error){
       
     return res.json({
            status: false,
            statusCode:500,
            message: "Unexpected error occurred. Please try again.",
            data:null,
            error: error.message,
        });

   }

}






