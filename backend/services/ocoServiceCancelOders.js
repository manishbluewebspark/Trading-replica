

import User from "../models/userModel.js"; // your table
import Order from "../models/orderModel.js"; // your table
import { getKiteClientForUserId } from "./userKiteBrokerService.js";
import { logSuccess, logError } from "../utils/loggerr.js";

// =================angelone Order Fetch Function Start ===========================

const cancelAngelOrder = async (token, orderId, variety = "NORMAL") => {
  logSuccess(
    { userId: null, broker: "angelone", action: "cancelAngelOrder" },
    { msg: "cancelAngelOrder called", hasToken: !!token, orderId, variety }
  );

  try {
    logSuccess(
      { userId: null, broker: "angelone", action: "cancelAngelOrder" },
      { msg: "Preparing AngelOne cancel URL" }
    );

    const ANGEL_ONE_CANCEL_URL =
      "https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/cancelOrder";

    logSuccess(
      { userId: null, broker: "angelone", action: "cancelAngelOrder" },
      { msg: "AngelOne cancel URL prepared", ANGEL_ONE_CANCEL_URL }
    );

    const data = {
      variety: variety,
      orderid: orderId,
    };

    logSuccess(
      { userId: null, broker: "angelone", action: "cancelAngelOrder" },
      { msg: "AngelOne cancel payload prepared", data }
    );

    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-UserType": "USER",
      "X-SourceID": "WEB",
      "X-ClientLocalIP": process.env.CLIENT_LOCAL_IP,
      "X-ClientPublicIP": process.env.CLIENT_PUBLIC_IP,
      "X-MACAddress": process.env.MAC_Address,
      "X-PrivateKey": process.env.PRIVATE_KEY,
    };

    logSuccess(
      { userId: null, broker: "angelone", action: "cancelAngelOrder" },
      {
        msg: "AngelOne headers prepared",
        hasAuthorization: !!headers.Authorization,
        clientLocalIp: headers["X-ClientLocalIP"],
        clientPublicIp: headers["X-ClientPublicIP"],
        hasPrivateKey: !!headers["X-PrivateKey"],
      }
    );

    logSuccess(
      { userId: null, broker: "angelone", action: "cancelAngelOrder" },
      { msg: "Calling AngelOne cancel API", orderId, variety }
    );

    const response = await axios.post(
      ANGEL_ONE_CANCEL_URL,
      data, // ✅ data yahan pass hota hai
      { headers }
    );

    logSuccess(
      { userId: null, broker: "angelone", action: "cancelAngelOrder" },
      {
        msg: "AngelOne cancel API response received",
        status: response?.data?.status,
        message: response?.data?.message,
        data: response?.data?.data,
      }
    );

    return response.data;
  } catch (error) {
    logError(
      { userId: null, broker: "angelone", action: "cancelAngelOrder" },
      error,
      {
        msg: "AngelOne Cancel Order Error",
        orderId,
        variety,
        errResp: error?.response?.data,
        errMsg: error?.message,
      }
    );

    console.error(
      "AngelOne Cancel Order Error:",
      error.response?.data || error.message
    );

    throw error;
  }
};

// =================angelone Order Fetch Function End ===========================

// =================kite Order Fetch Function Start ===========================

const cancelKiteOrder = async function (userId, orderId, variety = "regular") {
  logSuccess(
    { userId, broker: "kite", action: "cancelKiteOrder" },
    { msg: "cancelKiteOrder called", userId, orderId, variety }
  );

  logSuccess(
    { userId, broker: "kite", action: "cancelKiteOrder" },
    { msg: "Creating Kite client (getKiteClientForUserId)", userId }
  );

  const kite = await getKiteClientForUserId(userId);

  logSuccess(
    { userId, broker: "kite", action: "cancelKiteOrder" },
    { msg: "Kite client created", userId, hasClient: !!kite }
  );

  logSuccess(
    { userId, broker: "kite", action: "cancelKiteOrder" },
    { msg: "Calling kite.cancelOrder", userId, orderId, variety }
  );

  const ordersRes = await kite.cancelOrder(variety, orderId);

  logSuccess(
    { userId, broker: "kite", action: "cancelKiteOrder" },
    {
      msg: "kite.cancelOrder response received",
      userId,
      orderId,
      variety,
      ordersRes,
      status: ordersRes?.status,
    }
  );

  if (ordersRes.status === "status") {
    logSuccess(
      { userId, broker: "kite", action: "cancelKiteOrder" },
      { msg: "Kite cancel success (status matched)", userId, orderId, variety }
    );

    return ordersRes;
  } else {
    logSuccess(
      { userId, broker: "kite", action: "cancelKiteOrder" },
      {
        msg: "Kite cancel did not match expected status",
        userId,
        orderId,
        variety,
        actualStatus: ordersRes?.status,
      }
    );

    console.log("angelone order not fetch !");
  }
};

// =================kite Order Fetch Function End ===========================

export async function cancelOrderOCO(userId, broker, orderId) {
  logSuccess(
    { userId, broker, action: "cancelOrderOCO" },
    { msg: "cancelOrderOCO called", userId, broker, orderId }
  );

  logSuccess(
    { userId, broker, action: "cancelOrderOCO" },
    { msg: "Fetching user via User.findByPk", userId }
  );

  const user = await User.findByPk(userId);

  logSuccess(
    { userId, broker, action: "cancelOrderOCO" },
    {
      msg: "User.findByPk result",
      userFound: !!user,
      dbUserId: user?.id,
      dbBrokerName: user?.brokerName,
      hasAuthToken: !!user?.authToken,
    }
  );

  if (!user) {
    logError(
      { userId, broker, action: "cancelOrderOCO" },
      new Error("User not found"),
      { msg: "User not found", userId, broker, orderId }
    );

    throw new Error("User not found");
  }

  logSuccess(
    { userId, broker, action: "cancelOrderOCO" },
    { msg: "Checking broker account match", reqBroker: broker, userBrokerName: user.brokerName }
  );

  if (user.brokerName !== broker) {
    logError(
      { userId, broker, action: "cancelOrderOCO" },
      new Error("Borker Account not Match "),
      {
        msg: "Broker account not match",
        reqBroker: broker,
        userBrokerName: user.brokerName,
        userId,
        orderId,
      }
    );

    throw new Error("Borker Account not Match ");
  }

  logSuccess(
    { userId, broker, action: "cancelOrderOCO" },
    { msg: "Broker account matched, entering try block", userId, broker, orderId }
  );

  try {
    logSuccess(
      { userId, broker, action: "cancelOrderOCO" },
      { msg: "Routing cancel by brokerName", brokerName: user.brokerName }
    );

    if (user.brokerName.toLowerCase() === "angelone") {
      logSuccess(
        { userId, broker: "angelone", action: "cancelOrderOCO" },
        { msg: "Routing to cancelAngelOrder", userId, orderId }
      );

      const out = await cancelAngelOrder(user.authToken, orderId);

      logSuccess(
        { userId, broker: "angelone", action: "cancelOrderOCO" },
        { msg: "cancelAngelOrder finished", userId, orderId, out }
      );

      return out;
    }

    if (user.brokerName.toLowerCase() === "kite") {
      logSuccess(
        { userId, broker: "kite", action: "cancelOrderOCO" },
        { msg: "Routing to cancelKiteOrder", userId, orderId }
      );

      const out = await cancelKiteOrder(user.id, orderId);

      logSuccess(
        { userId, broker: "kite", action: "cancelOrderOCO" },
        { msg: "cancelKiteOrder finished", userId, orderId, out }
      );

      return out;
    }

    if (user.brokerName.toLowerCase() === "fyers") {
      logSuccess(
        { userId, broker: "fyers", action: "cancelOrderOCO" },
        { msg: "Routing to cancelFyersOrder", userId, orderId }
      );

      const out = await cancelFyersOrder(user.authToken);

      logSuccess(
        { userId, broker: "fyers", action: "cancelOrderOCO" },
        { msg: "cancelFyersOrder finished", userId, orderId, out }
      );

      return out;
    }

    if (user.brokerName.toLowerCase() === "upstox") {
      logSuccess(
        { userId, broker: "upstox", action: "cancelOrderOCO" },
        { msg: "Upstox cancel path reached (no implementation)", userId, orderId }
      );
    }

    if (user.brokerName.toLowerCase() === "finvasia") {
      logSuccess(
        { userId, broker: "finvasia", action: "cancelOrderOCO" },
        { msg: "Routing to cancelFinavasiaOrder", userId, orderId }
      );

      const out = await cancelFinavasiaOrder(user.authToken);

      logSuccess(
        { userId, broker: "finvasia", action: "cancelOrderOCO" },
        { msg: "cancelFinavasiaOrder finished", userId, orderId, out }
      );

      return out;
    }

    logSuccess(
      { userId, broker, action: "cancelOrderOCO" },
      { msg: "No broker matched in cancelOrderOCO", brokerName: user.brokerName, userId, orderId }
    );
  } catch (err) {
    logError(
      { userId, broker, action: "cancelOrderOCO" },
      err,
      { msg: "cancelOrderOCO failed in catch", userId, broker, orderId, errMsg: err?.message, errResp: err?.response?.data }
    );
  }
}










// =====================update code ============================


// import User from "../models/userModel.js"; // your table
// import { getKiteClientForUserId } from "./userKiteBrokerService.js";
// import { logSuccess, logError } from "../utils/loggerr.js";

// // =================angelone Order Fetch Function Start ===========================

// const cancelAngelOrder = async (token, orderId, variety = "NORMAL") => {
//   try {
//     const ANGEL_ONE_CANCEL_URL =
//       "https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/cancelOrder";

//     const data = {
//       variety: variety,
//       orderid: orderId
//     };

//     const headers = {
//       Authorization: `Bearer ${token}`,
//       "Content-Type": "application/json",
//       Accept: "application/json",
//       "X-UserType": "USER",
//       "X-SourceID": "WEB",
//       "X-ClientLocalIP": process.env.CLIENT_LOCAL_IP,
//       "X-ClientPublicIP": process.env.CLIENT_PUBLIC_IP,
//       "X-MACAddress": process.env.MAC_Address,
//       "X-PrivateKey": process.env.PRIVATE_KEY
//     };

//     const response = await axios.post(
//       ANGEL_ONE_CANCEL_URL,
//       data,          // ✅ data yahan pass hota hai
//       { headers }
//     );

//     return response.data;

//   } catch (error) {
//     console.error(
//       "AngelOne Cancel Order Error:",
//       error.response?.data || error.message
//     );
//     throw error;
//   }
// };

// // =================angelone Order Fetch Function End ===========================



// // =================kite Order Fetch Function Start ===========================

// const cancelKiteOrder = async function (userId,orderId,variety="regular") {

//      const kite = await getKiteClientForUserId(userId);

//      const ordersRes = await kite.cancelOrder(variety,orderId);

//     if(ordersRes.status==="status") {
       
//         return ordersRes
        
//     }else{
        
//         console.log('angelone order not fetch !');
           
//     }
// }

// // =================kite Order Fetch Function End ===========================


// export async function cancelOrderOCO(userId, broker,orderId) {

//   const user = await User.findByPk(userId);

//     if (!user) {
//      throw new Error("User not found");
//     }

//     if(user.brokerName!==broker) {

//         throw new Error("Borker Account not Match ");
//     }

//      try {

//         if (user.brokerName.toLowerCase() === "angelone") {
               
//             return await cancelAngelOrder(user.authToken,orderId);
//         }
    
//         if (user.brokerName.toLowerCase() === "kite") {
               
//             return await cancelKiteOrder(user.id,orderId);
//         }
    
//         if (user.brokerName.toLowerCase() === "fyers") {
                
//             return await cancelFyersOrder(user.authToken);
//         }
    
//         if (user.brokerName.toLowerCase() === "upstox") {
                
//         }
    
//         if (user.brokerName.toLowerCase() === "finvasia") {
                
//             return await cancelFinavasiaOrder(user.authToken);
//         }
              
//      } catch (err) {


//     }

  
// }