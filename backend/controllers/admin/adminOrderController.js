import axios from "axios";
import Order from "../../models/orderModel.js";
import User from "../../models/userModel.js";
import AngelOneToken from "../../models/angelOneToken.js"
import Credential from "../../models/angelOneCredential.js";
import { generateTOTP } from "../../utils/generateTOTP.js";
import { getManyTokensFromSession, setTokensInSession } from "../../utils/sessionUtils.js";

const ANGEL_ONE_PLACE_URL = "https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/placeOrder";


const ANGEL_ONE_DETAILS_URL = (uniqueOrderId) =>`https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/details/${uniqueOrderId}`;


const angelHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
  Accept: "application/json",
  "X-UserType": "USER",
  "X-SourceID": "WEB",
  "X-ClientLocalIP": "127.0.0.1",
  "X-ClientPublicIP": "127.0.0.1",
  "X-MACAddress": "00-00-00-00-00-00",
     'X-PrivateKey': process.env.PRIVATE_KEY, 
});






/* -------------------------- Controller: bulk place ------------------------- */

export const adminPlaceMultipleOrder = async (req, res) => {
  try {

    // 1) Validate input
    const {
      variety, symbol, token,transactiontype,exch_seg,      
      orderType,producttype,duration,price,quantity,
      users,         // [{ id, angelToken, ... }]
    } = req.body 

    if (!Array.isArray(users) || users.length === 0) {

       return res.json({
            status: false,
            statusCode:400,
            message: "Invalid data: users[] required",
            data:null,
            error:' Invalid data: users[] required',
        });
    }

    if (!symbol || !token || !transactiontype || !exch_seg || !orderType || !quantity) {

        return res.json({
            status: false,
            statusCode:400,
            message: "Missing required order fields",
            data:null,
            error:' Missing required order fields',
        });

    }

        // 2) Build order payload (exact keys AngelOne expects)
        const orderData = {
        variety,
        tradingsymbol: symbol,
        symboltoken: token,
        transactiontype,
        exchange: exch_seg,
        ordertype: orderType,
        producttype: producttype || "INTRADAY",
        duration: duration || "DAY",
        price,
        squareoff: "0",
        stoploss: "0",
        quantity,
        };

    // 3) Process all users in parallel
    const results = await Promise.all(
      users.map(async (user) => {
        
        // 3a) Create local INITIATED record
        const localOrder = await Order.create({
          userId: user.id,
          ...orderData,
          status: "INITIATED",
        });

        try {


          const resToken = await AngelOneToken.findOne({
          where: { userId:user.id  },
        });

        console.log(resToken.dataValues.authToken);
        

          // 3b) Place order with AngelOne
          const placeRes = await axios.post(ANGEL_ONE_PLACE_URL, orderData, {
            headers: angelHeaders(resToken.dataValues.authToken),
          });

          const { status, data, message } = placeRes?.data || {};

          const orderid = data?.orderid || null;

          const uniqueOrderId = data?.uniqueorderid || null;

          // 3c) Update local → PLACED/FAILED
          await localOrder.update({
            status: status ? "PLACED" : "FAILED",
            orderid,
            uniqueorderid:uniqueOrderId,
          });

          // 3d) If we have uniqueOrderId, fetch details & update final status
          if (uniqueOrderId) {
            try {
              const detailsRes = await axios.get(
                ANGEL_ONE_DETAILS_URL(uniqueOrderId),
                { headers: angelHeaders(resToken.dataValues.authToken) }
              );

              // Try common fields that carry broker status
              const brokerStatus = detailsRes?.data.status

              await localOrder.update({
                status: detailsRes?.data.data.status,
                instrumenttype:detailsRes?.data.data.instrumenttype,
                cancelsize:detailsRes?.data.data.cancelsize,
              });

              return {
                userId: user.id,
                localOrderId: localOrder.id,
                result: "success",
                orderid,
                uniqueOrderId,
                status: brokerStatus,
              };

            } catch (detailsErr) {

              return {
                userId: user.id,
                localOrderId: localOrder.id,
                result: "placed_no_details",
                orderid,
                uniqueOrderId,
                error: detailsErr?.message,
              };
            }
          }

          // No uniqueOrderId returned, still return placed result
          return {
            userId: user.id,
            localOrderId: localOrder.id,
            result: status ? "placed" : "failed",
            orderid,
            uniqueOrderId,
            message,
          };
        } catch (placeErr) {
          // 3e) Broker place failed → update local → FAILED
          await localOrder.update({
            status: "FAILED",
            errorMessage: safeErrPayload(placeErr),
          });

          return {
            userId: user.id,
            localOrderId: localOrder.id,
            result: "failed",
            error: placeErr?.message,
          };
        }
      })
    );

     return res.json({
            status: true,
            statusCode:201,
            message: "Bulk order processing complete",
            data:null,
            error:null,
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



export const AdminLoginMultipleUser = async (req, res) => {
  try {

    // 1️⃣ Get all users
      const users = await User.findAll({
        where: { role: 'user' }
      });

    if (!users.length) {

       return res.json({
            status: false,
            statusCode:404,
            message: "No Users Found",
            data:null,
            error: 'No Users Found',
        });
       
    }


  
    // 2️⃣ Get credentials for all users
    const credentials = await Credential.findAll()

    if (!credentials.length) {

       return res.json({
            status: false,
            statusCode:404,
            message: "No credentials found",
            data:null,
            error: 'No credentials found',
        });
    }

   
    const results = [];

    // 3️⃣ Loop through users and login each one
    for (const user of users) {

     const cred = credentials.find((c) => c.dataValues.userId === user.id);

      if (!cred) {
        results.push({ userId: user.id, status: "failed", error: "No credentials" });
        continue;
      }

       let totpCode = await generateTOTP(cred.dataValues.totpSecret) 

      try {
       
        var reqDataForLogin = JSON.stringify({
          "clientcode":cred.dataValues.clientId,
          "password":cred.dataValues.password,
          "totp":totpCode, 
        });

          var config = {
          method: 'post',
          url: 'https://apiconnect.angelone.in//rest/auth/angelbroking/user/v1/loginByPassword',

          headers : {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-UserType': 'USER',
            'X-SourceID': 'WEB',
            'X-ClientLocalIP': process.env.CLIENT_LOCAL_IP, 
                'X-ClientPublicIP': process.env.CLIENT_PUBLIC_IP, 
                'X-MACAddress': process.env.MAC_Address, 
                'X-PrivateKey': process.env.PRIVATE_KEY, 
          },
          data:reqDataForLogin
        };

         let response = await axios(config);


        if(response.data.status==true){

           const token =  response?.data?.data?.jwtToken

          results.push({ userId: user.id, authToken:token, status: "success" });

        } else{
            
          results.push({ userId: user.id, status: "failed", error: "No token in response" });
        }     

      } catch (err) {

        
        results.push({
          userId: user.id,
          status: "failed",
          error: err.message || "Login failed",
        });
      }
    }

    await AngelOneToken.destroy({ where: {} });   // deletes everything

     // ✅ Bulk insert
     await AngelOneToken.bulkCreate(results, {
      ignoreDuplicates: true, // skip if unique constraint (userId) already exists
    });

    return res.json({
        status: true,
        statusCode:200,
        message: "Users successfully login",
        data:results[0],
        error:null
      });

   
  } catch (error) {

    console.log(error);
    
   
    return res.json({
            status: false,
            statusCode:500,
            message: "Unexpected error occurred. Please try again.",
            data:null,
            error: error.message,
        });
  }
};

export const AdminGetTotalUsers = async function (req,res,next) {
  
    try {

       // ✅ Get total number of users with role = 'user'
      const totalNormalUsers = await User.count({
        where: { role: "user" },
      });

      return res.json({
        status: true,
        statusCode:200,
        message: "User stats fetched successfully",
        data:totalNormalUsers,
        error:null
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
 
}


export const AdminLoginMultipleUser1 = async function (req,res,next) {

      try {
        

        // 1) Load all users you want to login (adjust WHERE as per your app logic)
        const users = await User.findAll({
        // Example filters; customize:
        // where: { role: "user", isChecked: true },
        attributes: ["id"], // you only need id to join credentials
        raw: true,
        });

    if (!users.length) {
      return res.status(404).json({ message: "No users found to login." });
    }

    const userIds = users.map((u) => u.id);

    // 2) Load credentials for these users (assumes Credential has userId, clientcode, password(pin), totp, optional apiKey)
    const creds = await Credential.findAll({
      where: { userId: userIds },
      attributes: ["userId", "clientId", "totpSecret", "password"],
      raw: true,
    });

     // Index credentials by userId for quick access
    const credsByUserId = new Map(creds.map((c) => [c.userId, c]));

      } catch (error) {
        
      }
       
}


export const adminPlaceMultipleOrder1 = async function (req,res,next) {
  
    try {

        // 1) Build order payload from request
            const orderData = {
            variety: req.body.variety,
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

            const users = req.body.users || [];
            if (!Array.isArray(users) || users.length === 0) {
            return res.status(400).json({ message: "Invalid data: users[] required" });
            }


          

           if ( users.length === 0) {

            return res.status(400).json({ message: "Invalid data" });
         }
          
        const results = await Promise.all(users.map(async (user) => {

            try {
                const res = await axios.post(ANGEL_ONE_ORDER_URL, orderData, {
                headers: {
                    Authorization: `Bearer ${user.angelToken}`,
                    "Content-Type": "application/json",
                },
                });

                return { userId: user.id, status: "success", data: res.data };

            } catch (err) {

                return { userId: user.id, status: "failed", message: err.message };
            }
        }));

        return res.json({
        message: "Order placement completed",
        results,
        });
       
    } catch (error) {
        

    }    
 
}



































