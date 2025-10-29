import express from 'express';
import { getAllInstruments, getPerticularInstruments } from '../controllers/instrumentController.js';
import { getOrder ,placeOrder,getLTP, cancelOrder, getTradeBook, ModifyOrder} from '../controllers/placeOrderController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import { createAngelOneCredential, getAngelOneCredential } from '../controllers/angelOneCrendential.js';



const router = express.Router();

router.get('/get/instrument',authMiddleware,getAllInstruments)

router.get('/get/instrument/one',authMiddleware,getPerticularInstruments)

router.get('/get/order',authMiddleware,getOrder);    // not run getting invalid response

router.post('/place/order',authMiddleware,placeOrder)

router.post('/cancel/order',authMiddleware,cancelOrder)

router.post('/modify/order',authMiddleware,ModifyOrder)

router.post('/get/ltp',authMiddleware,getLTP)

router.get('/get/trade/book',authMiddleware,getTradeBook)



//  AngelOne Credential 
router.post('/create/angelone',authMiddleware,createAngelOneCredential)
router.get('/get/angelone',authMiddleware,getAngelOneCredential)






export default router;