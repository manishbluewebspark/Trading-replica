

import axios from "axios";
import User from "../models/userModel.js"; // your table
import { getKiteClientForUserId } from "./userKiteBrokerService.js";
import { logSuccess, logError } from "../utils/loggerr.js";

// =================angelone Order Fetch Function Start ===========================

const fetchAngelOrder = async function (token) {
  logSuccess(
    { broker: "angelone", action: "fetchAngelOrder" },
    { msg: "fetchAngelOrder called", hasToken: !!token }
  );

  const ANGEL_ONE_ORDER_URL =
    "https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/getTradeBook";

  logSuccess(
    { broker: "angelone", action: "fetchAngelOrder" },
    { msg: "AngelOne OrderBook URL prepared", ANGEL_ONE_ORDER_URL }
  );

  const angelHeaders = (token) => ({
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    Accept: "application/json",
    "X-UserType": "USER",
    "X-SourceID": "WEB",
    "X-ClientLocalIP": process.env.CLIENT_LOCAL_IP,
    "X-ClientPublicIP": process.env.CLIENT_PUBLIC_IP,
    "X-MACAddress": process.env.MAC_Address,
    "X-PrivateKey": process.env.PRIVATE_KEY,
  });

  logSuccess(
    { broker: "angelone", action: "fetchAngelOrder" },
    {
      msg: "AngelOne headers prepared",
      hasAuthorization: true,
      hasPrivateKey: !!process.env.PRIVATE_KEY,
    }
  );

  try {
    logSuccess(
      { broker: "angelone", action: "fetchAngelOrder" },
      { msg: "Calling AngelOne getOrderBook API" }
    );

     console.log('=============Before Order Angelone==========');

    const ordersRes = await axios.get(ANGEL_ONE_ORDER_URL, {
      headers: angelHeaders(token),
    });

    
    

    logSuccess(
      { broker: "angelone", action: "fetchAngelOrder" },
      {
        msg: "AngelOne getOrderBook response received",
        apiStatus: ordersRes?.data?.status,
        ordersCount: Array.isArray(ordersRes?.data?.data)
          ? ordersRes.data.data?.length
          : null,
      }
    );

    if (ordersRes.data.status === true) {
      logSuccess(
        { broker: "angelone", action: "fetchAngelOrder" },
        { msg: "AngelOne orders returned (status matched)" }
      );

      if(ordersRes.data.data==null) {

           return []    
      }

      return ordersRes.data.data;
    } else {
      logSuccess(
        { broker: "angelone", action: "fetchAngelOrder" },
        {
          msg: "AngelOne orders not fetched (status mismatch)",
          actualStatus: ordersRes?.status,
        }
      );

      console.log("angelone order not fetch !");
    }
  } catch (error) {
    logError(
      { broker: "angelone", action: "fetchAngelOrder" },
      error,
      {
        msg: "AngelOne getOrderBook failed",
        errMsg: error?.message,
        errResp: error?.response?.data,
      }
    );
    throw error;
  }
};

// =================angelone Order Fetch Function End ===========================

// =================kite Order Fetch Function Start ===========================

const fetchKiteOrder = async function (userId) {
  logSuccess(
    { broker: "kite", action: "fetchKiteOrder" },
    { msg: "fetchKiteOrder called", userId }
  );

  logSuccess(
    { broker: "kite", action: "fetchKiteOrder" },
    { msg: "Creating Kite client", userId }
  );

  const kite = await getKiteClientForUserId(userId);

  logSuccess(
    { broker: "kite", action: "fetchKiteOrder" },
    { msg: "Kite client created", userId, hasClient: !!kite }
  );

  try {
    logSuccess(
      { broker: "kite", action: "fetchKiteOrder" },
      { msg: "Calling kite.getOrders()", userId }
    );

    const ordersRes = await kite.getTrades();

    logSuccess(
      { broker: "kite", action: "fetchKiteOrder" },
      {
        msg: "Kite getOrders response received",
        userId,
        ordersCount: Array.isArray(ordersRes) ? ordersRes.length : null,
        rawResponse: ordersRes,
      }
    );

    if (ordersRes.status === "status") {
      logSuccess(
        { broker: "kite", action: "fetchKiteOrder" },
        { msg: "Kite orders returned (status matched)", userId }
      );

      return ordersRes;
    } else {
      logSuccess(
        { broker: "kite", action: "fetchKiteOrder" },
        {
          msg: "Kite orders not fetched (status mismatch)",
          userId,
          actualStatus: ordersRes?.status,
        }
      );

      console.log("angelone order not fetch !");
    }
  } catch (error) {
    logError(
      { broker: "kite", action: "fetchKiteOrder" },
      error,
      {
        msg: "Kite getOrders failed",
        userId,
        errMsg: error?.message,
        errResp: error?.response?.data,
      }
    );
    throw error;
  }
};

// =================kite Order Fetch Function End ===========================

export async function fetchOrderBookOCO(userId, broker) {
  logSuccess(
    { userId, broker, action: "fetchOrderBookOCO" },
    { msg: "fetchOrderBookOCO called", userId, broker }
  );

  logSuccess(
    { userId, broker, action: "fetchOrderBookOCO" },
    { msg: "Fetching user via User.findByPk", userId }
  );

 
  
  const user = await User.findByPk(userId);


  logSuccess(
    { userId, broker, action: "fetchOrderBookOCO" },
    {
      msg: "User lookup result",
      userFound: !!user,
      dbBrokerName: user?.brokerName,
      hasAuthToken: !!user?.authToken,
    }
  );

  if (!user) {
    logError(
      { userId, broker, action: "fetchOrderBookOCO" },
      new Error("User not found"),
      { msg: "User not found", userId, broker }
    );
    throw new Error("User not found");
  }

  logSuccess(
    { userId, broker, action: "fetchOrderBookOCO" },
    {
      msg: "Validating broker match",
      reqBroker: broker,
      userBrokerName: user.brokerName,
    }
  );

  if (user.brokerName !== broker) {
    logError(
      { userId, broker, action: "fetchOrderBookOCO" },
      new Error("Borker Account not Match "),
      {
        msg: "Broker account mismatch",
        reqBroker: broker,
        userBrokerName: user.brokerName,
      }
    );
    throw new Error("Borker Account not Match ");
  }

  try {
    logSuccess(
      { userId, broker, action: "fetchOrderBookOCO" },
      { msg: "Routing fetch based on broker", brokerName: user.brokerName }
    );

    if (user.brokerName.toLowerCase() === "angelone") {
      logSuccess(
        { userId, broker: "angelone", action: "fetchOrderBookOCO" },
        { msg: "Routing to fetchAngelOrder", userId }
      );

        

      const out = await fetchAngelOrder(user.authToken);

       console.log('============User 1234================',out);


      logSuccess(
        { userId, broker: "angelone", action: "fetchOrderBookOCO" },
        { msg: "fetchAngelOrder completed", resultType: typeof out }
      );

      return out;
    }

    if (user.brokerName.toLowerCase() === "kite") {
      logSuccess(
        { userId, broker: "kite", action: "fetchOrderBookOCO" },
        { msg: "Routing to fetchKiteOrder", userId }
      );

      const out = await fetchKiteOrder(user.id);

      logSuccess(
        { userId, broker: "kite", action: "fetchOrderBookOCO" },
        { msg: "fetchKiteOrder completed", resultType: typeof out }
      );

      return out;
    }

    if (user.brokerName.toLowerCase() === "fyers") {
      logSuccess(
        { userId, broker: "fyers", action: "fetchOrderBookOCO" },
        { msg: "Routing to fetchFyersOrder (not implemented)", userId }
      );

      return await fetchFyersOrder(user.authToken);
    }

    if (user.brokerName.toLowerCase() === "upstox") {
      logSuccess(
        { userId, broker: "upstox", action: "fetchOrderBookOCO" },
        { msg: "Upstox fetch path reached (no implementation)", userId }
      );
    }

    if (user.brokerName.toLowerCase() === "finvasia") {
      logSuccess(
        { userId, broker: "finvasia", action: "fetchOrderBookOCO" },
        { msg: "Routing to fetchFinavasiaOrder", userId }
      );

      return await fetchFinavasiaOrder(user.authToken);
    }

    logSuccess(
      { userId, broker, action: "fetchOrderBookOCO" },
      { msg: "No broker matched for fetchOrderBookOCO", brokerName: user.brokerName }
    );
  } catch (err) {
    logError(
      { userId, broker, action: "fetchOrderBookOCO" },
      err,
      {
        msg: "fetchOrderBookOCO failed",
        errMsg: err?.message,
        errResp: err?.response?.data,
      }
    );
    throw err;
  }
}






// import User from "../models/userModel.js"; // your table
// import { getKiteClientForUserId } from "./userKiteBrokerService.js";
// import { logSuccess, logError } from "../utils/loggerr.js";


// // =================angelone Order Fetch Function Start ===========================

// const fetchAngelOrder = async function (token) {

//     const ANGEL_ONE_ORDER_URL =
//      "https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/getOrderBook";

//     const angelHeaders = (token) => ({
//         Authorization: `Bearer ${token}`,
//         "Content-Type": "application/json",
//         "Accept": "application/json",
//         "X-UserType": "USER",
//         "X-SourceID": "WEB",
//         'X-ClientLocalIP': process.env.CLIENT_LOCAL_IP, 
//         'X-ClientPublicIP': process.env.CLIENT_PUBLIC_IP, 
//         'X-MACAddress': process.env.MAC_Address, 
//         'X-PrivateKey': process.env.PRIVATE_KEY, 
//         });

//      const ordersRes = await axios.get(ANGEL_ONE_ORDER_URL, {
//         headers: angelHeaders(token),
//       });

//       if(ordersRes.status==="status") {
       
//         return ordersRes.data
        
//       }else{
//            console.log('angelone order not fetch !');
           
//       }
// }

// // =================angelone Order Fetch Function End ===========================



// // =================kite Order Fetch Function Start ===========================

// const fetchKiteOrder = async function (userId) {

//      const kite = await getKiteClientForUserId(userId);

//      const ordersRes = await kite.getOrders();

//     if(ordersRes.status==="status") {
       
//         return ordersRes
        
//     }else{
        
//         console.log('angelone order not fetch !');
           
//     }
// }

// // =================kite Order Fetch Function End ===========================


// export async function fetchOrderBookOCO(userId, broker) {

//     const user = await User.findByPk(userId);

//     if (!user) {
//      throw new Error("User not found");
//     }

//     if(user.brokerName!==broker) {

//         throw new Error("Borker Account not Match ");
//     }

//      try {

//         if (user.brokerName.toLowerCase() === "angelone") {
               
//             return await fetchAngelOrder(user.authToken);
//         }
    
//         if (user.brokerName.toLowerCase() === "kite") {
               
//             return await fetchKiteOrder(user.id);
//         }
    
//         if (user.brokerName.toLowerCase() === "fyers") {
                
//             return await fetchFyersOrder(user.authToken);
//         }
    
//         if (user.brokerName.toLowerCase() === "upstox") {
                
//         }
    
//         if (user.brokerName.toLowerCase() === "finvasia") {
                
//             return await fetchFinavasiaOrder(user.authToken);
//         }
              
//      } catch (err) {


//     }

// }