import express from 'express';
import {  finvasiaAppCredential, getShoonyaFunds, getShoonyaOrders, getShoonyaTrades, shoonyaLogin, shoonyaLoginWithTotp } from '../controllers/shoonyaController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';



const router = express.Router();

router.post('/finvasia/login', authMiddleware,shoonyaLogin);
router.post('/finavasia/appcredential/create', authMiddleware,finvasiaAppCredential);





router.get('/finavasia/logintotp',authMiddleware,shoonyaLoginWithTotp );


router.get('/finvasia/fund',authMiddleware, getShoonyaFunds);




router.get('/finvasia/orders', getShoonyaOrders);
router.get('/finvasia/trades', getShoonyaTrades);


router.post('/finvasia/orders', getShoonyaOrders);
router.post('/finvasia/trades', getShoonyaTrades);







export default router;