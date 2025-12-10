import axios from "axios";
import Order from "../../models/orderModel.js";
import User from "../../models/userModel.js";
import AngelOneToken from "../../models/angelOneToken.js"
import Credential from "../../models/angelOneCredential.js";
import { generateTOTP } from "../../utils/generateTOTP.js";
import { getManyTokensFromSession, setTokensInSession } from "../../utils/sessionUtils.js";
import FundPNL from "../../models/angelFundAndPNL.js"
import { Op } from "sequelize";
import { emitOrderGet } from "../../services/smartapiFeed.js";
import { handleAngelOneUser } from "../../services/handleAngelOneUser.js";
import { handleKiteUser } from "../../services/handleKiteUser.js";
import { getKiteClientForUserId } from "../../services/userKiteBrokerService.js";


const ANGEL_ONE_PLACE_URL = "https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/placeOrder";


const ANGEL_ONE_DETAILS_URL = (uniqueOrderId) =>`https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/details/${uniqueOrderId}`;

const ANGEL_ONE_TRADE_DETAILS_URL = `https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/getTradeBook`;


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


// export const adminPlaceMultipleOrder = async (req, res) => {
  
//   try {

//     const startOfDay = new Date();
// startOfDay.setHours(0, 0, 0, 0);

// const endOfDay = new Date();
// endOfDay.setHours(23, 59, 59, 999);


//     // 1) Validate input from admin
//     const {
//       variety,
//       symbol,
//       token,
//       transactiontype,
//       exch_seg,
//       orderType,
//       productType,
//       duration,
//       price,
//       quantity,
//       groupName,
//       totalPrice,
//       actualQuantity,
//     } = req.body;

//     if (
//       !symbol ||
//       !token ||
//       !transactiontype ||
//       !exch_seg ||
//       !orderType ||
//       !quantity ||
//       !variety ||
//       !productType ||
//       !price ||
//       !duration ||
//       !groupName
//     ) {
//       return res.json({
//         status: false,
//         statusCode: 400,
//         message: "Missing required order fields",
//         data: null,
//         error: "Missing required order fields",
//       });
//     }

//     // 2) Find all users in this strategy group with Angel login active
//     const users = await User.findAll({
//       where: {
//         angelLoginUser: true,
//         strategyName: groupName,
//       },
//        raw: true
//     });

//     if (!users || users.length === 0) {
//       return res.json({
//         status: false,
//         statusCode: 404,
//         message: "No users found for this group with active AngelOne login",
//         data: [],
//       });
//     }

//     // 3) Process each user in parallel (Promise.all)
//     const results = await Promise.all(

//       users.map(async (user) => {

//         // 3a) Build order payload (same style as single placeOrder)
//         const saveObj = {
//           variety,
//           tradingsymbol: symbol,
//           symboltoken: token,
//           transactiontype,
//           exchange: exch_seg,
//           ordertype: orderType,
//           quantity,
//           producttype: productType || "INTRADAY",
//           duration: duration || "DAY",
//           price,
//           squareoff: "0",
//           stoploss: "0",
//           orderstatuslocaldb:'PENDING',
//           userId: user.id,
//           totalPrice: totalPrice || price * quantity,
//           actualQuantity: actualQuantity || quantity,
//         };

//         // 3b) Create pending record in PG
//         const newOrder = await Order.create(saveObj);

//         try {
//           // 3c) Place order with AngelOne
//           const placeRes = await axios.post(ANGEL_ONE_PLACE_URL, saveObj, {
//             headers: angelHeaders(user.authToken),
//           });

         
//           if (placeRes.data?.status === true) {
//             const orderid = placeRes?.data?.data?.orderid || null;
//             const uniqueOrderId = placeRes?.data?.data?.uniqueorderid || null;

//             console.log(placeRes.data.data,'order place');
            

//             // Update local order with broker ids
//             await newOrder.update({
//               orderid,
//               uniqueorderid: uniqueOrderId,
//             });

//             // 🔍 STEP 2: Fetch order details by uniqueOrderId
//             if (uniqueOrderId) {
//               try {
//                 const detailsRes = await axios.get(
//                   ANGEL_ONE_DETAILS_URL(uniqueOrderId),
//                   { headers: angelHeaders(user.authToken) }
//                 );
 

//                 if (detailsRes.data?.status === true) {

//                   let orderstatuslocaldb = ''

//                   if(detailsRes?.data?.data.transactiontype==='BUY') {

//                     orderstatuslocaldb = 'OPEN'
                
//                   }else{
                    
//                       await Order.update(
//                           { orderstatuslocaldb: "COMPLETE" },   // UPDATE only this field
//                           {
//                             where: {
//                               variety: variety,
//                               tradingsymbol: symbol,
//                               symboltoken: token,
//                               transactiontype: transactiontype,
//                               exchange: exch_seg,
//                               ordertype: orderType,
//                               quantity: quantity,
//                               producttype: productType || "INTRADAY",
//                               createdAt: {
//                                 [Op.between]: [startOfDay, endOfDay]   // ❤️ match today only
//                               }
//                             },
//                           }
//                         );

//                   }

//                   orderstatuslocaldb = 'COMPLETE'

//                     // Update full details in PG
//                 await newOrder.update({...detailsRes.data.data, orderstatuslocaldb:orderstatuslocaldb, });
 
//                   // 🔍 STEP 3: Get trade book
//                   const tradeCfg = {
//                     method: "get",
//                     url: ANGEL_ONE_TRADE_DETAILS_URL,
//                     headers: angelHeaders(user.authToken),
//                   };

//                   const tradeRes = await axios(tradeCfg);

//                   if (
//                     tradeRes.data?.status === true &&
//                     Array.isArray(tradeRes.data.data)
//                   ) {
//                     const tradeList = tradeRes.data.data;
//                     const matchedTrade = tradeList.find(
//                       (t) => t.orderid === orderid
//                     );

//                     if (matchedTrade) {
//                       const fillsize = matchedTrade.fillsize;
//                       const fillid = matchedTrade.fillid;
//                       const fillprice = matchedTrade.fillprice;
//                       const tradevalue = matchedTrade.tradevalue;
//                       const filltime = matchedTrade.filltime;

//                       await newOrder.update({
//                         tradedValue: tradevalue,
//                         fillprice,
//                         fillsize,
//                         filltime,
//                         fillid,
//                       });

//                       return {
//                         userId: user.id,
//                         localOrderId: newOrder.id,
//                         result: "success",
//                         message: "Order placed and trade updated",
//                         orderid,
//                         uniqueOrderId,
//                       };
//                     } else {
//                       // No matching trade found
//                       return {
//                         userId: user.id,
//                         localOrderId: newOrder.id,
//                         result: "placed_no_trade_match",
//                         message:
//                           "Order placed, details found, but no matching trade in trade book",
//                         orderid,
//                         uniqueOrderId,
//                       };
//                     }
//                   } else if (
//                     tradeRes.data?.status === true &&
//                     tradeRes.data.data === null
//                   ) {
//                     // Angel says status true but no trades yet
//                     return {
//                       userId: user.id,
//                       localOrderId: newOrder.id,
//                       result: "open_no_trade",
//                       message:
//                         "Order placed successfully but status is OPEN (no trades yet)",
//                       orderid,
//                       uniqueOrderId,
//                     };
//                   } else {
//                     // trade API failed or inconsistent
//                     return {
//                       userId: user.id,
//                       localOrderId: newOrder.id,
//                       result: "placed_trade_not_updated",
//                       message:
//                         "Order placed successfully but traded value/time not updated",
//                       orderid,
//                       uniqueOrderId,
//                     };
//                   }
//                 } else {
//                   // detailsRes.status false
//                   return {
//                     userId: user.id,
//                     localOrderId: newOrder.id,
//                     result: "placed_details_not_ok",
//                     message:
//                       "Order placed but order details status not OK from broker",
//                     orderid,
//                     uniqueOrderId,
//                   };
//                 }
//               } catch (detailsErr) {
//                 // error in fetching details
//                 return {
//                   userId: user.id,
//                   localOrderId: newOrder.id,
//                   result: "placed_no_details",
//                   message:
//                     "Order placed but failed to fetch order details from broker",
//                   orderid,
//                   uniqueOrderId,
//                   error: safeErrPayload(detailsErr),
//                 };
//               }
//             } else {
//               // No uniqueOrderId returned
//               return {
//                 userId: user.id,
//                 localOrderId: newOrder.id,
//                 result: "placed_no_uniqueorderid",
//                 message:
//                   "Order placed but uniqueorderid not returned by AngelOne",
//                 orderid,
//                 uniqueOrderId: null,
//               };
//             }
//           } else {
//             // placeRes.data.status === false → treat as broker reject
//             await newOrder.update({
//               status: "cancelled",
//             });

//             return {
//               userId: user.id,
//               localOrderId: newOrder.id,
//               result: "broker_rejected",
//               message:
//                 placeRes.data?.message ||
//                 "Order not placed by broker (status false)",
//             };
//           }
//         } catch (placeErr) {
         
//           // Angel API place call failed
//           await newOrder.update({
//             status: "FAILED",
//             errorMessage: safeErrPayload(placeErr),
//           });

//           return {
//             userId: user.id,
//             localOrderId: newOrder.id,
//             result: "failed",
//             message: "Order place API failed",
//             error: safeErrPayload(placeErr),
//           };
//         }
//       })
//     );


//     return res.json({
//       status: true,
//       statusCode: 200,
//       message: "Bulk order processing complete",
//       data: results,
//       error: null,
//     });

//   } catch (error) {

//     return res.json({
//       status: false,
//       statusCode: 500,
//       message: "Unexpected error occurred. Please try again.",
//       data: null,
//       error: error.message,
//     });
//   }
// };



export const adminPlaceMultipleOrder = async (req, res) => {
  try {

    let socketAuthToken = ''

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // 1) Validate input from admin
    const {
      variety,
      symbol,
      token,
      transactiontype,
      exch_seg,
      orderType,
      productType,
      duration,
      price,
      quantity,
      groupName,
      totalPrice,
      actualQuantity,
    } = req.body;

    if (
      !symbol ||
      !token ||
      !transactiontype ||
      !exch_seg ||
      !orderType ||
      !quantity ||
      !variety ||
      !productType ||
      !price ||
      !duration ||
      !groupName
    ) {
      return res.json({
        status: false,
        statusCode: 400,
        message: "Missing required order fields",
        data: null,
        error: "Missing required order fields",
      });
    }

    // 2) Find all users in this strategy group with Angel login active
    const users = await User.findAll({
      where: {
        angelLoginUser: true,
        strategyName: groupName,
      },
      raw: true,
    });

    if (!users || users.length === 0) {
      return res.json({
        status: false,
        statusCode: 404,
        message: "No users found for this group with active AngelOne login",
        data: [],
      });
    }

    // 3) Process each user in parallel (Promise.allSettled)
    const settled = await Promise.allSettled(
      users.map(async (user) => {
        // 3a) Build order payload (same style as single placeOrder)
        const saveObj = {
          variety,
          tradingsymbol: symbol,
          symboltoken: token,
          transactiontype,
          exchange: exch_seg,
          ordertype: orderType,
          quantity,
          producttype: productType || "INTRADAY",
          duration: duration || "DAY",
          price,
          squareoff: "0",
          stoploss: "0",
          orderstatuslocaldb: "PENDING",
          userId: user.id,
          totalPrice: totalPrice || price * quantity,
          actualQuantity: actualQuantity || quantity,
        };

        // 3b) Create pending record in PG
        const newOrder = await Order.create(saveObj);

        try {
          // 3c) Place order with AngelOne
          const placeRes = await axios.post(ANGEL_ONE_PLACE_URL, saveObj, {
            headers: angelHeaders(user.authToken),
          });

          if (placeRes.data?.status === true) {
            const orderid = placeRes?.data?.data?.orderid || null;
            const uniqueOrderId = placeRes?.data?.data?.uniqueorderid || null;

            // Update local order with broker ids
            await newOrder.update({
              orderid,
              uniqueorderid: uniqueOrderId,
            });

            // 🔍 STEP 2: Fetch order details by uniqueOrderId
            if (uniqueOrderId) {
              try {
                const detailsRes = await axios.get(
                  ANGEL_ONE_DETAILS_URL(uniqueOrderId),
                  { headers: angelHeaders(user.authToken) }
                );

                if (detailsRes.data?.status === true) {
                  let orderstatuslocaldb = "";

                  if (
                    detailsRes?.data?.data.transactiontype === "BUY"
                  ) {
                    orderstatuslocaldb = "OPEN";
                  } else {
                    // For SELL leg: mark matching orders as COMPLETE for today
                    await Order.update(
                      { orderstatuslocaldb: "COMPLETE" }, // UPDATE only this field
                      {
                        where: {
                          variety,
                          tradingsymbol: symbol,
                          symboltoken: token,
                          transactiontype,
                          exchange: exch_seg,
                          ordertype: orderType,
                          quantity,
                          producttype: productType || "INTRADAY",
                          createdAt: {
                            [Op.between]: [startOfDay, endOfDay], // match today only
                          },
                        },
                      }
                    );
                    orderstatuslocaldb = "COMPLETE";
                  }

                  // Ensure final status is COMPLETE if you want to always close this local order
                  // orderstatuslocaldb = "COMPLETE";

                  // Update full details in PG
                  await newOrder.update({
                    ...detailsRes.data.data,
                    orderstatuslocaldb,
                  });

                  // 🔍 STEP 3: Get trade book
                  const tradeCfg = {
                    method: "get",
                    url: ANGEL_ONE_TRADE_DETAILS_URL,
                    headers: angelHeaders(user.authToken),
                  };

                  const tradeRes = await axios(tradeCfg);

                  if (
                    tradeRes.data?.status === true &&
                    Array.isArray(tradeRes.data.data)
                  ) {
                    const tradeList = tradeRes.data.data;
                    const matchedTrade = tradeList.find(
                      (t) => t.orderid === orderid
                    );

                    if (matchedTrade) {
                      const {
                        fillsize,
                        fillid,
                        fillprice,
                        tradevalue,
                        filltime,
                      } = matchedTrade;

                      await newOrder.update({
                        tradedValue: tradevalue,
                        fillprice,
                        fillsize,
                        filltime,
                        fillid,
                      });

                      if(!socketAuthToken){
                        socketAuthToken = user.authToken
                      } 

                      return {
                        userId: user.id,
                        localOrderId: newOrder.id,
                        result: "success",
                        message: "Order placed and trade updated",
                        orderid,
                        uniqueOrderId,
                      };
                    } else {
                      // No matching trade found
                      return {
                        userId: user.id,
                        localOrderId: newOrder.id,
                        result: "placed_no_trade_match",
                        message:
                          "Order placed, details found, but no matching trade in trade book",
                        orderid,
                        uniqueOrderId,
                      };
                    }
                  } else if (
                    tradeRes.data?.status === true &&
                    tradeRes.data.data === null
                  ) {
                    // Angel says status true but no trades yet
                    return {
                      userId: user.id,
                      localOrderId: newOrder.id,
                      result: "open_no_trade",
                      message:
                        "Order placed successfully but status is OPEN (no trades yet)",
                      orderid,
                      uniqueOrderId,
                    };
                  } else {
                    // trade API failed or inconsistent
                    return {
                      userId: user.id,
                      localOrderId: newOrder.id,
                      result: "placed_trade_not_updated",
                      message:
                        "Order placed successfully but traded value/time not updated",
                      orderid,
                      uniqueOrderId,
                    };
                  }
                } else {
                  // detailsRes.status false
                  return {
                    userId: user.id,
                    localOrderId: newOrder.id,
                    result: "placed_details_not_ok",
                    message:
                      "Order placed but order details status not OK from broker",
                    orderid,
                    uniqueOrderId,
                  };
                }
              } catch (detailsErr) {
                // error in fetching details
                return {
                  userId: user.id,
                  localOrderId: newOrder.id,
                  result: "placed_no_details",
                  message:
                    "Order placed but failed to fetch order details from broker",
                  orderid,
                  uniqueOrderId,
                  error: safeErrPayload(detailsErr),
                };
              }
            } else {
              // No uniqueOrderId returned
              return {
                userId: user.id,
                localOrderId: newOrder.id,
                result: "placed_no_uniqueorderid",
                message:
                  "Order placed but uniqueorderid not returned by AngelOne",
                orderid,
                uniqueOrderId: null,
              };
            }
          } else {
            // placeRes.data.status === false → treat as broker reject
            await newOrder.update({
              status: "cancelled",
              orderstatuslocaldb: "FAILED",
            });

            return {
              userId: user.id,
              localOrderId: newOrder.id,
              result: "broker_rejected",
              message:
                placeRes.data?.message ||
                "Order not placed by broker (status false)",
            };
          }
        } catch (placeErr) {
          // Angel API place call failed
          await newOrder.update({
            status: "FAILED",
            errorMessage: safeErrPayload(placeErr),
          });

          // We RETURN an object instead of throwing,
          // so Promise.allSettled will mark this as fulfilled with this value
          return {
            userId: user.id,
            localOrderId: newOrder.id,
            result: "failed",
            message: "Order place API failed",
            error: safeErrPayload(placeErr),
          };
        }
      })
    );

    // 4) Normalize settled results: fulfilled vs rejected
    const results = settled.map((item, index) => {
      if (item.status === "fulfilled") {
        return item.value; // whatever we returned from the async map()
      } else {
        // Rejected promise (unexpected error not caught inside)
        const user = users[index];
        return {
          userId: user?.id,
          localOrderId: null,
          result: "promise_rejected",
          message: item.reason?.message || String(item.reason),
        };
      }
    });

    //  socket is emit 
    emitOrderGet(socketAuthToken)

    return res.json({
      status: true,
      statusCode: 200,
      message: "Bulk order processing complete",
      data: results,
      error: null,
    });
  } catch (error) {
    return res.json({
      status: false,
      statusCode: 500,
      message: "Unexpected error occurred. Please try again.",
      data: null,
      error: error.message,
    });
  }
};



export const adminSequareOff = async (req, res) => {
  try {
    // (optional) const { groupName } = req.body; // if you want per-strategy square off

    // 1️⃣ Get today's time range
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // 2️⃣ Fetch all OPEN orders created today
    const openOrders = await Order.findAll({
      where: {
        orderstatuslocaldb: "OPEN",
        createdAt: {
          [Op.between]: [startOfDay, endOfDay],
        },
        // If you want to filter by strategy/group:
        // strategyName: groupName,
      },
      order: [["createdAt", "DESC"]],
      raw: true,
    });

    if (!openOrders || openOrders.length === 0) {
      return res.json({
        status: false,
        statusCode: 404,
        message: "No OPEN orders found for today to square off",
        data: [],
      });
    }

    // 3️⃣ Process each open order in parallel with Promise.allSettled
    const settled = await Promise.allSettled(
      openOrders.map(async (openOrder) => {
        try {
          // 3a) Find user for this order
          const user = await User.findOne({
            where: {
              id: openOrder.userId,
              angelLoginUser: true,
            },
            raw: true,
          });

          if (!user) {
            return {
              userId: openOrder.userId,
              openOrderId: openOrder.id,
              result: "NO_USER_OR_NOT_ANGEL",
              message:
                "User not found or AngelOne login is not active for this user",
            };
          }

          if (!user.authToken) {
            return {
              userId: openOrder.userId,
              openOrderId: openOrder.id,
              result: "NO_TOKEN",
              message: "User does not have AngelOne authToken",
            };
          }

          // 3b) Decide transaction type for square off (reverse leg)
          const squareTxnType = "SELL"; // 🔁 for now fixed, you can reverse based on original if needed

          // 3c) Build square-off order payload
          const saveObj = {
            variety: openOrder.variety,
            tradingsymbol: openOrder.tradingsymbol,
            instrumenttype: openOrder.instrumenttype,
            symboltoken: openOrder.symboltoken,
            transactiontype: squareTxnType,
            exchange: openOrder.exchange,
            ordertype: openOrder.ordertype,
            quantity: openOrder.quantity,
            producttype: openOrder.producttype || "INTRADAY",
            duration: openOrder.duration || "DAY",
            price: openOrder.price,
            squareoff: "0",
            stoploss: "0",
            orderstatuslocaldb: "PENDING",
            userId: openOrder.userId,
            totalPrice: openOrder.totalPrice,
            actualQuantity: openOrder.actualQuantity,
          };

          // 3d) Create pending square-off order in PG
          const newOrder = await Order.create(saveObj);

          // 3e) Place order with AngelOne
          const placeRes = await axios.post(ANGEL_ONE_PLACE_URL, saveObj, {
            headers: angelHeaders(user.authToken),
          });

          if (placeRes.data?.status !== true) {
            await newOrder.update({
              status: "cancelled",
              orderstatuslocaldb: "FAILED",
            });

            return {
              userId: user.id,
              localOrderId: newOrder.id,
              openOrderId: openOrder.id,
              result: "broker_rejected",
              message:
                placeRes.data?.message ||
                "Square-off order not placed by broker (status false)",
            };
          }

          const orderid = placeRes?.data?.data?.orderid || null;
          const uniqueOrderId = placeRes?.data?.data?.uniqueorderid || null;

          await newOrder.update({
            orderid,
            uniqueorderid: uniqueOrderId,
          });

          // 3f) Fetch order details if uniqueOrderId exists
          if (!uniqueOrderId) {
            return {
              userId: user.id,
              localOrderId: newOrder.id,
              openOrderId: openOrder.id,
              result: "placed_no_uniqueorderid",
              message:
                "Square-off order placed but uniqueorderid not returned by AngelOne",
              orderid,
              uniqueOrderId: null,
            };
          }

          // ---- ORDER DETAILS ----
          let orderstatuslocaldb = "PENDING";

          try {
            const detailsRes = await axios.get(
              ANGEL_ONE_DETAILS_URL(uniqueOrderId),
              { headers: angelHeaders(user.authToken) }
            );

            if (detailsRes.data?.status === true) {
              const details = detailsRes.data.data;

              if (details.transactiontype === "BUY") {
                orderstatuslocaldb = "OPEN";
              } else {
                // This is square-off leg (usually SELL) → mark original & related as COMPLETE
                await Order.update(
                  { orderstatuslocaldb: "COMPLETE" },
                  {
                    where: {
                      userId: openOrder.userId,
                      tradingsymbol: openOrder.tradingsymbol,
                      symboltoken: openOrder.symboltoken,
                      producttype: openOrder.producttype || "INTRADAY",
                      createdAt: {
                        [Op.between]: [startOfDay, endOfDay],
                      },
                    },
                  }
                );
                orderstatuslocaldb = "COMPLETE";
              }

              // Update square-off order row with details + status
              await newOrder.update({
                ...details,
                orderstatuslocaldb,
              });
            } else {
              return {
                userId: user.id,
                localOrderId: newOrder.id,
                openOrderId: openOrder.id,
                result: "placed_details_not_ok",
                message:
                  "Square-off order placed but order details status not OK from broker",
                orderid,
                uniqueOrderId,
              };
            }
          } catch (detailsErr) {
            return {
              userId: user.id,
              localOrderId: newOrder.id,
              openOrderId: openOrder.id,
              result: "placed_no_details",
              message:
                "Square-off order placed but failed to fetch order details from broker",
              orderid,
              uniqueOrderId,
              error: safeErrPayload(detailsErr),
            };
          }

          // ---- TRADE BOOK ----
          try {
            const tradeCfg = {
              method: "get",
              url: ANGEL_ONE_TRADE_DETAILS_URL,
              headers: angelHeaders(user.authToken),
            };

            const tradeRes = await axios(tradeCfg);

            if (
              tradeRes.data?.status === true &&
              Array.isArray(tradeRes.data.data)
            ) {
              const tradeList = tradeRes.data.data;
              const matchedTrade = tradeList.find(
                (t) => t.orderid === orderid
              );

              if (matchedTrade) {
                const {
                  fillsize,
                  fillid,
                  fillprice,
                  tradevalue,
                  filltime,
                } = matchedTrade;

                await newOrder.update({
                  tradedValue: tradevalue,
                  fillprice,
                  fillsize,
                  filltime,
                  fillid,
                });

                return {
                  userId: user.id,
                  localOrderId: newOrder.id,
                  openOrderId: openOrder.id,
                  result: "success",
                  message: "Square-off order placed and trade updated",
                  orderid,
                  uniqueOrderId,
                };
              } else {
                return {
                  userId: user.id,
                  localOrderId: newOrder.id,
                  openOrderId: openOrder.id,
                  result: "placed_no_trade_match",
                  message:
                    "Square-off order placed, details found, but no matching trade in trade book",
                  orderid,
                  uniqueOrderId,
                };
              }
            } else if (
              tradeRes.data?.status === true &&
              tradeRes.data.data === null
            ) {
              return {
                userId: user.id,
                localOrderId: newOrder.id,
                openOrderId: openOrder.id,
                result: "open_no_trade",
                message:
                  "Square-off order placed successfully but status is OPEN (no trades yet)",
                orderid,
                uniqueOrderId,
              };
            } else {
              return {
                userId: user.id,
                localOrderId: newOrder.id,
                openOrderId: openOrder.id,
                result: "placed_trade_not_updated",
                message:
                  "Square-off order placed successfully but traded value/time not updated",
                orderid,
                uniqueOrderId,
              };
            }
          } catch (tradeErr) {
            return {
              userId: user.id,
              localOrderId: newOrder.id,
              openOrderId: openOrder.id,
              result: "placed_trade_api_failed",
              message:
                "Square-off order placed but trade book API failed to respond",
              orderid,
              uniqueOrderId,
              error: safeErrPayload(tradeErr),
            };
          }
        } catch (e) {
          console.error(
            `Square-off flow error for openOrder ${openOrder.id}:`,
            e.message
          );

          return {
            userId: openOrder.userId,
            openOrderId: openOrder.id,
            result: "failed",
            message: "Square-off flow failed for this order",
            error: safeErrPayload(e),
          };
        }
      })
    );

    // 4️⃣ Normalize Promise.allSettled result
    const results = settled.map((item, index) => {
      if (item.status === "fulfilled") {
        return item.value; // our returned object above
      } else {
        const openOrder = openOrders[index];
        return {
          userId: openOrder?.userId,
          openOrderId: openOrder?.id,
          result: "promise_rejected",
          message: item.reason?.message || String(item.reason),
        };
      }
    });

    return res.json({
      status: true,
      statusCode: 200,
      message: "Bulk square-off processing complete",
      data: results,
      error: null,
    });
  } catch (error) {
    console.error("adminSequareOff error:", error);

    return res.json({
      status: false,
      statusCode: 500,
      message: "Unexpected error occurred. Please try again.",
      data: null,
      error: error.message,
    });
  }
};


// export const adminSequareOff = async (req, res) => {
//   try {

//     // (optional) const { groupName } = req.body; // if you want per-strategy square off

//     // 1️⃣ Get today's time range
//     const startOfDay = new Date();
//     startOfDay.setHours(0, 0, 0, 0);

//     const endOfDay = new Date();
//     endOfDay.setHours(23, 59, 59, 999);

//     // 2️⃣ Fetch all OPEN orders created today
//     const openOrders = await Order.findAll({
//       where: {
//         orderstatuslocaldb: "OPEN",
//         createdAt: {
//           [Op.between]: [startOfDay, endOfDay],
//         },
//         // If you want to filter by strategy/group:
//         // strategyName: groupName,
//       },
//       order: [["createdAt", "DESC"]],
//       raw: true,
//     });

//     if (!openOrders || openOrders.length === 0) {
//       return res.json({
//         status: false,
//         statusCode: 404,
//         message: "No OPEN orders found for today to square off",
//         data: [],
//       });
//     }

//     // 3️⃣ Process each open order in parallel
//     const results = await Promise.all(

//       openOrders.map(async (openOrder) => {
//         try {
//           // 3a) Find user for this order
//           const user = await User.findOne({
//             where: {
//               id: openOrder.userId,
//               angelLoginUser: true,
//             },
//             raw: true,
//           });

//           if (!user) {
//             return {
//               userId: openOrder.userId,
//               openOrderId: openOrder.id,
//               result: "NO_USER_OR_NOT_ANGEL",
//               message:
//                 "User not found or AngelOne login is not active for this user",
//             };
//           }

//           if (!user.authToken) {
//             return {
//               userId: openOrder.userId,
//               openOrderId: openOrder.id,
//               result: "NO_TOKEN",
//               message: "User does not have AngelOne authToken",
//             };
//           }

//           // 3b) Decide transaction type for square off (reverse of original)
//           const squareTxnType = 'SELL'

//           // 3c) Build square-off order payload
//           const saveObj = {
//             variety: openOrder.variety,
//             tradingsymbol: openOrder.tradingsymbol,
//             symboltoken: openOrder.symboltoken,
//             transactiontype: squareTxnType,             // 🔁 reverse leg
//             exchange: openOrder.exchange,
//             ordertype: openOrder.ordertype,
//             quantity: openOrder.quantity,
//             producttype: openOrder.producttype || "INTRADAY",
//             duration: openOrder.duration || "DAY",
//             price: openOrder.price,
//             squareoff: "0",
//             stoploss: "0",
//             orderstatuslocaldb: "PENDING",
//             userId: openOrder.userId,
//             totalPrice:openOrder.totalPrice,
//             actualQuantity: openOrder.actualQuantity,
//           };

//           // 3d) Create pending square-off order in PG
//           const newOrder = await Order.create(saveObj);

//           // 3e) Place order with AngelOne
//           const placeRes = await axios.post(ANGEL_ONE_PLACE_URL, saveObj, {
//             headers: angelHeaders(user.authToken),
//           });

//           if (placeRes.data?.status !== true) {

//             await newOrder.update({
//               status: "cancelled",
//               orderstatuslocaldb: "FAILED",
//             });

//             return {
//               userId: user.id,
//               localOrderId: newOrder.id,
//               openOrderId: openOrder.id,
//               result: "broker_rejected",
//               message:
//                 placeRes.data?.message ||
//                 "Square-off order not placed by broker (status false)",
//             };
//           }

//           const orderid = placeRes?.data?.data?.orderid || null;
//           const uniqueOrderId = placeRes?.data?.data?.uniqueorderid || null;

//           await newOrder.update({
//             orderid,
//             uniqueorderid: uniqueOrderId,
//           });

//           // 3f) Fetch order details if uniqueOrderId exists
//           if (!uniqueOrderId) {

//             return {
//               userId: user.id,
//               localOrderId: newOrder.id,
//               openOrderId: openOrder.id,
//               result: "placed_no_uniqueorderid",
//               message:
//                 "Square-off order placed but uniqueorderid not returned by AngelOne",
//               orderid,
//               uniqueOrderId: null,
//             };
//           }

//           // ---- ORDER DETAILS ----
//           let orderstatuslocaldb = "PENDING";

//           try {
//             const detailsRes = await axios.get(
//               ANGEL_ONE_DETAILS_URL(uniqueOrderId),
//               { headers: angelHeaders(user.authToken) }
//             );

//             if (detailsRes.data?.status === true) {
//               const details = detailsRes.data.data;

//               if (details.transactiontype === "BUY") {
//                 orderstatuslocaldb = "OPEN";
//               } else {
//                 // This is square-off leg (usually SELL) → mark original & related as COMPLETE
//                 await Order.update(
//                   { orderstatuslocaldb: "COMPLETE" },
//                   {
//                     where: {
//                       userId: openOrder.userId,
//                       tradingsymbol: openOrder.tradingsymbol,
//                       symboltoken: openOrder.symboltoken,
//                       producttype: openOrder.producttype || "INTRADAY",
//                       createdAt: {
//                         [Op.between]: [startOfDay, endOfDay],
//                       },
//                     },
//                   }
//                 );
//                 orderstatuslocaldb = "COMPLETE";
//               }

//               // Update square-off order row with details + status
//               await newOrder.update({
//                 ...details,
//                 orderstatuslocaldb,
//               });
//             } else {
//               return {
//                 userId: user.id,
//                 localOrderId: newOrder.id,
//                 openOrderId: openOrder.id,
//                 result: "placed_details_not_ok",
//                 message:
//                   "Square-off order placed but order details status not OK from broker",
//                 orderid,
//                 uniqueOrderId,
//               };
//             }
//           } catch (detailsErr) {
//             return {
//               userId: user.id,
//               localOrderId: newOrder.id,
//               openOrderId: openOrder.id,
//               result: "placed_no_details",
//               message:
//                 "Square-off order placed but failed to fetch order details from broker",
//               orderid,
//               uniqueOrderId,
//               error: safeErrPayload(detailsErr),
//             };
//           }

//           // ---- TRADE BOOK ----
//           try {
//             const tradeCfg = {
//               method: "get",
//               url: ANGEL_ONE_TRADE_DETAILS_URL,
//               headers: angelHeaders(user.authToken),
//             };

//             const tradeRes = await axios(tradeCfg);

//             if (
//               tradeRes.data?.status === true &&
//               Array.isArray(tradeRes.data.data)
//             ) {
//               const tradeList = tradeRes.data.data;
//               const matchedTrade = tradeList.find(
//                 (t) => t.orderid === orderid
//               );

//               if (matchedTrade) {
//                 const {
//                   fillsize,
//                   fillid,
//                   fillprice,
//                   tradevalue,
//                   filltime,
//                 } = matchedTrade;

//                 await newOrder.update({
//                   tradedValue: tradevalue,
//                   fillprice,
//                   fillsize,
//                   filltime,
//                   fillid,
//                 });

//                 return {
//                   userId: user.id,
//                   localOrderId: newOrder.id,
//                   openOrderId: openOrder.id,
//                   result: "success",
//                   message: "Square-off order placed and trade updated",
//                   orderid,
//                   uniqueOrderId,
//                 };
//               } else {
//                 return {
//                   userId: user.id,
//                   localOrderId: newOrder.id,
//                   openOrderId: openOrder.id,
//                   result: "placed_no_trade_match",
//                   message:
//                     "Square-off order placed, details found, but no matching trade in trade book",
//                   orderid,
//                   uniqueOrderId,
//                 };
//               }
//             } else if (
//               tradeRes.data?.status === true &&
//               tradeRes.data.data === null
//             ) {
//               return {
//                 userId: user.id,
//                 localOrderId: newOrder.id,
//                 openOrderId: openOrder.id,
//                 result: "open_no_trade",
//                 message:
//                   "Square-off order placed successfully but status is OPEN (no trades yet)",
//                 orderid,
//                 uniqueOrderId,
//               };
//             } else {
//               return {
//                 userId: user.id,
//                 localOrderId: newOrder.id,
//                 openOrderId: openOrder.id,
//                 result: "placed_trade_not_updated",
//                 message:
//                   "Square-off order placed successfully but traded value/time not updated",
//                 orderid,
//                 uniqueOrderId,
//               };
//             }
//           } catch (tradeErr) {
//             return {
//               userId: user.id,
//               localOrderId: newOrder.id,
//               openOrderId: openOrder.id,
//               result: "placed_trade_api_failed",
//               message:
//                 "Square-off order placed but trade book API failed to respond",
//               orderid,
//               uniqueOrderId,
//               error: safeErrPayload(tradeErr),
//             };
//           }
//         } catch (e) {
//           console.error(
//             `Square-off flow error for openOrder ${openOrder.id}:`,
//             e.message
//           );

//           return {
//             userId: openOrder.userId,
//             openOrderId: openOrder.id,
//             result: "failed",
//             message: "Square-off flow failed for this order",
//             error: safeErrPayload(e),
//           };
//         }
//       })
//     );

//     return res.json({
//       status: true,
//       statusCode: 200,
//       message: "Bulk square-off processing complete",
//       data: results,
//       error: null,
//     });

//   } catch (error) {
//     console.error("adminSequareOff error:", error);

//     return res.json({
//       status: false,
//       statusCode: 500,
//       message: "Unexpected error occurred. Please try again.",
//       data: null,
//       error: error.message,
//     });
//   }
// };



//  old to old 
// export const adminPlaceMultipleOrder = async (req, res) => {
//   try {

//     // 1) Validate input
//     const {
//       variety, symbol, token,transactiontype,exch_seg,      
//       orderType,productType,duration,price,quantity,groupName
//     } = req.body 


//     if (!symbol || !token || !transactiontype || !exch_seg || !orderType 
//       || !quantity||!variety||!productType||!price||!duration) {

//         return res.json({
//             status: false,
//             statusCode:400,
//             message: "Missing required order fields",
//             data:null,
//             error:' Missing required order fields',
//         });

//     }

//         // 2) Build order payload (exact keys AngelOne expects)
//         const orderData = {
//         variety,
//         tradingsymbol: symbol,
//         symboltoken: token,
//         transactiontype,
//         exchange: exch_seg,
//         ordertype: orderType,
//         producttype: productType || "INTRADAY",
//         duration: duration || "DAY",
//         price,
//         squareoff: "0",
//         stoploss: "0",
//         quantity,
//         };

//         //  3) find Login User
//         const users = await User.findAll({
//                 where: {
//                   angelLoginUser: true,
//                   strategyName:groupName
//                 },
//                  raw: true
//               });

   
//     // 3) Process all users in parallel
//     const results = await Promise.all(
//       users.map(async (user) => {
        
//         // 3a) Create local INITIATED record
//         const localOrder = await Order.create({
//           userId: user.id,
//           ...orderData,
//           status: "INITIATED",
//         });

//         try {


//           // 3b) Place order with AngelOne
//           const placeRes = await axios.post(ANGEL_ONE_PLACE_URL, orderData, {
//             headers: angelHeaders(user.authToken),
//           });

//           const { status, data, message } = placeRes?.data || {};

//           const orderid = data?.orderid || null;

//           const uniqueOrderId = data?.uniqueorderid || null;

//           // 3c) Update local → PLACED/FAILED
//           await localOrder.update({
//             status:"OPEN" ,
//             orderid,
//             uniqueorderid:uniqueOrderId,
//           });

//           // 3d) If we have uniqueOrderId, fetch details & update final status
//           if (uniqueOrderId) {
//             try {
//               const detailsRes = await axios.get(
//                 ANGEL_ONE_DETAILS_URL(uniqueOrderId),
//                 { headers: angelHeaders(user.authToken) }
//               );

//               // Try common fields that carry broker status
//               const brokerStatus = detailsRes?.data.status

//               await localOrder.update(detailsRes.data.data);


//               // 3b) Place order with AngelOne
//           const placeRes = await axios.get(ANGEL_ONE_TRADE_DETAILS_URL, {
//             headers: angelHeaders(user.authToken),
//           });



//               return {
//                 userId: user.id,
//                 localOrderId: localOrder.id,
//                 result: "success",
//                 orderid,
//                 uniqueOrderId,
//                 status: brokerStatus,
//               };

//             } catch (detailsErr) {

//               return {
//                 userId: user.id,
//                 localOrderId: localOrder.id,
//                 result: "placed_no_details",
//                 orderid,
//                 uniqueOrderId,
//                 error: detailsErr?.message,
//               };
//             }
//           }

//           // No uniqueOrderId returned, still return placed result
//           return {
//             userId: user.id,
//             localOrderId: localOrder.id,
//             result: status ? "placed" : "failed",
//             orderid,
//             uniqueOrderId,
//             message,
//           };
//         } catch (placeErr) {
//           // 3e) Broker place failed → update local → FAILED
//           await localOrder.update({
//             status: "FAILED",
//             errorMessage: safeErrPayload(placeErr),
//           });

//           return {
//             userId: user.id,
//             localOrderId: localOrder.id,
//             result: "failed",
//             error: placeErr?.message,
//           };
//         }
//       })
//     );

//      return res.json({
//             status: true,
//             statusCode:201,
//             message: "Bulk order processing complete",
//             data:null,
//             error:null,
//         });

//   } catch (error) {

//      return res.json({
//             status: false,
//             statusCode:500,
//             message: "Unexpected error occurred. Please try again.",
//             data:null,
//             error: error.message,
//         });

//   }
// };



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









const ANGEL_LOGIN_URL =
  "https://apiconnect.angelone.in//rest/auth/angelbroking/user/v1/loginByPassword";

const ANGEL_RMS_URL =
  "https://apiconnect.angelone.in/rest/secure/angelbroking/user/v1/getRMS";


  // 🔹 Admin: login all users (via TOTP), save tokens in FundPNL, then fetch funds

//   export const refreshAngelFundsForAllUsers = async (req, res) => {
//   try {

//     // 1️⃣ Get all AngelOne users (add where condition if needed)
//     const users = await User.findAll({
//       where: {
//         // brokerName: "Angelone",
//         // angelLoginUser: true,
//       },
//       // ❌ do NOT use raw:true – we might need instance methods later
//     });

//     if (!users.length) {
//       return res.json({
//         status: true,
//         statusCode: 200,
//         message: "No Angelone users found",
//         data: [],
//       });
//     }

//     const results = [];
//     const THIRTY_MIN_MS = 30 * 60 * 1000;

//     // 2️⃣ Loop sequentially (safer for rate limits)
//     for (const user of users) {
//       try {
//         // 2.0️⃣ Check if we already have a fresh FundPNL row (updated in last 30 minutes)
//         const existingFund = await FundPNL.findOne({
//           where: { userId: user.id },
//         });

//         const now = Date.now();

//         if (
//           existingFund &&
//           existingFund.updatedAt && // Sequelize gives Date object
//           existingFund.updatedAt.getTime() > now - THIRTY_MIN_MS
//         ) {
//           // ✅ Data is fresh, skip AngelOne API and use local DB
//           results.push({
//             userId: user.id,
//              firstName: user.firstName,
//             lastName:user.lastName,
//             username:user.username,
//             brokerName:user.brokerName,
//             status: "CACHED",
//             angelFund: existingFund.fund || 0,
//             pnl: existingFund.pnl || 0,
//             message: "Used local FundPNL (updated within last 30 minutes)",
//           });
//           continue; // go to next user
//         }

//         // 🔻 From here: data is missing or stale -> do full AngelOne flow

//         // 2.1️⃣ Get AngelOne credentials for this user
//         const existing = await Credential.findOne({
//           where: { userId: user.id },
//         });

//         if (!existing) {
//           results.push({
//             userId: user.id,
//             firstName: user.firstName,
//             lastName:user.lastName,
//              brokerName:user.brokerName,
//             username:user.username,
//             angelFund: 0,
//             status: "NO_CREDENTIALS",
//             message: "No credentials found for this user.",
//           });
//           continue;
//         }

//         const createdData = existing.dataValues;

//         // 2.2️⃣ Generate TOTP
//         const totpCode = await generateTOTP(createdData.totpSecret);

//         // 2.3️⃣ Login with password + TOTP
//         const loginBody = JSON.stringify({
//           clientcode: createdData.clientId,
//           password: createdData.password,
//           totp: totpCode,
//         });

//         const loginConfig = {
//           method: "post",
//           url: ANGEL_LOGIN_URL,
//           headers: {
//             "Content-Type": "application/json",
//             Accept: "application/json",
//             "X-UserType": "USER",
//             "X-SourceID": "WEB",
//             "X-ClientLocalIP": process.env.CLIENT_LOCAL_IP,
//             "X-ClientPublicIP": process.env.CLIENT_PUBLIC_IP,
//             "X-MACAddress": process.env.MAC_Address,
//             "X-PrivateKey": process.env.PRIVATE_KEY,
//           },
//           data: loginBody,
//         };

//         const loginRes = await axios(loginConfig);

//         if (!loginRes.data?.status) {
//           results.push({
//             userId: user.id,
//               firstName: user.firstName,
//             lastName:user.lastName,
//             username:user.username,
//              brokerName:user.brokerName,
//             angelFund: 0,
//             status: "LOGIN_ERROR",
//             message: loginRes.data?.message || "AngelOne login failed",
//           });
//           continue;
//         }

//         const loginData = loginRes.data.data;

//         const authToken = loginData.jwtToken; // adjust if field name differs
//         const feedToken = loginData.feedToken;
//         const refreshToken = loginData.refreshToken;

//         // 2.4️⃣ Upsert into FundPNL: store tokens
//         const [fundRow, created] = await FundPNL.findOrCreate({
//           where: { userId: user.id },
//           defaults: {
//             userId: user.id,
//             fund: 0,
//             pnl: 0,
//             authToken,
//             feedToken,
//             refreshToken,
//           },
//         });

//         if (!created) {
//           await fundRow.update({
//             authToken,
//             feedToken,
//             refreshToken,
//           });
//         }

//         // 2.5️⃣ Call RMS/Fund API with new authToken
//         const rmsConfig = {
//           method: "get",
//           url: "https://apiconnect.angelone.in/rest/secure/angelbroking/user/v1/getRMS",
//           headers: {
//             Authorization: `Bearer ${authToken}`,
//             "Content-Type": "application/json",
//             Accept: "application/json",
//             "X-UserType": "USER",
//             "X-SourceID": "WEB",
//             "X-ClientLocalIP": process.env.CLIENT_LOCAL_IP,
//             "X-ClientPublicIP": process.env.CLIENT_PUBLIC_IP,
//             "X-MACAddress": process.env.MAC_Address,
//             "X-PrivateKey": process.env.PRIVATE_KEY,
//           },
//         };

//         const rmsRes = await axios(rmsConfig);

//         if (rmsRes.data?.status !== true) {
//           results.push({
//             userId: user.id,
//              firstName: user.firstName,
//             lastName:user.lastName,
//             username:user.username,
//              brokerName:user.brokerName,
//             angelFund: 0,
//             status: "RMS_ERROR",
//             message: rmsRes.data?.message || "AngelOne RMS response not OK",
//           });
//           continue;
//         }

//         const rmsData = rmsRes.data.data;

//         const fundRaw = Number(rmsData?.net);
//         const fund = fundRaw;
//         const pnlRaw = 0; // if later you get realised/unrealised from API, plug here
//         const pnl = Number(pnlRaw || 0);

//         console.log(fund, "fund");

//         // 2.6️⃣ Update FundPNL with fresh fund/pnl
//         await fundRow.update({
//           fund,
//           pnl,
//         });

//         results.push({
//           userId: user.id,
//            firstName: user.firstName,
//             lastName:user.lastName,
//              brokerName:user.brokerName,
//             username:user.username,
//           status: "SUCCESS",
//           angelFund: fund,
//           pnl,
//         });
//       } catch (err) {
//         console.error(`AngelOne flow error for user ${user.id}:`, err.message);
//         results.push({
//           userId: user.id,
//           firstName: user.firstName,
//             lastName:user.lastName,
//              brokerName:user.brokerName,
//             username:user.username,
//           status: "ERROR",
//           message: err.message,
//         });
//       }

//       // Optional: small delay for API rate limits
//       // await new Promise((r) => setTimeout(r, 150));
//     }

//     return res.json({
//       status: true,
//       statusCode: 200,
//       message: "AngelOne funds refreshed",
//       data: results,
//     });
//   } catch (error) {
//     console.error("refreshAngelFundsForAllUsers error:", error);
//     return res.json({
//       status: false,
//       statusCode: 500,
//       message: "Unexpected error occurred",
//       error: error.message,
//     });
//   }
// };

export const refreshAngelFundsForAllUsers = async (req, res) => {
  try {
    
      const users = await User.findAll({ where: {
        role: ["user", "clone-user"],  // same as IN clause
      },
        raw:true
      });


    if (!users.length) {
      return res.json({
        status: true,
        statusCode: 200,
        message: "No users found",
        data: [],
      });
    }

    const results = [];
    const THIRTY_MIN = 30 * 60 * 1000;

    for (const user of users) {
      try {

        const existingFund = await FundPNL.findOne({
          where: { userId: user.id },
        });

        const now = Date.now();
        const isFresh =
          existingFund &&
          existingFund.updatedAt &&
          existingFund.updatedAt.getTime() > now - THIRTY_MIN;

        // 🔥 Use Cached Fund - Angel + Kite Common
        if (isFresh) {
          results.push({
            userId: user.id,
           username:user.username,
           firstName:user.firstName,
            username: user.username,
            brokerName: user.brokerName,
            status: "CACHED",
            angelFund: existingFund.fund || 0,
            pnl: existingFund.pnl || 0,
            message: "Using cached funds (updated < 30 mins)",
          });
          continue;
        }

        // ************************************************************
        // 🔥 START: BROKER BASED LOGIC
        // ************************************************************

       const broker = (user.brokerName || "").toLowerCase();

          if (broker === "angelone"&&user.role==='user') {
            const response = await handleAngelOneUser(user, existingFund);
             
            results.push(response,'angelone');
            continue;
          }

          if (broker === "kite"&&user.role==='user') {
            const response = await handleKiteUser(user, existingFund);

            results.push(response);
            continue;
          }

           if (user.role==='clone-user') {
           
              results.push({
                  userId: user.id,
                  username:user.username,
                  firstName:user.firstName,
                  lastName:user.lastName,
                  brokerName: user.brokerName,
                  angelFund: user.fund || 0,
                  status: "UNKNOWN_BROKER",
                  message: "Broker not supported",
                });
            continue;
          }
        



        // ❌ Unknown broker
        results.push({
          userId: user.id,
           username:user.username,
           firstName:user.firstName,
           lastName:user.lastName,
          brokerName: user.brokerName,
          status: "CACHED",
          message: "Using cached funds (updated < 30 mins)",
        });

      } catch (error) {

        results.push({
           userId: user.id,
           username:user.username,
           firstName:user.firstName,
           lastName:user.lastName,
           brokerName: user.brokerName,
          status: "ERROR",
          message: error.message,
        });
      }
    }

    return res.json({
      status: true,
      statusCode: 200,
      message: "Funds refreshed",
      data: results,
    });

  } catch (error) {
    return res.json({
      status: false,
      statusCode: 500,
      message: "Unexpected error occurred",
      error: error.message,
    });
  }
};






export const adminGetRecentOrder = async (req, res) => {
  try {

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);


    // 🔁 Since filltime is VARCHAR with ISO UTC string -> compare with ISO strings
    const toDateISO = todayStart.toISOString(); // e.g. "2025-12-03T18:30:00.000Z"
    const fromDateISO = todayEnd.toISOString();



    // 1️⃣ Today total orders
    const todayOrders = await Order.findAll({
      where: {
        filltime: {
          [Op.between]: [toDateISO, fromDateISO],
        },
      },
      order: [["filltime", "DESC"]],
      raw: true,
    });

    // 2️⃣ Last 5 recent orders
    const recentOrders = await Order.findAll(
     
      {
      where: { status: "COMPLETE" },   // ✅ Correct placement
      order: [["filltime", "DESC"]],
      limit: 5,
      raw: true,
    });

    // 3️⃣ Total open positions
    const totalOpenPositions = await Order.count({
      where: { orderstatuslocaldb: "OPEN" },
    });

    // 4️⃣ Total Sell trades
    const totalSellTrades = await Order.count({
      where: { transactiontype: "SELL" },
    });

    return res.json({
      status: true,
      message: "Orders fetched successfully",
      todayOrderCount: todayOrders.length,
      recentOrders: recentOrders,
      totalOpenPositions: totalOpenPositions,
      totalSellTrades: totalSellTrades,
    });

  } catch (error) {

    console.log(error);
    
    return res.json({
      status: false,
      statusCode: 500,
      message: "Unexpected error occurred",
      error: error.message,
    });
  }
};



// export const refreshAngelFundsForAllUsers = async (req, res) => {
//   try {
//     // 1️⃣ Get all AngelOne users (add where condition if needed)
//     const users = await User.findAll({
//       where: {
//         // brokerName: "Angelone",
//         // angelLoginUser: true,
//       },
//       // ❌ do NOT use raw:true – we might need instance methods later
//     });

//     if (!users.length) {
//       return res.json({
//         status: true,
//         statusCode: 200,
//         message: "No Angelone users found",
//         data: [],
//       });
//     }

//     const results = [];

//     // 2️⃣ Loop sequentially (safer for rate limits)
//     for (const user of users) {
//       try {
//         // 2.1️⃣ Get AngelOne credentials for this user
//         const existing = await Credential.findOne({
//           where: { userId: user.id },
//         });

//         if (!existing) {
//           results.push({
//             userId: user.id,
//             email: user.email,
//              angelFund: 0,
//             status: "NO_CREDENTIALS",
//             message: "No credentials found for this user.",
//           });
//           continue;
//         }

//         const createdData = existing.dataValues;

//         // 2.2️⃣ Generate TOTP
//         const totpCode = await generateTOTP(createdData.totpSecret);

    
//         // 2.3️⃣ Login with password + TOTP
//         const loginBody = JSON.stringify({
//           clientcode: createdData.clientId,
//           password: createdData.password,
//           totp: totpCode,
//         });

//         const loginConfig = {
//           method: "post",
//           url: ANGEL_LOGIN_URL,
//           headers: {
//             "Content-Type": "application/json",
//             Accept: "application/json",
//             "X-UserType": "USER",
//             "X-SourceID": "WEB",
//             "X-ClientLocalIP": process.env.CLIENT_LOCAL_IP,
//             "X-ClientPublicIP": process.env.CLIENT_PUBLIC_IP,
//             "X-MACAddress": process.env.MAC_Address,
//             "X-PrivateKey": process.env.PRIVATE_KEY,
//           },
//           data: loginBody,
//         };

//         const loginRes = await axios(loginConfig);

//         if (!loginRes.data?.status) {
//           results.push({
//             userId: user.id,
//             email: user.email,
//             status: "LOGIN_ERROR",
//              angelFund: 0,
//             message: loginRes.data?.message || "AngelOne login failed",
//           });
//           continue;
//         }

//         const loginData = loginRes.data.data;

//         const authToken = loginData.jwtToken;       // adjust field name if different
//         const feedToken = loginData.feedToken;
//         const refreshToken = loginData.refreshToken;

//         // 2.4️⃣ Upsert into FundPNL: store tokens
//         const [fundRow, created] = await FundPNL.findOrCreate({
//           where: { userId: user.id },
//           defaults: {
//             userId: user.id,
//             fund: 0,
//             pnl: 0,
//             authToken,
//             feedToken,
//             refreshToken,
//           },
//         });

//         if (!created) {
//           await fundRow.update({
//             authToken,
//             feedToken,
//             refreshToken,
//           });
//         }

//         // 2.5️⃣ Call RMS/Fund API with new authToken
        
//             var rmsConfig = {
//           method: 'get',
//           url: 'https://apiconnect.angelone.in/rest/secure/angelbroking/user/v1/getRMS',
//           headers : {
//             'Authorization': `Bearer ${authToken}`,
//             'Content-Type': 'application/json',
//             'Accept': 'application/json',
//             'X-UserType': 'USER',
//             'X-SourceID': 'WEB',
//              "X-ClientLocalIP": process.env.CLIENT_LOCAL_IP,
//             "X-ClientPublicIP": process.env.CLIENT_PUBLIC_IP,
//             "X-MACAddress": process.env.MAC_Address,
//             "X-PrivateKey": process.env.PRIVATE_KEY,
//           }
//         };


//         const rmsRes = await axios(rmsConfig);


//         if (rmsRes.data?.status !== true) {

//           results.push({
//             userId: user.id,
//             email: user.email,
//             status: "RMS_ERROR",
//             angelFund: 0,
//             message: rmsRes.data?.message || "AngelOne RMS response not OK",
//           });
//           continue;
//         }

//         const rmsData = rmsRes.data.data;

//         const fundRaw = Number(rmsData?.net) 
//         const fund = fundRaw

//         const pnlRaw = 0
//         const pnl = Number(pnlRaw || 0);

//         console.log(fund,'fund');
        

//         // 2.6️⃣ Update FundPNL with fresh fund/pnl
//         await fundRow.update({
//           fund,
//           pnl,
//         });

//         results.push({
//           userId: user.id,
//           email: user.email,
//           status: "SUCCESS",
//           angelFund: fund,
//           pnl,
//         });
//       } catch (err) {
//         console.error(`AngelOne flow error for user ${user.id}:`, err.message);
//         results.push({
//           userId: user.id,
//           email: user.email,
//           status: "ERROR",
//           message: err.message,
//         });
//       }

//       // Optional: small delay for API rate limits
//       // await new Promise((r) => setTimeout(r, 150));
//     }


//     return res.json({
//       status: true,
//       statusCode: 200,
//       message: "AngelOne funds refreshed",
//       data: results,
//     });
//   } catch (error) {
//     console.error("refreshAngelFundsForAllUsers error:", error);
//     return res.json({
//       status: false,
//       statusCode: 500,
//       message: "Unexpected error occurred",
//       error: error.message,
//     });
//   }
// };




// 🔹 Admin: refresh AngelOne funds for all AngelOne users
// export const refreshAngelFundsForAllUsers = async (req, res) => {
//   try {

//     // 1️⃣ Get all AngelOne users
//     const users = await User.findAll({
//       where: {
//         // brokerName: "Angelone",
//         // angelLoginUser: true, // optional but recommended
//       },
//       raw:true
//     });

//     if (!users.length) {
//       return res.json({
//         status: true,
//         statusCode: 200,
//         message: "No Angelone users found",
//         data: [],
//       });
//     }

//     const results = [];

//     // 2️⃣ Loop sequentially (safer for rate limits)
//     for (const user of users) {

//       if (!user.authToken) {
//         results.push({
        
//           ...user,
//           status: "PENDING",
//           message:  "User is Not Login",
//         });
//         continue;
//       }

//       try {


//         const config = {
//           method: "get",
//           url: ANGEL_RMS_URL,
//           headers: angelHeaders(user.authToken),
//         };

//         const rmsRes = await axios(config);

//         if (rmsRes.data?.status !== true) {
//           results.push({
//             ...user,
//             status: "ERROR",
//             message: rmsRes.data?.message || "AngelOne response not OK",
//           });
//           continue;
//         }

//         // ⚠️ Adjust this path based on your real AngelOne response
//         // Often it's something like `rmsRes.data.data.net`
//         const fundRaw = rmsRes.data.data?.net ?? rmsRes.data.data?.availablecash;
//         const fund = Number(fundRaw || 0);

//         // 3️⃣ Save in DB
//         // user.angelFund = fund;
//         // user.angelFundUpdatedAt = new Date();
//         // await user.save();

//         results.push({
//           ...user,
//           status: "SUCCESS",
//           message:"",
//           angelFund: fund,
//           updatedAt: user.angelFundUpdatedAt,
//         });
//       } catch (err) {
//         console.error(`AngelOne RMS error for user ${user.id}:`, err.message);
//         results.push({
//           ...user,
//           status: "ERROR",
//           message: err.message,
//         });
//       }

//       // Optional: tiny delay to be nice with rate limits
//       // await new Promise((r) => setTimeout(r, 150));
//     }

//     console.log(results);
    

//     return res.json({
//       status: true,
//       statusCode: 200,
//       message: "AngelOne funds refreshed",
//       data: results,
//     });
//   } catch (error) {

    
//     console.error("refreshAngelFundsForAllUsers error:", error);
//     return res.json({
//       status: false,
//       statusCode: 500,
//       message: "Unexpected error occurred",
//       error: error.message,
//     });
//   }
// };


export const adminGetCloneUserHolding = async (req, res) => {
  try {

   
       return res.json({
            status: true,
            statusCode:200,
            data:[] ,
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


// async function fetchAngelTradesForUser(user,status) {
//   try {
//     const config = {
//       method: "get",
//       url: "https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/getTradeBook",
//       headers: {
//         Authorization: `Bearer ${user.authToken}`,
//         "Content-Type": "application/json",
//         Accept: "application/json",
//         "X-UserType": "USER",
//         "X-SourceID": "WEB",
//         "X-ClientLocalIP": process.env.CLIENT_LOCAL_IP,
//         "X-ClientPublicIP": process.env.CLIENT_PUBLIC_IP,
//         "X-MACAddress": process.env.MAC_Address,
//         "X-PrivateKey": process.env.PRIVATE_KEY,
//       },
//     };

//     const response = await axios(config);

//     const trades = response.data?.data || [];

//     // 1) Collect all Angel orderids from tradebook
//     const orderIds = trades
//       .map(t => t.orderid)
//       .filter(id => !!id);

//     // 2) Check which ones are present in local `orders` table
//     const existingOrders = await Order.findAll({
//       where: {
//         userId: user.id,
//         orderid: orderIds, // Sequelize IN
//       },
//       attributes: ["orderid"],
//       raw: true,
//     });

//     const existingOrderIdSet = new Set(
//       existingOrders.map(o => String(o.orderid))
//     );

//     // 3) Normalize + add orderBy
//     return trades.map((t) => {
//       const oid = String(t.orderid || "");
//       const isInLocalDb = existingOrderIdSet.has(oid);

//       return {
//         userId: user.id,
//         username: user.username,
//         brokerName: "angelone",

//         // SAME FIELD NAMES AS KITE
//         order_id: t.orderid,
//         trade_id: t.fillid,

//         exchange: t.exchange,
//         tradingsymbol: t.tradingsymbol,
//         instrument_token: null, // Angel does not provide this

//         product: t.producttype,
//         average_price: Number(t.fillprice),
//         quantity: Number(t.fillsize),
//         transaction_type: t.transactiontype,

//         fill_timestamp: convertAngelTimeToISO(t.filltime),

//         // 🔥 NEW FIELD: mark trades that match local software orders
//         orderBy: isInLocalDb ? "software" : "broker",
//       };
//     });
//   } catch (err) {
//     console.error(
//       "Angel trade fetch error:",
//       err.response?.data || err.message
//     );
//     return [];
//   }
// }

// Helper for time conversion: "13:27:53" → today's ISO timestamp


async function fetchAngelTradesForUser(user, status) {
  try {
    // ---------- ORDER MODE: TRADEBOOK ----------
    if (status === "order") {
      const config = {
        method: "get",
        url: "https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/getTradeBook",
        headers: {
          Authorization: `Bearer ${user.authToken}`,
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-UserType": "USER",
          "X-SourceID": "WEB",
          "X-ClientLocalIP": process.env.CLIENT_LOCAL_IP,
          "X-ClientPublicIP": process.env.CLIENT_PUBLIC_IP,
          "X-MACAddress": process.env.MAC_Address,
          "X-PrivateKey": process.env.PRIVATE_KEY,
        },
      };

      const response = await axios(config);
      const trades = response.data?.data || [];

      // 1) Saare Angel orderids collect karo
      const orderIds = trades
        .map((t) => t.orderid)
        .filter((id) => !!id);

      // 2) Local DB me check karo kaunse orderid already present hai
      const existingOrders = await Order.findAll({
        where: {
          userId: user.id,
          orderid: orderIds, // Sequelize IN
        },
        attributes: ["orderid"],
        raw: true,
      });

      const existingOrderIdSet = new Set(
        existingOrders.map((o) => String(o.orderid))
      );

      // 3) Normalize + add orderBy
      return trades.map((t) => {
        const oid = String(t.orderid || "");
        const isInLocalDb = existingOrderIdSet.has(oid);

        return {
          userId: user.id,
          username: user.username,
          brokerName: "angelone",

          // SAME TRADE FIELDS STYLE AS KITE
          order_id: t.orderid,
          trade_id: t.fillid,

          exchange: t.exchange,
          tradingsymbol: t.tradingsymbol,
          instrument_token: null, // Angel doesn't send this

          product: t.producttype,
          average_price: Number(t.fillprice),
          quantity: Number(t.fillsize),
          transaction_type: t.transactiontype,

          fill_timestamp: convertAngelTimeToISO(t.filltime),

          // software vs broker
          orderBy: isInLocalDb ? "software" : "broker",
        };
      });
    }

    // ---------- HOLDING MODE ----------
    const holdingConfig = {
      method: "get",
      url: "https://apiconnect.angelone.in/rest/secure/angelbroking/portfolio/v1/getAllHolding",
      headers: {
        Authorization: `Bearer ${user.authToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-UserType": "USER",
        "X-SourceID": "WEB",
        "X-ClientLocalIP": process.env.CLIENT_LOCAL_IP,
        "X-ClientPublicIP": process.env.CLIENT_PUBLIC_IP,
        "X-MACAddress": process.env.MAC_Address,
        "X-PrivateKey": process.env.PRIVATE_KEY,
      },
    };

    const holdingResponse = await axios(holdingConfig);

    const holdings = holdingResponse.data?.data?.holdings || [];

    // holdings ko normalize karo
    return holdings.map((h) => ({
      userId: user.id,
      username: user.username,
      brokerName: "angelone",

      // trade specific fields (not applicable here)
      order_id: null,
      trade_id: null,
      transaction_type: null,
      fill_timestamp: null,

      // Holding-style fields (similar idea to what you’ll use for Kite holdings)
      exchange: h.exchange,
      tradingsymbol: h.tradingsymbol,
      instrument_token: h.symboltoken || null,

      product: h.product, // DELIVERY
      quantity: Number(h.quantity),
      average_price: Number(h.averageprice),
      ltp: Number(h.ltp),
      close: Number(h.close),
      profitandloss: Number(h.profitandloss),
      pnlpercentage: Number(h.pnlpercentage),

      // For holdings we mark as broker by default
      orderBy: "broker",

      type: "holding",
    }));
  } catch (err) {
    console.error(
      "Angel data fetch error:",
      err.response?.data || err.message
    );
    return [];
  }
}

function convertAngelTimeToISO(timeStr) {
  if (!timeStr) return null;

  // Create today's date with provided time
  const today = new Date();
  const [h, m, s] = timeStr.split(":");

  today.setHours(h);
  today.setMinutes(m);
  today.setSeconds(s);

  return today.toISOString();
}



async function fetchKiteTradesForUser(user,status) {
  try {
    
    const kite = await getKiteClientForUserId(user.id);

    let  trades

     if(status==='order') {
        
       trades  = await kite.getTrades();

     }else{

        trades  = await kite.getHoldings();
     }
  

    // 1) Saare order_id collect karo
    const orderIds = trades
      .map(t => t.order_id)
      .filter(id => !!id); // null/undefined hatao

    // 2) Local DB me check karo kaunse orderid already present hai
    const existingOrders = await Order.findAll({
      where: {
        userId: user.id,
        orderid: orderIds, // Sequelize IN clause
      },
      attributes: ["orderid"],
      raw: true,
    });

    // 3) Fast lookup ke liye Set banao
    const existingOrderIdSet = new Set(
      existingOrders.map(o => String(o.orderid))
    );

    // 4) Map & normalize trades + add orderBy
    return trades.map((t) => {
      const oid = String(t.order_id || "");

      const isInLocalDb = existingOrderIdSet.has(oid);

      return {
        userId: user.id,
        username: user.username,
        brokerName: "kite",

        // SAME FIELDS AS ANGEL
        order_id: t.order_id,
        trade_id: t.trade_id,

        exchange: t.exchange,
        tradingsymbol: t.tradingsymbol,
        instrument_token: t.instrument_token,

        product: t.product,
        average_price: t.average_price,
        quantity: t.quantity,
        transaction_type: t.transaction_type,

        fill_timestamp:
          t.exchange_timestamp ||
          t.fill_timestamp ||
          t.order_timestamp,

        // 👉 NEW FIELD
        orderBy: isInLocalDb ? "software" : "broker", // ya "kite" / "api" etc. else

        // raw: t  // agar chahiye to uncomment
      };
    });
  } catch (err) {
    console.error("Kite trade fetch error:", err.message);
    return [];
  }
}


export const adminFetchOrder = async function (req,res,next) {

  let users = await User.findAll({
      where: {
        angelLoginUser: true,   // ✅ filter here
        role:"user"
      },
      raw: true
    });

     const allTradePromises = users.map(async (user) => {
      try {
        if (user.brokerName === "kite") {
          return await fetchKiteTradesForUser(user,'order');
        }

        if (user.brokerName === "angelone") {
          return await fetchAngelTradesForUser(user,'order');
        }

        if (user.brokerName === "fyers") {
          return await fetchFyersTradesForUser(user,'order');
        }

        // unknown broker – skip
        console.warn("Unknown broker for user", user.id, user.brokerName);
        return [];
      } catch (err) {
        console.error(`Error fetching trades for user ${user.id}`, err.message);
        return [];
      }
    });

    let allTradesNested = await Promise.all(allTradePromises);
    let allTrades = allTradesNested.flat();

    // sort by time (latest first)
    allTrades = allTrades.sort((a, b) => {
      const ta = new Date(a.time || 0).getTime();
      const tb = new Date(b.time || 0).getTime();
      return tb - ta;
    });

    return res.status(200).json({
      status: true,
      message: "Trades fetched successfully",
      userCount: users.length,
      tradeCount: allTrades.length,
      data: allTrades,
    });
  
  

  


  
}


export const adminFetchOrderHolding = async function (req,res,next) {

  let users = await User.findAll({
      where: {
        angelLoginUser: true,   // ✅ filter here
        role:"user"
      },
      raw: true
    });

     const allTradePromises = users.map(async (user) => {
      try {
        if (user.brokerName === "kite") {
          return await fetchKiteTradesForUser(user,'holding');
        }

        if (user.brokerName === "angelone") {
          return await fetchAngelTradesForUser(user,'holding');
        }

        if (user.brokerName === "fyers") {
          return await fetchFyersTradesForUser(user,'holding');
        }

        // unknown broker – skip
        console.warn("Unknown broker for user", user.id, user.brokerName);
        return [];
      } catch (err) {
        console.error(`Error fetching trades for user ${user.id}`, err.message);
        return [];
      }
    });

    let allTradesNested = await Promise.all(allTradePromises);
    let allTrades = allTradesNested.flat();

    // sort by time (latest first)
    allTrades = allTrades.sort((a, b) => {
      const ta = new Date(a.time || 0).getTime();
      const tb = new Date(b.time || 0).getTime();
      return tb - ta;
    });

    return res.status(200).json({
      status: true,
      message: "Trades fetched successfully",
      userCount: users.length,
      tradeCount: allTrades.length,
      data: allTrades,
    });
  
}



export const AdminGetHoldingMultiple = async (req, res) => {
  try {
    
    // 2️⃣ Compute start of TODAY in IST, convert to UTC ISO for string comparison
    const nowUtc = new Date();
    const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // +05:30

    // Convert current UTC -> IST
    const istNow = new Date(nowUtc.getTime() + IST_OFFSET_MS);
    istNow.setHours(0, 0, 0, 0); // start of day in IST (00:00:00)

    // Convert IST start-of-day back to UTC
    const startOfTodayUtc = new Date(istNow.getTime() - IST_OFFSET_MS);
    const startOfTodayIso = startOfTodayUtc.toISOString(); // e.g. "2025-12-10T00:00:00.000Z"

    // 3️⃣ Get local COMPLETE orders older than today using filltime (stored as ISO string)
    const localOldOrders = await Order.findAll({
      where: {
        orderstatuslocaldb: "OPEN",
        filltime: {
          [Op.lt]: startOfTodayIso,  // only yesterday & older
        },
      },
    });

    return res.json({
      status: true,
      statusCode: 200,
      data: localOldOrders, // ✅ only yesterday+old positions
      message:
        "Successfully fetched holdings matching local COMPLETE orders (excluding today's filltime)",
    });
  } catch (error) {
    console.error("❌ getKiteHolding error:", error);
    return res.json({
      status: false,
      statusCode: 500,
      message: "Unexpected error occurred. Please try again.",
      data: null,
      error: error.message,
    });
  }
};




 





















