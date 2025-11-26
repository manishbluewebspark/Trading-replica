import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { getKiteAllInstruments,getKiteFunds, kiteCallback, kiteLogin,getTradeDataForKiteDeshboard,
    getKiteAllOrders,getKiteProfile,getKiteProfile2,getKiteTradesData
 } from '../controllers/kiteController.js';




const router = express.Router();



router.get('/kite',kiteLogin); // Get login URL
router.get('/kite/callback', kiteCallback); // Handle callback (no auth needed)


// no token required 
router.get('/kite/instrument',getKiteAllInstruments)


// token required 
router.get('/kite/fund',authMiddleware,getKiteFunds)
router.get('/kite/deshbaord/todaytrade',authMiddleware,getTradeDataForKiteDeshboard)
router.get('/kite/orders',getKiteAllOrders)
router.get('/kite/profile',getKiteProfile)
router.get('/kite/profile2',getKiteProfile2)
router.get('/kite/trade',getKiteTradesData)


export default router;