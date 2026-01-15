import express from 'express';

import { callbackFyers, fyersFunds, fyersLogin, fyersProfile, getFyersInstruments, getTradeDataForFyersDashboard, updateFyersToken } from '../controllers/fyersController.js';
import { getDeshboardOrdersUpdate, getTradeDataForCommonDeshboardUpdate } from '../controllers/angelController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';



const router = express.Router();

router.get('/fyers/login', fyersLogin);
router.get('/fyers/callback', callbackFyers);
router.post('/fyers/updatefyerstoken', updateFyersToken);

router.get('/fyers/profile', fyersProfile);


// deshbaord
router.get('/kite/deshbaord/todayorderdata',authMiddleware,getDeshboardOrdersUpdate)
router.get('/fyers/deshbaord/todaytrade',authMiddleware, getTradeDataForCommonDeshboardUpdate);
router.get('/fyers/fund',authMiddleware, fyersFunds);


router.get('/fyers/instrument', getFyersInstruments);


export default router;