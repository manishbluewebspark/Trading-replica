import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { getKiteAllInstruments,getKiteFunds, kiteCallback, kiteLogin,getTradeDataForKiteDeshboard,
    getKiteAllOrders,getKiteProfile,getKiteProfile2,getKiteTradesData,
    kiteAppCredential,
    getKiteTrades,
    getKiteOrders,
    getKiteHolding
 } from '../controllers/kiteController.js';
import { placeKiteOrderTest, testLocalSell } from '../services/placeKiteOrder.js';




const router = express.Router();



router.get('/kite',authMiddleware,kiteLogin); // Get login URL
router.get('/kite/callback', kiteCallback); // Handle callback (no auth needed)





router.post('/kite/appcredential/create',authMiddleware, kiteAppCredential);

// no token required 
router.get('/kite/instrument',authMiddleware,getKiteAllInstruments)


// token required 
router.get('/kite/fund',authMiddleware,getKiteFunds)
router.get('/kite/deshbaord/todaytrade',authMiddleware,getTradeDataForKiteDeshboard)
router.get('/kite/orders',authMiddleware,getKiteAllOrders)
router.get('/kite/profile',authMiddleware,getKiteProfile)
router.get('/kite/profile2',authMiddleware,getKiteProfile2)
router.get('/kite/trade',authMiddleware,getKiteTradesData)

router.get('/kite/get/holdingdata',authMiddleware,getKiteHolding)





router.get('/kite/online/data',getKiteTrades)

router.get('/kite/online/data2',getKiteOrders)

router.get('/kite/test/orderupdate',placeKiteOrderTest)




router.get('/localtestsellkite',testLocalSell)





export default router;