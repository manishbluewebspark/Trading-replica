import express from 'express';
import {  adminFetchOrderHolding, adminGetCloneUserHolding, AdminGetHoldingMultiple, adminGetRecentOrder, AdminGetTotalUsers, AdminLoginMultipleUser, adminPlaceMultipleOrder, adminSequareOff, refreshAngelFundsForAllUsers } from '../../controllers/admin/adminOrderController.js';
import { getTokens, storeTokens } from '../../controllers/testController.js';
import {AdminAuthMiddleware, authMiddleware} from '../../middleware/authMiddleware.js';
import { adminGetUserAngelToken } from '../../controllers/userController.js';
import { adminGetOrderInTables, adminGetOrderWithDate, adminGetTradeInTables, adminGetTradesByStrategyUniqueId, adminSearchOrders, getOrderWithDate } from '../../controllers/placeOrderController.js';
import { adminloginWithTOTPInAngelOne, fetchGooglFromSerpApi } from '../../controllers/authController.js';
import { createStrategy, deleteStrategy, getAllStrategies, getStrategyById, updateStrategy } from '../../controllers/userStrategy.js';
import { createBroker, deleteBroker, getAllBrokers, getBrokerById, updateBroker } from '../../controllers/admin/brokerControler.js';
import { createCloneUser, deleteCloneUser, getCloneAllUsers, getCloneUserFund, getCloneUserTrade, loginCloneUserDemat, updateCloneUser, uploadOrderExcel } from '../../controllers/admin/cloneUserController.js';
import { upload } from '../../middleware/upload.js';
import {   adminGroupSquareOff, adminMultipleSquareOff, adminPlaceMultiBrokerOrder, adminPlaceMultiTargetStoplossOrder, adminSingleSquareOff, getTokenStatusSummary } from '../../controllers/admin/adminMultipleBrokerController.js';
import { createManualOrder, createManualOrderWithBrokerPrice } from '../../controllers/admin/orderManualController.js';
import {  adminFetchSellOrdersAndUpdateManual, getUsersPnlData } from '../../controllers/admin/adminFetchOrder.js';
import { getDeshboardOrdersUpdate } from '../../controllers/angelController.js';
import { clearMergedInstrumentsCache, getMergedInstrumentsCacheTTL } from '../../controllers/instrumentMultipleDematController.js';
import { testingInstrument } from '../../controllers/admin/testingController.js';
import { syncHoldingsAllBrokers } from '../../services/baseBrokerHoldings.js';

import { angelTradeWebhookController, kiteTradeWebhookController } from '../../controllers/admin/webhook/adminWHController.js';
import { GetOrderStatusPerticularSymbol } from '../../controllers/admin/refreshController.js';



const router = express.Router();



router.get('/tokenstatussummary',AdminAuthMiddleware,getTokenStatusSummary)


//  update fetch function start 


router.get('/fetchorderdetails',GetOrderStatusPerticularSymbol)

//  update fetch function end 

router.post('/multiple/place/order',AdminAuthMiddleware,adminPlaceMultiBrokerOrder)
router.get('/sequareoff',AdminAuthMiddleware,adminMultipleSquareOff)
router.post('/group/squareoff',AdminAuthMiddleware,adminGroupSquareOff)
router.post("/single/squareoff", AdminAuthMiddleware, adminSingleSquareOff);
router.post("/multiple/targetstoploss/order", AdminAuthMiddleware, adminPlaceMultiTargetStoplossOrder);
router.post("/targetstoplosscheck", AdminAuthMiddleware, adminGroupSquareOff);




// router.get('/fetchorderdetails',adminFetchBuyOrdersAndUpdateManual)
router.get('/fetchsellorderdetails',adminFetchSellOrdersAndUpdateManual)

router.post("/getusers/pnldata", getUsersPnlData);






router.get('/get/totalusers',AdminAuthMiddleware,AdminGetTotalUsers)
router.get('/getuser/profile',AdminAuthMiddleware,adminGetUserAngelToken );


// router.get('/get/table/order',AdminAuthMiddleware,adminGetOrderInTables);

router.get('/get/table/order',AdminAuthMiddleware,adminGetOrderInTables);

router.get('/login/totp/angelone',AdminAuthMiddleware, adminloginWithTOTPInAngelOne);   // our code 



router.post('/datefilter/order',AdminAuthMiddleware,adminGetOrderWithDate);
router.post('/search/order',adminSearchOrders);


router.get('/get/table/trade',AdminAuthMiddleware,adminGetTradeInTables); // check
router.get("/trades/strategy/:strategyUniqueId", adminGetTradesByStrategyUniqueId);

// 
router.get("/angel/funds/refresh",AdminAuthMiddleware,refreshAngelFundsForAllUsers);


// strategies routes 
router.get("/strategies",AdminAuthMiddleware, getAllStrategies);          // findAll
router.get("/strategies/:id",AdminAuthMiddleware, getStrategyById);       // findOne
router.post("/strategies",AdminAuthMiddleware, createStrategy);           // create
router.put("/strategies",AdminAuthMiddleware, updateStrategy);        // update
router.delete("/strategies/:id",AdminAuthMiddleware, deleteStrategy);     // deleteOne

// brokers routes
router.get("/broker",authMiddleware, getAllBrokers);
router.get("/broker/:id",AdminAuthMiddleware, getBrokerById);
router.post("/broker", AdminAuthMiddleware,createBroker);
router.put("/broker",AdminAuthMiddleware, updateBroker);
router.delete("/broker/:id", AdminAuthMiddleware,deleteBroker);



// clone user admin routes 
router.get("/clone-users",AdminAuthMiddleware, getCloneAllUsers);
router.post("/clone-users", AdminAuthMiddleware,createCloneUser);
router.delete("/clone-users/:id",AdminAuthMiddleware, deleteCloneUser);
router.put("/clone-users/:id",AdminAuthMiddleware, updateCloneUser);
router.post(
  "/clone-users/upload-excel",
  AdminAuthMiddleware,
  upload.single("file"),
  uploadOrderExcel
);


router.post("/manual/create",
  AdminAuthMiddleware, 
  async (req, res, next) => {
    try {
      const { buyPrice, sellPrice, buyTime, sellTime } = req.body;

      // helper to check "empty"
      const isEmpty = (v) =>
        v === undefined || v === null || v === "";

      const allFourEmpty =
        isEmpty(buyPrice) &&
        isEmpty(sellPrice) &&
        isEmpty(buyTime) &&
        isEmpty(sellTime);

      if (allFourEmpty) {
        // ✅ All 4 empty → use broker price controller
        return createManualOrderWithBrokerPrice(req, res, next);
      } else {
        // ✅ At least one present → use normal manual order controller
        return createManualOrder(req, res, next);
      }
    } catch (err) {
      return res.json({
      status: false,
      statusCode:500,
      message: err.message || "Internal Server Error",
    });
    }
  }
);


//  clone user routes and not change authMiddleware
router.get('/getuserclonetrade/todayorderdata',authMiddleware,getDeshboardOrdersUpdate)
router.get("/getuserclone/fund",authMiddleware,getCloneUserFund);
router.get("/getuserclonetrade", authMiddleware,getCloneUserTrade);


router.get("/getuserclonedematlogin",AdminAuthMiddleware, loginCloneUserDemat);


router.get("/chartadmin",AdminAuthMiddleware, fetchGooglFromSerpApi);
router.get("/get/recent/order",AdminAuthMiddleware, adminGetRecentOrder);


// Holding Data in AngelOne
router.get('/get/holdingdata',AdminAuthMiddleware, adminGetCloneUserHolding)
router.get('/getall/holdingdata',AdminAuthMiddleware,syncHoldingsAllBrokers, AdminGetHoldingMultiple)


router.get('/fetch/borker/order',AdminAuthMiddleware,adminFetchOrderHolding)



router.get('/login/users',AdminLoginMultipleUser)
router.get('/store/session',storeTokens)
router.get('/get/session',getTokens)
router.post('/search/order',adminSearchOrders);



// 🔍 Check cache remaining time
// /admin/cache/merged/ttl?type=new
// /admin/cache/merged/ttl?type=angelone
router.get("/cache/merged/ttl", getMergedInstrumentsCacheTTL);

// 🧹 Clear cache
// /admin/cache/merged/clear?type=new
// /admin/cache/merged/clear?type=angelone
router.get("/cache/merged/clear", clearMergedInstrumentsCache);




router.post('/testing/app',testingInstrument)





//=================== webhook for all borker==================

// POST /api/webhook/kite/trade
router.post("/webhook/kite/trade", kiteTradeWebhookController);

// POST /api/webhook/angel/trade
router.post("/webhook/angelone/trade", angelTradeWebhookController);



export default router;