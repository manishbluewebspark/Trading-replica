
import axios from 'axios';
import dayjs from "dayjs";
import Trade from "../models/tradeModel.js"
import Order from '../models/orderModel.js';
import { Op } from 'sequelize';



let saveData = [
   
    {
      "exchange": "NFO",
      "producttype": "INTRADAY",
      "tradingsymbol": "NIFTY04NOV2525700CE",
      "token":"47664",
      "instrumenttype": "OPTIDX",
      "symbolgroup": "XX",
      "strikeprice": 25700,
      "optiontype": "CE",
      "expirydate": "04NOV2025",
      "marketlot": "75",
      "precision": "2",
      "multiplier": "-1",
      "tradevalue": 5343.75,
      "transactiontype": "SELL",
      "fillprice": 23.75,
      "fillsize": "225",
      "orderid": "251104000500889",
      "fillid": "9090605",
      "filltime": "12:36:33"
    },
    {
      "exchange": "NFO",
      "producttype": "INTRADAY",
      "tradingsymbol": "NIFTY04NOV2525700PE",
      "token":"47667",
      "instrumenttype": "OPTIDX",
      "symbolgroup": "XX",
      "strikeprice": 25700,
      "optiontype": "PE",
      "expirydate": "04NOV2025",
      "marketlot": "75",
      "precision": "2",
      "multiplier": "-1",
      "tradevalue": 5295,
      "transactiontype": "BUY",
      "fillprice": 70.6,
      "fillsize": "75",
      "orderid": "251104000364251",
      "fillid": "7456081",
      "filltime": "11:41:04"
    },
    {
      "exchange": "NFO",
      "producttype": "INTRADAY",
      "tradingsymbol": "NIFTY04NOV2525700PE",
        "token":"47667",
      "instrumenttype": "OPTIDX",
      "symbolgroup": "XX",
      "strikeprice": 25700,
      "optiontype": "PE",
      "expirydate": "04NOV2025",
      "marketlot": "75",
      "precision": "2",
      "multiplier": "-1",
      "tradevalue": 7185,
      "transactiontype": "BUY",
      "fillprice": 47.9,
      "fillsize": "150",
      "orderid": "251104000346164",
      "fillid": "5983388",
      "filltime": "11:08:55"
    },
    {
      "exchange": "NFO",
      "producttype": "INTRADAY",
      "tradingsymbol": "NIFTY04NOV2525700PE",
        "token":"47667",
      "instrumenttype": "OPTIDX",
      "symbolgroup": "XX",
      "strikeprice": 25700,
      "optiontype": "PE",
      "expirydate": "04NOV2025",
      "marketlot": "75",
      "precision": "2",
      "multiplier": "-1",
      "tradevalue": 7203.75,
      "transactiontype": "BUY",
      "fillprice": 96.05,
      "fillsize": "75",
      "orderid": "251104000678569",
      "fillid": "13815937",
      "filltime": "14:23:32"
    },
    {
      "exchange": "NFO",
      "producttype": "INTRADAY",
      "tradingsymbol": "NIFTY04NOV2525700PE",
        "token":"47667",
      "instrumenttype": "OPTIDX",
      "symbolgroup": "XX",
      "strikeprice": 25700,
      "optiontype": "PE",
      "expirydate": "04NOV2025",
      "marketlot": "75",
      "precision": "2",
      "multiplier": "-1",
      "tradevalue": 7267.5,
      "transactiontype": "SELL",
      "fillprice": 48.45,
      "fillsize": "150",
      "orderid": "251104000353321",
      "fillid": "6017088",
      "filltime": "11:09:33"
    },
    {
      "exchange": "NFO",
      "producttype": "INTRADAY",
      "tradingsymbol": "NIFTY04NOV2525700CE",
       "token":"47664",
      "instrumenttype": "OPTIDX",
      "symbolgroup": "XX",
      "strikeprice": 25700,
      "optiontype": "CE",
      "expirydate": "04NOV2025",
      "marketlot": "75",
      "precision": "2",
      "multiplier": "-1",
      "tradevalue": 6618.75,
      "transactiontype": "BUY",
      "fillprice": 17.65,
      "fillsize": "375",
      "orderid": "251104000598481",
      "fillid": "11326669",
      "filltime": "13:38:33"
    },
    {
      "exchange": "NFO",
      "producttype": "INTRADAY",
      "tradingsymbol": "NIFTY04NOV2525700CE",
       "token":"47664",
      "instrumenttype": "OPTIDX",
      "symbolgroup": "XX",
      "strikeprice": 25700,
      "optiontype": "CE",
      "expirydate": "04NOV2025",
      "marketlot": "75",
      "precision": "2",
      "multiplier": "-1",
      "tradevalue": 1275,
      "transactiontype": "BUY",
      "fillprice": 17,
      "fillsize": "75",
      "orderid": "251104000524797",
      "fillid": "9938105",
      "filltime": "13:03:00"
    },
    {
      "exchange": "NFO",
      "producttype": "INTRADAY",
      "tradingsymbol": "NIFTY04NOV2525700CE",
       "token":"47664",
      "instrumenttype": "OPTIDX",
      "symbolgroup": "XX",
      "strikeprice": 25700,
      "optiontype": "CE",
      "expirydate": "04NOV2025",
      "marketlot": "75",
      "precision": "2",
      "multiplier": "-1",
      "tradevalue": 1350,
      "transactiontype": "SELL",
      "fillprice": 18,
      "fillsize": "75",
      "orderid": "251104000545842",
      "fillid": "10285949",
      "filltime": "13:12:37"
    },
    {
      "exchange": "NFO",
      "producttype": "INTRADAY",
      "tradingsymbol": "NIFTY04NOV2525700PE",
        "token":"47667",
      "instrumenttype": "OPTIDX",
      "symbolgroup": "XX",
      "strikeprice": 25700,
      "optiontype": "PE",
      "expirydate": "04NOV2025",
      "marketlot": "75",
      "precision": "2",
      "multiplier": "-1",
      "tradevalue": 10402.5,
      "transactiontype": "BUY",
      "fillprice": 69.35,
      "fillsize": "150",
      "orderid": "251104000589656",
      "fillid": "13041972",
      "filltime": "14:11:02"
    },
    {
      "exchange": "NFO",
      "producttype": "INTRADAY",
      "tradingsymbol": "NIFTY04NOV2525700PE",
        "token":"47667",
      "instrumenttype": "OPTIDX",
      "symbolgroup": "XX",
      "strikeprice": 25700,
      "optiontype": "PE",
      "expirydate": "04NOV2025",
      "marketlot": "75",
      "precision": "2",
      "multiplier": "-1",
      "tradevalue": 7203.75,
      "transactiontype": "BUY",
      "fillprice": 96.05,
      "fillsize": "75",
      "orderid": "251104000678569",
      "fillid": "13815938",
      "filltime": "14:23:32"
    },
    {
      "exchange": "NFO",
      "producttype": "INTRADAY",
      "tradingsymbol": "NIFTY04NOV2525700CE",
       "token":"47664",
      "instrumenttype": "OPTIDX",
      "symbolgroup": "XX",
      "strikeprice": 25700,
      "optiontype": "CE",
      "expirydate": "04NOV2025",
      "marketlot": "75",
      "precision": "2",
      "multiplier": "-1",
      "tradevalue": 8625,
      "transactiontype": "BUY",
      "fillprice": 23,
      "fillsize": "375",
      "orderid": "251104000501622",
      "fillid": "9369389",
      "filltime": "12:45:19"
    },
    {
      "exchange": "NFO",
      "producttype": "INTRADAY",
      "tradingsymbol": "NIFTY04NOV2525700CE",
       "token":"47664",
      "instrumenttype": "OPTIDX",
      "symbolgroup": "XX",
      "strikeprice": 25700,
      "optiontype": "CE",
      "expirydate": "04NOV2025",
      "marketlot": "75",
      "precision": "2",
      "multiplier": "-1",
      "tradevalue": 14137.5,
      "transactiontype": "SELL",
      "fillprice": 18.85,
      "fillsize": "750",
      "orderid": "251104000601341",
      "fillid": "11376146",
      "filltime": "13:39:12"
    },
    {
      "exchange": "NFO",
      "producttype": "INTRADAY",
      "tradingsymbol": "NIFTY04NOV2525700CE",
       "token":"47664",
      "instrumenttype": "OPTIDX",
      "symbolgroup": "XX",
      "strikeprice": 25700,
      "optiontype": "CE",
      "expirydate": "04NOV2025",
      "marketlot": "75",
      "precision": "2",
      "multiplier": "-1",
      "tradevalue": 6720,
      "transactiontype": "BUY",
      "fillprice": 22.4,
      "fillsize": "300",
      "orderid": "251104000482889",
      "fillid": "8974404",
      "filltime": "12:31:35"
    },
    {
      "exchange": "NFO",
      "producttype": "INTRADAY",
      "tradingsymbol": "NIFTY04NOV2525700PE",
        "token":"47667",
      "instrumenttype": "OPTIDX",
      "symbolgroup": "XX",
      "strikeprice": 25700,
      "optiontype": "PE",
      "expirydate": "04NOV2025",
      "marketlot": "75",
      "precision": "2",
      "multiplier": "-1",
      "tradevalue": 4563.75,
      "transactiontype": "SELL",
      "fillprice": 60.85,
      "fillsize": "75",
      "orderid": "251104000424302",
      "fillid": "7572110",
      "filltime": "11:44:16"
    },
    {
      "exchange": "NFO",
      "producttype": "INTRADAY",
      "tradingsymbol": "NIFTY04NOV2525700CE",
       "token":"47664",
      "instrumenttype": "OPTIDX",
      "symbolgroup": "XX",
      "strikeprice": 25700,
      "optiontype": "CE",
      "expirydate": "04NOV2025",
      "marketlot": "75",
      "precision": "2",
      "multiplier": "-1",
      "tradevalue": 6618.75,
      "transactiontype": "BUY",
      "fillprice": 17.65,
      "fillsize": "375",
      "orderid": "251104000598481",
      "fillid": "11326670",
      "filltime": "13:38:33"
    },
    {
      "exchange": "NFO",
      "producttype": "INTRADAY",
      "tradingsymbol": "NIFTY04NOV2525700CE",
       "token":"47664",
      "instrumenttype": "OPTIDX",
      "symbolgroup": "XX",
      "strikeprice": 25700,
      "optiontype": "CE",
      "expirydate": "04NOV2025",
      "marketlot": "75",
      "precision": "2",
      "multiplier": "-1",
      "tradevalue": 8868.75,
      "transactiontype": "SELL",
      "fillprice": 23.65,
      "fillsize": "375",
      "orderid": "251104000516707",
      "fillid": "9437400",
      "filltime": "12:47:46"
    },
    {
      "exchange": "NFO",
      "producttype": "INTRADAY",
      "tradingsymbol": "NIFTY04NOV2525700PE",
        "token":"47667",
      "instrumenttype": "OPTIDX",
      "symbolgroup": "XX",
      "strikeprice": 25700,
      "optiontype": "PE",
      "expirydate": "04NOV2025",
      "marketlot": "75",
      "precision": "2",
      "multiplier": "-1",
      "tradevalue": 10560,
      "transactiontype": "SELL",
      "fillprice": 70.4,
      "fillsize": "150",
      "orderid": "251104000668755",
      "fillid": "13077155",
      "filltime": "14:11:27"
    },
    {
      "exchange": "NFO",
      "producttype": "INTRADAY",
      "tradingsymbol": "NIFTY04NOV2525700PE",
        "token":"47667",
      "instrumenttype": "OPTIDX",
      "symbolgroup": "XX",
      "strikeprice": 25700,
      "optiontype": "PE",
      "expirydate": "04NOV2025",
      "marketlot": "75",
      "precision": "2",
      "multiplier": "-1",
      "tradevalue": 11955,
      "transactiontype": "SELL",
      "fillprice": 79.7,
      "fillsize": "150",
      "orderid": "251104000722837",
      "fillid": "14007983",
      "filltime": "14:29:29"
    },
    {
      "exchange": "NFO",
      "producttype": "INTRADAY",
      "tradingsymbol": "NIFTY04NOV2525700CE",
       "token":"47664",
      "instrumenttype": "OPTIDX",
      "symbolgroup": "XX",
      "strikeprice": 25700,
      "optiontype": "CE",
      "expirydate": "04NOV2025",
      "marketlot": "75",
      "precision": "2",
      "multiplier": "-1",
      "tradevalue": 1785,
      "transactiontype": "SELL",
      "fillprice": 23.8,
      "fillsize": "75",
      "orderid": "251104000500889",
      "fillid": "9090604",
      "filltime": "12:36:33"
    }
  ]

  const saveTradeData = async function () {
      
       await Trade.bulkCreate(saveData, { ignoreDuplicates: true });

       console.log('save trade data');
       
  } 

//   saveTradeData()




export const getPerticularTradeBook = async (req, res) => {
    try {

    let orderId = req.body.orderId    

    var config = {
        method: 'get',
        url: `https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/details${orderId}`,
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

        const {data} = await axios(config);

         if(data.status==true) {

            return res.json({
            status: true,
            statusCode:200,
            data: data.data,
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

export const getTradeBook = async (req, res) => {
    try {
        
    var config = {
        method: 'get',
        url: 'https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/getTradeBook',
        headers: { 
            'Authorization': `Bearer ${req.headers.angelonetoken}`,
            //  'Authorization': `Bearer ${token}`,
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

        const {data} = await axios(config);

         if(data.status==true) {

            return res.json({
            status: true,
            statusCode:200,
            data: data.data,
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

        console.log('start',error,'hello');
        

         return res.json({
            status: false,
            statusCode:500,
            message: "Unexpected error occurred. Please try again.",
            data:null,
            error: error.message,
        });

    }
};

export const getTradeBookWithDateFilter = async (req, res) => {
    try {

         // Convert to Dayjs objects for easy comparison
        const from = dayjs(req.body[0]);
        const to = dayjs(req.body[1]);


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

        const {data} = await axios(config);

         if(data.status==true) {


            

             // ✅ Filter trades within the date range
            const filtered = data.data.filter((t) => {
            const tradeTime = dayjs(t.updatetime, "DD-MMM-YYYY HH:mm:ss");
            return tradeTime.isAfter(from) && tradeTime.isBefore(to);
        });

        console.log(filtered,'qaz hello');

            return res.json({
            status: true,
            statusCode:200,
            data:filtered,
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

        console.log('start',error,'hello');
        

         return res.json({
            status: false,
            statusCode:500,
            message: "Unexpected error occurred. Please try again.",
            data:null,
            error: error.message,
        });

    }
};



export const getTradeBookInTable = async (req, res) => {
    try {
      
     const tradesData = await Order.findAll({
      where: {
        status: { [Op.in]: ['complete', 'completed'] },
        userId:req.userId,
        
      },
      order: [['createdAt', 'DESC']], // 👈 sorts in descending order (latest first)
      raw: true,
    });
        

      return res.json({
            status: true,
            statusCode:200,
            data:tradesData,
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