import express from 'express';
import { generateUpstoxAuthUrl, getTradeDataForUpstoxDashboard, getUpstoxFunds, upStoxCallback } from '../controllers/upStockController.js';




const router = express.Router();

router.get('/upstox/login', generateUpstoxAuthUrl);
router.get('/upstox/callback', upStoxCallback);
router.get('/upstox/user/fund', getUpstoxFunds);
router.get('/upstox/dummydatatrade', getTradeDataForUpstoxDashboard);





export default router;