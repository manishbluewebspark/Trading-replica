import express from 'express';

import { callbackFyers, fyersFunds, fyersLogin, fyersProfile, getTradeDataForFyersDashboard, updateFyersToken } from '../controllers/fyersController.js';



const router = express.Router();

router.get('/fyers/login', fyersLogin);
router.get('/fyers/callback', callbackFyers);
router.post('/fyers/updatefyerstoken', updateFyersToken);

router.get('/fyers/profile', fyersProfile);
router.get('/fyers/fund', fyersFunds);
router.get('/fyers/deshbaord/todaytrade', getTradeDataForFyersDashboard);

export default router;