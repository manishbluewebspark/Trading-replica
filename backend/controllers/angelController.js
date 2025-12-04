import AngelOneCredentialer from '../models/angelOneCredential.js'
import User from "../models/userModel.js"
import { connectSmartSocket, emitOrderGet, isSocketReady } from '../services/smartapiFeed.js';
import { generateTOTP } from '../utils/generateTOTP.js';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import dayjs from "dayjs";
import Order from '../models/orderModel.js';



// Step 1: Redirect to AngelOne login
export const loginWithAngelOne = async (req, res) => {

  const { ANGELONE_CLIENT_ID, ANGELONE_REDIRECT_URI } = process.env;

  const authUrl = `https://smartapi.angelbroking.com/publisher-login?api_key=${ANGELONE_CLIENT_ID}&redirect_uri=${encodeURIComponent(ANGELONE_REDIRECT_URI)}`;

  res.redirect(authUrl);

};


export const angelOneCallback = async (req, res) => {

  const { auth_token, feed_token, refresh_token } = req.query;

  if (!auth_token) {
    return res.status(400).json({ message: "Missing auth_token in callback" });
  }

  try {

    const angelUser = {
      clientcode: `774795`,
      name: "AngelOne User",
      email: `jhaamit7747@gmail.com` 
    };


    // Save or update user in DB
    let user = await User.findOne({ where: { angeloneId: angelUser.clientcode } });

    if (!user) {
      user = await User.create({
        firstName: "AngelOne",
        lastName: "User",
        password: "dummyPassword123!", 
        name: angelUser.name,
        email: angelUser.email,
        angeloneId: angelUser.clientcode,
        authToken: auth_token,
        feedToken: feed_token,
        refreshToken: refresh_token
      });
      
    } else {
      user.name = angelUser.name;
      user.email = angelUser.email || user.email;
      user.authToken = auth_token;
      user.feedToken = feed_token;
      user.refreshToken = refresh_token;
      await user.save();
      
    }

    // Generate JWT
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "1d" });
    console.log("🎯 JWT generated:", token);

    res.redirect(
      `${process.env.FRONTEND_URL}/login-success?token=${token}&user=${encodeURIComponent(JSON.stringify(user))}`
    );

  } catch (error) {
    console.error("💥 Error in AngelOne Callback:", error.message);
    res.status(500).json({ message: "AngelOne login failed", error: error.message });
  }
};


export const loginWithTOTPInAngelOne = async function (req,res,next) {
    try {
        
    let existing = await AngelOneCredentialer.findOne({ where: { userId: req.userId } });

    if (!existing) {
      return res.json({
        status: false,
        statusCode: 404,
        message: "No credentials found for this user.",
        data: null,
      });
    }

   const createdData = existing.dataValues;

   let totpCode = await generateTOTP(createdData.totpSecret) 

   
     
      var data2 = JSON.stringify({
      "clientcode":createdData.clientId,
      "password":createdData.password,
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
      data:data2
    };

    let {data} = await axios(config);



     if(data.status==true) {

      await User.update( {
        authToken: data.data.jwtToken,
        feedToken: data.data.feedToken,
        refreshToken: data.data.refreshToken,
        angelLoginUser:true,
        angelLoginExpiry: new Date(Date.now() + 10 * 60 * 60 * 1000), // 10 hours
      },
      {
        where: { id: req.userId },
        returning: true, // optional, to get the updated record
      }
    );

        console.log(isSocketReady(req.userId),'gggg');
        

        if (isSocketReady(req.userId)) {
        console.log('✅ WebSocket is connected!');
      } else {
          connectSmartSocket(req.userId,data.data.jwtToken,data.data.feedToken,createdData.clientId)
      }

      return res.status(200).json({
              status: true,
              data: data.data
          });

     }else{

          return res.json({
              status: false,
              data:null,
              statusCode:data.errorCode,
              message:data.message
          });
     }

  } catch (error) {

    return res.json({
              status: false,
              data:null,
              statusCode:401,
              message:error.message
          });
  }
}


export const getAngelOneProfileFund = async function (req,res,next) {
    try {

     
      var config = {
      method: 'get',
      url: 'https://apiconnect.angelone.in/rest/secure/angelbroking/user/v1/getRMS',

      headers : {
        // 'Authorization': `Bearer ${auth_token}`,
         'Authorization': `Bearer ${req.headers.angelonetoken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-UserType': 'USER',
        'X-SourceID': 'WEB',
        'X-ClientLocalIP': process.env.CLIENT_LOCAL_IP, 
            'X-ClientPublicIP': process.env.CLIENT_PUBLIC_IP, 
            'X-MACAddress': process.env.MAC_Address, 
            'X-PrivateKey': process.env.PRIVATE_KEY, 
      }
    };

    let {data} = await axios(config);


     if(data.status==true) {

      var configTrade = {
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

          
      let getTradeData = await axios(configTrade);

      if(getTradeData.data.status==true) {

        return res.json({
              status: true,
              statusCode:200,
              data: data.data,
              totalOrders:getTradeData.data.data||0,
          });
      }else{
          return res.json({
              status: false,
              data:null,
              statusCode:getTradeData.data.errorCode,
              message:getTradeData.error.message
          });
     }

     }else{
          return res.json({
              status: false,
              data:null,
              statusCode:data.errorCode,
              message:data.message
          });
     }

  } catch (error) {

    return res.json({
              status: false,
              data:null,
              statusCode:401,
              message:error.message
          });
  }
}


export const getAngelOneOrder = async (req, res,next) => {
    try {

      const angelToken = 'eyJhbGciOiJIUzUxMiJ9.eyJ1c2VybmFtZSI6Ik0xNjI0MjMiLCJyb2xlcyI6MCwidXNlcnR5cGUiOiJVU0VSIiwidG9rZW4iOiJleUpoYkdjaU9pSlNVekkxTmlJc0luUjVjQ0k2SWtwWFZDSjkuZXlKMWMyVnlYM1I1Y0dVaU9pSmpiR2xsYm5RaUxDSjBiMnRsYmw5MGVYQmxJam9pZEhKaFpHVmZZV05qWlhOelgzUnZhMlZ1SWl3aVoyMWZhV1FpT2pZc0luTnZkWEpqWlNJNklqTWlMQ0prWlhacFkyVmZhV1FpT2lJeFpUTmtOMlk1WVMwME5EVmlMVE5rWXpVdE9URXhZUzAyTkdWbU9UWTROakExWW1RaUxDSnJhV1FpT2lKMGNtRmtaVjlyWlhsZmRqSWlMQ0p2Ylc1bGJXRnVZV2RsY21sa0lqbzJMQ0p3Y205a2RXTjBjeUk2ZXlKa1pXMWhkQ0k2ZXlKemRHRjBkWE1pT2lKaFkzUnBkbVVpZlN3aWJXWWlPbnNpYzNSaGRIVnpJam9pWVdOMGFYWmxJbjE5TENKcGMzTWlPaUowY21Ga1pWOXNiMmRwYmw5elpYSjJhV05sSWl3aWMzVmlJam9pVFRFMk1qUXlNeUlzSW1WNGNDSTZNVGMyTkRFME5UWXlOQ3dpYm1KbUlqb3hOelkwTURVNU1EUTBMQ0pwWVhRaU9qRTNOalF3TlRrd05EUXNJbXAwYVNJNklqTXlNREJpWW1FMExUTTBNV1F0TkRJMU15MWlPVEkxTFRsa1lqRXdabVU0TmpkaFpDSXNJbFJ2YTJWdUlqb2lJbjAuZE8zWUUxSXdTRVhJN0ZtemtoMGFGU1lOYjEweGc3cUFlRkNPUXktd2FhX0t3bGc1Y3M2U0FRcllMUHp2WGM0ZWRwMkdPSzNJcVpfVlJCLTVkMHVOcmNkM3h4UW5Xb3dFMFFUSVc0dElPZHUwX3F4Ty16X1VqUElMSU9rRjZHYXdFUWNLbS1qS0FGa3psQVVfYUhuZVotS1JWd3JhcVQwLTVHTmxZeWViQjRvIiwiQVBJLUtFWSI6InlKYnJubmt4IiwiWC1PTEQtQVBJLUtFWSI6dHJ1ZSwiaWF0IjoxNzY0MDU5MjI0LCJleHAiOjE3NjQwOTU0MDB9.OA0TlacLUm8EuI4jKGblV1teFfxLB1t5RKHpmQZRuqR5Abo_yHyDn_nD5vuu3W_Y0e4iwly5t3xgTK7LdUIBJQ'

  if (!angelToken) {
    
     return res.json({
            status: false,
            statusCode:401,
            message: "Login In AngelOne Account",
            error: null,
        });
  }
      
    
        var config = {
        method: 'get',
        url: 'https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/getOrderBook',
        headers: { 
           'Authorization': `Bearer ${angelToken}`,
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

         emitOrderGet('')

        if(data.status==true&&data.data!==null) {


       

            return res.json({
            status: true,
            statusCode:200,
           data:  data.data,
            message:'get data'
        });

         }else if(data.status==true&&data.data===null){

            return res.json({
            status: false,
            statusCode:200,
            data:  [],
            message:'Angel Trading Data is Empty'
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


export const getAngelOneProfile = async function (req,res,next) {
    try {

      var config = {
      method: 'get',
      url: 'https://apiconnect.angelone.in/rest/secure/angelbroking/user/v1/getProfile',
      headers : {
         'Authorization': `Bearer ${req.headers.angelonetoken}`,
          // 'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-UserType': 'USER',
        'X-SourceID': 'WEB',
        'X-ClientLocalIP': process.env.CLIENT_LOCAL_IP, 
            'X-ClientPublicIP': process.env.CLIENT_PUBLIC_IP, 
            'X-MACAddress': process.env.MAC_Address, 
            'X-PrivateKey': process.env.PRIVATE_KEY, 
      }
    };

    let {data} = await axios(config);

     if(data.status==true) {

      return res.status(200).json({
              status: true,
              data: data.data
          });

     }else{

          return res.json({
              status: false,
              data:null,
              statusCode:data.errorCode,
              message:data.message
          });
     }

  } catch (error) {

    return res.json({
              status: false,
              data:null,
              statusCode:401,
              message:error.message
          });
  }
}

export const reGenerateTokenWithAngelOne = async function (req,res,next) {
    try {

          var reqData = JSON.stringify({
            "refreshToken":req.body.refresh_token
          });

          var config = {
          method: 'post',
          url: 'https://apiconnect.angelone.in/rest/auth/angelbroking/jwt/v1/generateTokens',
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
        data : reqData
      };

    let {data} = await axios(config);

       if(data.status==true) {

            return res.json({
            success: true,
            statusCode:200,
            data: data.data,
            message:'get data'
        });

         }else{

        return res.json({
            success: false,
            statusCode:data.errorcode,
            message: "Unexpected error occurred. Please try again.",
            data:null,
            error: data.message,
        });
    }

  } catch (error) {

    res.status(500).json({
            success: false,
            message: error.message,
        });

  }
}

export const getTradeBook = async (req, res) => {
    try {
        
      const angelToken = 'eyJhbGciOiJIUzUxMiJ9.eyJ1c2VybmFtZSI6Ik0xNjI0MjMiLCJyb2xlcyI6MCwidXNlcnR5cGUiOiJVU0VSIiwidG9rZW4iOiJleUpoYkdjaU9pSlNVekkxTmlJc0luUjVjQ0k2SWtwWFZDSjkuZXlKMWMyVnlYM1I1Y0dVaU9pSmpiR2xsYm5RaUxDSjBiMnRsYmw5MGVYQmxJam9pZEhKaFpHVmZZV05qWlhOelgzUnZhMlZ1SWl3aVoyMWZhV1FpT2pZc0luTnZkWEpqWlNJNklqTWlMQ0prWlhacFkyVmZhV1FpT2lJeFpUTmtOMlk1WVMwME5EVmlMVE5rWXpVdE9URXhZUzAyTkdWbU9UWTROakExWW1RaUxDSnJhV1FpT2lKMGNtRmtaVjlyWlhsZmRqSWlMQ0p2Ylc1bGJXRnVZV2RsY21sa0lqbzJMQ0p3Y205a2RXTjBjeUk2ZXlKa1pXMWhkQ0k2ZXlKemRHRjBkWE1pT2lKaFkzUnBkbVVpZlN3aWJXWWlPbnNpYzNSaGRIVnpJam9pWVdOMGFYWmxJbjE5TENKcGMzTWlPaUowY21Ga1pWOXNiMmRwYmw5elpYSjJhV05sSWl3aWMzVmlJam9pVFRFMk1qUXlNeUlzSW1WNGNDSTZNVGMyTkRFME5UWXlOQ3dpYm1KbUlqb3hOelkwTURVNU1EUTBMQ0pwWVhRaU9qRTNOalF3TlRrd05EUXNJbXAwYVNJNklqTXlNREJpWW1FMExUTTBNV1F0TkRJMU15MWlPVEkxTFRsa1lqRXdabVU0TmpkaFpDSXNJbFJ2YTJWdUlqb2lJbjAuZE8zWUUxSXdTRVhJN0ZtemtoMGFGU1lOYjEweGc3cUFlRkNPUXktd2FhX0t3bGc1Y3M2U0FRcllMUHp2WGM0ZWRwMkdPSzNJcVpfVlJCLTVkMHVOcmNkM3h4UW5Xb3dFMFFUSVc0dElPZHUwX3F4Ty16X1VqUElMSU9rRjZHYXdFUWNLbS1qS0FGa3psQVVfYUhuZVotS1JWd3JhcVQwLTVHTmxZeWViQjRvIiwiQVBJLUtFWSI6InlKYnJubmt4IiwiWC1PTEQtQVBJLUtFWSI6dHJ1ZSwiaWF0IjoxNzY0MDU5MjI0LCJleHAiOjE3NjQwOTU0MDB9.OA0TlacLUm8EuI4jKGblV1teFfxLB1t5RKHpmQZRuqR5Abo_yHyDn_nD5vuu3W_Y0e4iwly5t3xgTK7LdUIBJQ'

     if (!angelToken) {
    
     return res.json({
            status: false,
            statusCode:401,
            message: "Login In AngelOne Account",
            error: null,
        });
  }
  
    var config = {
        method: 'get',
        url: 'https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/getTradeBook',
        headers: { 
            'Authorization': `Bearer ${angelToken}`,
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

    
         if(data.status==true&&data.data!==null) {

         const sorted  =   data.data.sort((a, b) => {

         return new Date(`1970-01-01T${b.filltime}`) - new Date(`1970-01-01T${a.filltime}`);
           
        });

            return res.json({
            status: true,
            statusCode:200,
            data: sorted,
            message:'get data'
        });

         }else if(data.status==true&&data.data===null){

            return res.json({
            status: false,
            statusCode:200,
            data: [],
            message:'Angel Trading Data is Empty'
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

export const cancelOrder = async (req, res,next) => {
   
    try {

    const angelToken = 'eyJhbGciOiJIUzUxMiJ9.eyJ1c2VybmFtZSI6Ik0xNjI0MjMiLCJyb2xlcyI6MCwidXNlcnR5cGUiOiJVU0VSIiwidG9rZW4iOiJleUpoYkdjaU9pSlNVekkxTmlJc0luUjVjQ0k2SWtwWFZDSjkuZXlKMWMyVnlYM1I1Y0dVaU9pSmpiR2xsYm5RaUxDSjBiMnRsYmw5MGVYQmxJam9pZEhKaFpHVmZZV05qWlhOelgzUnZhMlZ1SWl3aVoyMWZhV1FpT2pZc0luTnZkWEpqWlNJNklqTWlMQ0prWlhacFkyVmZhV1FpT2lJeFpUTmtOMlk1WVMwME5EVmlMVE5rWXpVdE9URXhZUzAyTkdWbU9UWTROakExWW1RaUxDSnJhV1FpT2lKMGNtRmtaVjlyWlhsZmRqSWlMQ0p2Ylc1bGJXRnVZV2RsY21sa0lqbzJMQ0p3Y205a2RXTjBjeUk2ZXlKa1pXMWhkQ0k2ZXlKemRHRjBkWE1pT2lKaFkzUnBkbVVpZlN3aWJXWWlPbnNpYzNSaGRIVnpJam9pWVdOMGFYWmxJbjE5TENKcGMzTWlPaUowY21Ga1pWOXNiMmRwYmw5elpYSjJhV05sSWl3aWMzVmlJam9pVFRFMk1qUXlNeUlzSW1WNGNDSTZNVGMyTkRFME5UWXlOQ3dpYm1KbUlqb3hOelkwTURVNU1EUTBMQ0pwWVhRaU9qRTNOalF3TlRrd05EUXNJbXAwYVNJNklqTXlNREJpWW1FMExUTTBNV1F0TkRJMU15MWlPVEkxTFRsa1lqRXdabVU0TmpkaFpDSXNJbFJ2YTJWdUlqb2lJbjAuZE8zWUUxSXdTRVhJN0ZtemtoMGFGU1lOYjEweGc3cUFlRkNPUXktd2FhX0t3bGc1Y3M2U0FRcllMUHp2WGM0ZWRwMkdPSzNJcVpfVlJCLTVkMHVOcmNkM3h4UW5Xb3dFMFFUSVc0dElPZHUwX3F4Ty16X1VqUElMSU9rRjZHYXdFUWNLbS1qS0FGa3psQVVfYUhuZVotS1JWd3JhcVQwLTVHTmxZeWViQjRvIiwiQVBJLUtFWSI6InlKYnJubmt4IiwiWC1PTEQtQVBJLUtFWSI6dHJ1ZSwiaWF0IjoxNzY0MDU5MjI0LCJleHAiOjE3NjQwOTU0MDB9.OA0TlacLUm8EuI4jKGblV1teFfxLB1t5RKHpmQZRuqR5Abo_yHyDn_nD5vuu3W_Y0e4iwly5t3xgTK7LdUIBJQ'


    var data = JSON.stringify({
    //   "variety":req.body.variety,
     "variety":'NORMAL',
      "orderid":'251125001194690'
    });
    
    

       var config = {
        method: 'post',
        url: 'https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/cancelOrder',
        headers: { 
           'Authorization': `Bearer ${angelToken}`,
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

    console.log(resData.data);
    

    if(resData.data.status==true){

       return res.json({
        status: true,
        statusCode:201,
        data:null,
        message: 'Order Cancell Successfully'
    });



      

    }else{

     return res.json({
            status: false,
            statusCode:data.errorcode,
            message: resData?.data?.message,
            data:null,
            error: "Order is not Cancell",
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

export const cancelOrderActual = async (req, res,next) => {
   
    try {

        const angelToken = 'eyJhbGciOiJIUzUxMiJ9.eyJ1c2VybmFtZSI6Ik0xNjI0MjMiLCJyb2xlcyI6MCwidXNlcnR5cGUiOiJVU0VSIiwidG9rZW4iOiJleUpoYkdjaU9pSlNVekkxTmlJc0luUjVjQ0k2SWtwWFZDSjkuZXlKMWMyVnlYM1I1Y0dVaU9pSmpiR2xsYm5RaUxDSjBiMnRsYmw5MGVYQmxJam9pZEhKaFpHVmZZV05qWlhOelgzUnZhMlZ1SWl3aVoyMWZhV1FpT2pZc0luTnZkWEpqWlNJNklqTWlMQ0prWlhacFkyVmZhV1FpT2lJeFpUTmtOMlk1WVMwME5EVmlMVE5rWXpVdE9URXhZUzAyTkdWbU9UWTROakExWW1RaUxDSnJhV1FpT2lKMGNtRmtaVjlyWlhsZmRqSWlMQ0p2Ylc1bGJXRnVZV2RsY21sa0lqbzJMQ0p3Y205a2RXTjBjeUk2ZXlKa1pXMWhkQ0k2ZXlKemRHRjBkWE1pT2lKaFkzUnBkbVVpZlN3aWJXWWlPbnNpYzNSaGRIVnpJam9pWVdOMGFYWmxJbjE5TENKcGMzTWlPaUowY21Ga1pWOXNiMmRwYmw5elpYSjJhV05sSWl3aWMzVmlJam9pVFRFMk1qUXlNeUlzSW1WNGNDSTZNVGMyTkRFME5UWXlOQ3dpYm1KbUlqb3hOelkwTURVNU1EUTBMQ0pwWVhRaU9qRTNOalF3TlRrd05EUXNJbXAwYVNJNklqTXlNREJpWW1FMExUTTBNV1F0TkRJMU15MWlPVEkxTFRsa1lqRXdabVU0TmpkaFpDSXNJbFJ2YTJWdUlqb2lJbjAuZE8zWUUxSXdTRVhJN0ZtemtoMGFGU1lOYjEweGc3cUFlRkNPUXktd2FhX0t3bGc1Y3M2U0FRcllMUHp2WGM0ZWRwMkdPSzNJcVpfVlJCLTVkMHVOcmNkM3h4UW5Xb3dFMFFUSVc0dElPZHUwX3F4Ty16X1VqUElMSU9rRjZHYXdFUWNLbS1qS0FGa3psQVVfYUhuZVotS1JWd3JhcVQwLTVHTmxZeWViQjRvIiwiQVBJLUtFWSI6InlKYnJubmt4IiwiWC1PTEQtQVBJLUtFWSI6dHJ1ZSwiaWF0IjoxNzY0MDU5MjI0LCJleHAiOjE3NjQwOTU0MDB9.OA0TlacLUm8EuI4jKGblV1teFfxLB1t5RKHpmQZRuqR5Abo_yHyDn_nD5vuu3W_Y0e4iwly5t3xgTK7LdUIBJQ'


    var data = JSON.stringify({
    //   "variety":req.body.variety,
     "variety":'',
      "orderid":''
    });
    

       var config = {
        method: 'post',
        url: 'https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/cancelOrder',
        headers: { 
           'Authorization': `Bearer ${angelToken}`,
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
        orderstatus: 'cancelled',
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
            message: "Order is Cancell and Not Update in PG DB With Cancell Status",
            data:null,
            error: "Order is Cancell and Not Update in PG DB With Cancell Status",
        });     
    }

        return res.json({
        status: true,
        statusCode:201,
        data:null,
        message: 'Order Cancell Successfully'
    });

    }else{

     return res.json({
            status: false,
            statusCode:data.errorcode,
            message: resData?.data?.message,
            data:null,
            error: "Order is not Cancell",
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

export const getPerticularTradeBook = async (req, res) => {
    try {

      
      

    let orderId = '09f4fc85-cc93-478e-8144-0ac62814a43f'
    
     const angelToken = 'eyJhbGciOiJIUzUxMiJ9.eyJ1c2VybmFtZSI6Ik0xNjI0MjMiLCJyb2xlcyI6MCwidXNlcnR5cGUiOiJVU0VSIiwidG9rZW4iOiJleUpoYkdjaU9pSlNVekkxTmlJc0luUjVjQ0k2SWtwWFZDSjkuZXlKMWMyVnlYM1I1Y0dVaU9pSmpiR2xsYm5RaUxDSjBiMnRsYmw5MGVYQmxJam9pZEhKaFpHVmZZV05qWlhOelgzUnZhMlZ1SWl3aVoyMWZhV1FpT2pZc0luTnZkWEpqWlNJNklqTWlMQ0prWlhacFkyVmZhV1FpT2lJeFpUTmtOMlk1WVMwME5EVmlMVE5rWXpVdE9URXhZUzAyTkdWbU9UWTROakExWW1RaUxDSnJhV1FpT2lKMGNtRmtaVjlyWlhsZmRqSWlMQ0p2Ylc1bGJXRnVZV2RsY21sa0lqbzJMQ0p3Y205a2RXTjBjeUk2ZXlKa1pXMWhkQ0k2ZXlKemRHRjBkWE1pT2lKaFkzUnBkbVVpZlN3aWJXWWlPbnNpYzNSaGRIVnpJam9pWVdOMGFYWmxJbjE5TENKcGMzTWlPaUowY21Ga1pWOXNiMmRwYmw5elpYSjJhV05sSWl3aWMzVmlJam9pVFRFMk1qUXlNeUlzSW1WNGNDSTZNVGMyTkRFME5UWXlOQ3dpYm1KbUlqb3hOelkwTURVNU1EUTBMQ0pwWVhRaU9qRTNOalF3TlRrd05EUXNJbXAwYVNJNklqTXlNREJpWW1FMExUTTBNV1F0TkRJMU15MWlPVEkxTFRsa1lqRXdabVU0TmpkaFpDSXNJbFJ2YTJWdUlqb2lJbjAuZE8zWUUxSXdTRVhJN0ZtemtoMGFGU1lOYjEweGc3cUFlRkNPUXktd2FhX0t3bGc1Y3M2U0FRcllMUHp2WGM0ZWRwMkdPSzNJcVpfVlJCLTVkMHVOcmNkM3h4UW5Xb3dFMFFUSVc0dElPZHUwX3F4Ty16X1VqUElMSU9rRjZHYXdFUWNLbS1qS0FGa3psQVVfYUhuZVotS1JWd3JhcVQwLTVHTmxZeWViQjRvIiwiQVBJLUtFWSI6InlKYnJubmt4IiwiWC1PTEQtQVBJLUtFWSI6dHJ1ZSwiaWF0IjoxNzY0MDU5MjI0LCJleHAiOjE3NjQwOTU0MDB9.OA0TlacLUm8EuI4jKGblV1teFfxLB1t5RKHpmQZRuqR5Abo_yHyDn_nD5vuu3W_Y0e4iwly5t3xgTK7LdUIBJQ'

    var config = {
        method: 'get',
        url: `https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/details/${orderId}`,
        headers: { 
           'Authorization': `Bearer ${angelToken}`,
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

        console.log(data.dataa,'dsccsdcs');

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

        
        

         return res.json({
            status: false,
            statusCode:500,
            message: "Unexpected error occurred. Please try again.",
            data:null,
            error: error.message,
        });

    }
};

export const logoutAngelOne = async function (req,res,next) {
    try {

      const obj = { clientcode:'M162423' };

      const jsonString = JSON.stringify(obj);

      var config = {
      method: 'post',
      url: 'https://apiconnect.angelone.in/rest/secure/angelbroking/user/v1/logout',

      headers : {
        'Authorization': `Bearer ${process.env.ANGELONE_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-UserType': 'USER',
        'X-SourceID': 'WEB',
            'X-ClientLocalIP': process.env.CLIENT_LOCAL_IP, 
            'X-ClientPublicIP': process.env.CLIENT_PUBLIC_IP, 
            'X-MACAddress': process.env.MAC_Address, 
            'X-PrivateKey': process.env.PRIVATE_KEY, 
      },
       data : jsonString
    };

    let response = await axios(config);

    const apiData = response.data;

      return res.status(200).json({
              success: true,
              data: apiData
          });

  } catch (error) {
    console.log('hhhy',error);
  }


}

export const getTradeDataForDeshboard = async function (req,res,next) {

    try{

      let totalBuyLength = 0
         const angelToken = req.headers.angelonetoken;

            if (!angelToken) {

              return res.json({
                      status: false,
                      statusCode:401,
                      message: "Login In AngelOne Account",
                      error: null,
                  });
            }


          

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

        let response = await axios(config)
        
        if(response.data.status===true&&response.data.data===null) {

           return res.json({
                    status: true,
                    statusCode:203,
                    message: "getting data",
                    data:[],
                     totalTraded:totalBuyLength,
                    pnl:0,

                    error:null,
                });


        }else if(response.data.status){

        const toMoney = n => Math.round(n * 100) / 100;

        function calculatePnL(orders) {
       
       
            const grouped = {};

        // group by symbol
        for (const o of orders) {
            if (!grouped[o.tradingsymbol]) grouped[o.tradingsymbol] = [];
            grouped[o.tradingsymbol].push(o);
        }

        const results = [];

    
        for (const [symbol, list] of Object.entries(grouped)) {

            const buys = list.filter(o => o.transactiontype === 'BUY');
            const sells = list.filter(o => o.transactiontype === 'SELL');


            let totalBuyQty = 0, totalBuyValue = 0;
            buys.forEach(b => { totalBuyQty += b.fillsize; totalBuyValue += b.fillsize * b.tradevalue; });

            let totalSellQty = 0, totalSellValue = 0;
            sells.forEach(s => { totalSellQty += s.fillsize; totalSellValue += s.fillsize * s.tradevalue; });

            if (totalBuyQty > 0 && totalSellQty > 0) {
            const matchedQty = Math.min(totalBuyQty, totalSellQty);
            const buyAvg = totalBuyValue / totalBuyQty;
            const sellAvg = totalSellValue / totalSellQty;
            const pnl = (sellAvg - buyAvg) * matchedQty;

        
            results.push({
                label:symbol,
                win: toMoney(buyAvg),
                loss: toMoney(sellAvg),
                quantity: matchedQty,
                pnl: toMoney(pnl)
            });
            }
        }

        return results;
        }


        // // ---- Run and print as JSON ----
        const pnlData = calculatePnL(response.data.data);

        const trades = response.data.data;  // or paste your array directly

        let totalBuy = 0;
        let totalSell = 0;
        

        trades?.forEach((trade) => {
        const type = String(trade.transactiontype).toUpperCase();
        const value = Number(trade.tradevalue) || 0;

        if (type === "BUY") {
            totalBuy += value;
            totalBuyLength++
        } else if (type === "SELL") {
            totalSell += value;
        }
        });

                const openCount = await Order.count({
            where: {
              userId:req.userId,
              orderstatuslocaldb: "OPEN"
            }
          });

        return res.json({
                    status: true,
                    statusCode:203,
                    message: "getting data",
                    data:pnlData,
                    pnl:totalSell-totalBuy,
                    totalTraded:totalBuyLength,
                    totalOpen:openCount,
                    error:null,
                });

        }else{
          return res.json({
                    status: true,
                    statusCode:203,
                    message: "getting data",
                    data:[],
                     totalTraded:totalBuyLength,
                    pnl:0,
                    error:null,
                });
        }

    }catch(error) {
      
        console.log(error.message,'hello bye');

         return res.json({
                    status: true,
                    statusCode:203,
                    message: "getting data",
                    data:[],
                    pnl:0,
                    error:null,
                });
        

    }
}

export const getHoldingDataInAngelOne = async (req, res,next) => {
    try {

      var config = {
        method: 'get',
        url: 'https://apiconnect.angelone.in/rest/secure/angelbroking/portfolio/v1/getAllHolding',
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
 
     if(resData?.data?.status==true&&resData?.data?.data?.holdings.length) {

         return res.json({
            status: true,
            statusCode:200,
            data: resData.data.data,
            message:''
        });
     }else if (resData?.data?.status==true){

     let resObj =   {
          "holdings": [
               {
                    "tradingsymbol": "TATASTEE",
                    "exchange": "NSE",
                    "isin": "INE081A01020",
                    "t1quantity": 0,
                    "realisedquantity": 2,
                    "quantity": 2,
                    "authorisedquantity": 0,
                    "product": "DELIVERY",
                    "collateralquantity": null,
                    "collateraltype": null,
                    "haircut": 0,
                    "averageprice": 111.87,
                    "ltp": 130.15,
                    "symboltoken": "3499",
                    "close": 129.6,
                    "profitandloss": 37,
                    "pnlpercentage": 16.34
               },
               {
                    "tradingsymbol": "PARAGMILK",
                    "exchange": "NSE",
                    "isin": "INE883N01014",
                    "t1quantity": 0,
                    "realisedquantity": 2,
                    "quantity": 2,
                    "authorisedquantity": 0,
                    "product": "DELIVERY",
                    "collateralquantity": null,
                    "collateraltype": null,
                    "haircut": 0,
                    "averageprice": 154.03,
                    "ltp": 201,
                    "symboltoken": "17130",
                    "close": 192.1,
                    "profitandloss": 94,
                    "pnlpercentage": 30.49
               },
               {
                    "tradingsymbol": "SBIN",
                    "exchange": "NSE",
                    "isin": "INE062A01020",
                    "t1quantity": 0,
                    "realisedquantity": 8,
                    "quantity": 8,
                    "authorisedquantity": 0,
                    "product": "DELIVERY",
                    "collateralquantity": null,
                    "collateraltype": null,
                    "haircut": 0,
                    "averageprice": 573.1,
                    "ltp": 579.05,
                    "symboltoken": "3045",
                    "close": 570.5,
                    "profitandloss": 48,
                    "pnlpercentage": 1.04
               },
                {
                    "tradingsymbol": "NIFTY 50",
                    "exchange": "NSE",
                    "isin": "INE062A01020",
                    "t1quantity": 0,
                    "realisedquantity": 8,
                    "quantity": 8,
                    "authorisedquantity": 0,
                    "product": "DELIVERY",
                    "collateralquantity": null,
                    "collateraltype": null,
                    "haircut": 0,
                    "averageprice": 573.1,
                    "ltp": 579.05,
                    "symboltoken": "3045",
                    "close": 570.5,
                    "profitandloss": 48,
                    "pnlpercentage": 1.04
               }
          ],
          "totalholding": {
               "totalholdingvalue": 5294,
               "totalinvvalue": 5116,
               "totalprofitandloss": 178.14,
               "totalpnlpercentage": 3.48
          }
     }

       return res.json({
            status: true,
            statusCode:200,
            data: resObj,
            message:'Testing Data'
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

export const getCloneUserHolding = async (req, res) => {
  try {

    const userId = req.userId; // ensure middleware sets this

      let resObj =   {
          "holdings": [
               {
                    "tradingsymbol": "TATASTEEL-EQ",
                    "exchange": "NSE",
                    "isin": "INE081A01020",
                    "t1quantity": 0,
                    "realisedquantity": 2,
                    "quantity": 2,
                    "authorisedquantity": 0,
                    "product": "DELIVERY",
                    "collateralquantity": null,
                    "collateraltype": null,
                    "haircut": 0,
                    "averageprice": 111.87,
                    "ltp": 130.15,
                    "symboltoken": "3499",
                    "close": 129.6,
                    "profitandloss": 37,
                    "pnlpercentage": 16.34
               },
               {
                    "tradingsymbol": "PARAGMILK-EQ",
                    "exchange": "NSE",
                    "isin": "INE883N01014",
                    "t1quantity": 0,
                    "realisedquantity": 2,
                    "quantity": 2,
                    "authorisedquantity": 0,
                    "product": "DELIVERY",
                    "collateralquantity": null,
                    "collateraltype": null,
                    "haircut": 0,
                    "averageprice": 154.03,
                    "ltp": 201,
                    "symboltoken": "17130",
                    "close": 192.1,
                    "profitandloss": 94,
                    "pnlpercentage": 30.49
               },
               {
                    "tradingsymbol": "SBIN-EQ",
                    "exchange": "NSE",
                    "isin": "INE062A01020",
                    "t1quantity": 0,
                    "realisedquantity": 8,
                    "quantity": 8,
                    "authorisedquantity": 0,
                    "product": "DELIVERY",
                    "collateralquantity": null,
                    "collateraltype": null,
                    "haircut": 0,
                    "averageprice": 573.1,
                    "ltp": 579.05,
                    "symboltoken": "3045",
                    "close": 570.5,
                    "profitandloss": 48,
                    "pnlpercentage": 1.04
               }
          ],
          "totalholding": {
               "totalholdingvalue": 5294,
               "totalinvvalue": 5116,
               "totalprofitandloss": 178.14,
               "totalpnlpercentage": 3.48
          }
     }

       return res.json({
            status: true,
            statusCode:200,
            data: resObj,
            message:'Testing Data'
        });

   

  } catch (error) {
    console.error("getCloneUserTrade error:", error);
    return res.status(500).json({
      status: false,
      message: "Something went wrong while fetching clone user trade data",
      error: error.message,
    });
  }
};

export const getPosition = async (req, res,next) => {
    try {

      var config = {
        method: 'get',
        url: 'https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/getPosition',
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
export const getAngelOneLTP = async (req, res,next) => {
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
            message:'',
             error: null,
        });
     }else{
       
        return res.json({
            status: false,
            statusCode:401,
            message: resData?.data?.message,
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




// ===================== Angelone Apis  =====================



export const getAngelTradeBooks = async (req, res) => {
    try {

    const angelToken = req.headers.angelonetoken

    var config = {
        method: 'get',
        url: `https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/getTradeBook`,
        headers: { 
           'Authorization': `Bearer ${angelToken}`,
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

