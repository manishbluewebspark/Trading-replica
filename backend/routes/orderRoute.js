import express from 'express';
import { getAllInstruments, getPerticularInstruments } from '../controllers/instrumentController.js';
import { getOrder ,placeOrder,getLTP, cancelOrder, ModifyOrder} from '../controllers/placeOrderController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import { createAngelOneCredential, getAngelOneCredential } from '../controllers/angelOneCrendential.js';
import { getPerticularTradeBook, getTradeBook } from '../controllers/tradeController.js';


const router = express.Router();


//  order 
router.get('/get/order',authMiddleware,getOrder);    // not run getting invalid response
router.post('/place/order',authMiddleware,placeOrder)
router.post('/cancel/order',authMiddleware,cancelOrder)
router.post('/modify/order',authMiddleware,ModifyOrder)

// get current price
router.post('/get/ltp',authMiddleware,getLTP)


//  get traded book data
router.get('/get/trade/book',authMiddleware,getTradeBook)
router.get('/perticular/trade/book',authMiddleware,getPerticularTradeBook)


// get instrument data 
router.get('/get/instrument',authMiddleware,getAllInstruments)
router.post('/get/instrument/one',authMiddleware,getPerticularInstruments)


//  AngelOne Credential 
router.post('/create/angelone',authMiddleware,createAngelOneCredential)
router.get('/get/angelone',authMiddleware,getAngelOneCredential)






export default router;