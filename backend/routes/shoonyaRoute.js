import express from 'express';
import { getShoonyaFunds, getShoonyaOrders, getShoonyaTrades, shoonyaLogin } from '../controllers/shoonyaController.js';



const router = express.Router();

router.post('/finvasia/login', shoonyaLogin);

router.post('/finvasia/fund', getShoonyaFunds);

router.post('/finvasia/orders', getShoonyaOrders);

router.post('/finvasia/trades', getShoonyaTrades);







export default router;