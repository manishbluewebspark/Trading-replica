import express from 'express';
import { adminGetRecentOrder, AdminGetTotalUsers, AdminLoginMultipleUser, adminPlaceMultipleOrder, adminSequareOff, refreshAngelFundsForAllUsers } from '../../controllers/admin/adminOrderController.js';
import { getTokens, storeTokens } from '../../controllers/testController.js';
import {AdminAuthMiddleware, authMiddleware} from '../../middleware/authMiddleware.js';
import { adminGetUserAngelToken } from '../../controllers/userController.js';
import { adminGetOrderInTables, adminGetOrderWithDate, adminGetTradeInTables, adminSearchOrders, getOrderWithDate } from '../../controllers/placeOrderController.js';
import { adminloginWithTOTPInAngelOne, fetchGooglFromSerpApi } from '../../controllers/authController.js';
import { createStrategy, deleteStrategy, getAllStrategies, getStrategyById, updateStrategy } from '../../controllers/userStrategy.js';
import { createBroker, deleteBroker, getAllBrokers, getBrokerById, updateBroker } from '../../controllers/admin/brokerControler.js';
import { createCloneUser, deleteCloneUser, getCloneAllUsers, getCloneUserFund, getCloneUserTrade, loginCloneUserDemat, updateCloneUser, uploadOrderExcel } from '../../controllers/admin/cloneUserController.js';
import { upload } from '../../middleware/upload.js';
import { adminPlaceMultiBrokerOrder, getTokenStatusSummary } from '../../controllers/admin/adminMultipleBrokerController.js';
import { createManualOrder } from '../../controllers/admin/orderManualController.js';



const router = express.Router();



router.get('/tokenstatussummary',getTokenStatusSummary)

router.post('/multiple/place/order',adminPlaceMultiBrokerOrder)
router.get('/sequareoff',adminSequareOff)
router.get('/login/users',AdminLoginMultipleUser)
router.get('/store/session',storeTokens)
router.get('/get/session',getTokens)
router.get('/get/totalusers',AdminGetTotalUsers)
router.get('/getuser/profile',AdminAuthMiddleware,adminGetUserAngelToken );
router.get('/get/table/order',authMiddleware,adminGetOrderInTables);
router.get('/login/totp/angelone',AdminAuthMiddleware, adminloginWithTOTPInAngelOne);   // our code 



router.post('/datefilter/order',authMiddleware,adminGetOrderWithDate);
router.post('/search/order',authMiddleware,adminSearchOrders);
router.get('/get/table/trade',authMiddleware,adminGetTradeInTables); // check
// 
router.get("/angel/funds/refresh",authMiddleware,refreshAngelFundsForAllUsers);


// strategies routes 
router.get("/strategies", getAllStrategies);          // findAll
router.get("/strategies/:id", getStrategyById);       // findOne
router.post("/strategies", createStrategy);           // create
router.put("/strategies", updateStrategy);        // update
router.delete("/strategies/:id", deleteStrategy);     // deleteOne

// brokers routes
router.get("/broker", getAllBrokers);
router.get("/broker/:id", getBrokerById);
router.post("/broker", createBroker);
router.put("/broker", updateBroker);
router.delete("/broker/:id", deleteBroker);


// clone user admin routes 
router.get("/clone-users", getCloneAllUsers);
router.post("/clone-users", createCloneUser);
router.delete("/clone-users/:id", deleteCloneUser);
router.put("/clone-users/:id", updateCloneUser);
router.post(
  "/clone-users/upload-excel",
  AdminAuthMiddleware,
  upload.single("file"),
  uploadOrderExcel
);
router.post("/manual/create", createManualOrder);


//  clone user routes
router.post('/search/order',adminSearchOrders);

router.get("/getuserclone/fund",authMiddleware,getCloneUserFund);
router.get("/getuserclonetrade", authMiddleware,getCloneUserTrade);
router.get("/getuserclonedematlogin", loginCloneUserDemat);




router.get("/chartadmin", fetchGooglFromSerpApi);
router.get("/get/recent/order", adminGetRecentOrder);




export default router;