import express from 'express';
import { getAllInstruments, getInstrumentPostgre, getPerticularInstruments, searchInstrumentPostgre } from '../controllers/instrumentController.js';
import { getOrder ,placeOrder,getLTP, cancelOrder, ModifyOrder, getOrderWithDate, getOrderPerticular, getOrderInTables} from '../controllers/placeOrderController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import { createAngelOneCredential, getAngelOneCredential } from '../controllers/angelOneCrendential.js';
import { getPerticularTradeBook, getTradeBook, getTradeBookInTable, getTradeBookWithDateFilter } from '../controllers/tradeController.js';
import { getHoldingDataInAngelOne, getPosition, getProfitAndLoss } from '../controllers/holdingDataController.js';
import { dummyOrderData, dummyTradeData, getOrderDataForDeshboard, getTradeDataForDeshboard } from '../controllers/testController.js';
import { getLTPInstrument } from '../controllers/instrumentPriceController.js';


const router = express.Router();





//  order 
router.get('/get/order',authMiddleware,getOrder);   
router.post('/place/order',authMiddleware,placeOrder)
router.get('/update/oneorder',getOrderPerticular); 
router.post('/cancel/order',authMiddleware,cancelOrder)
router.post('/datefilter/order',getOrderWithDate)
router.post('/get/order',authMiddleware,getOrder); 
router.get('/get/oneorder',getOrderPerticular); 
router.put('/modify/order',authMiddleware,ModifyOrder)
router.get('/get/table/order',authMiddleware,getOrderInTables); 




// get current price
router.post('/get/ltp',authMiddleware,getLTP)

// router.post('/get/ltp',authMiddleware,getLTPInstrument)




//  get traded book data
router.get('/get/trade/book',getTradeBook)
router.get('/get/table/tradebook',authMiddleware,getTradeBookInTable)
router.get('/perticular/trade/book',authMiddleware,getPerticularTradeBook)
router.post('/gettradedatawithfilter/book',authMiddleware,getTradeBookWithDateFilter)

// get instrument data 
router.get('/get/instrument',authMiddleware,getAllInstruments)
router.post('/get/instrument/one',authMiddleware,getPerticularInstruments)


//  AngelOne Credential 
router.post('/create/angelone',authMiddleware,createAngelOneCredential)
router.get('/get/angelone',authMiddleware,getAngelOneCredential)

// Holding Data in AngelOne
router.get('/get/holdingdata',getHoldingDataInAngelOne)
router.get('/get/position',getPosition)
router.get('/get/profitandloss',getProfitAndLoss)


router.get('/dummydataorder',authMiddleware,getOrderDataForDeshboard)
router.get('/dummydatatrade',authMiddleware,getTradeDataForDeshboard)

//  deshboard APIs 
// router.get('/deshboardorderdata',dummyOrderData)
// router.get('/dummydatatrade',dummyTradeData)





//  mongodb 
// router.get('/mongodb/instrument',getAllInstrumentMongodb)

router.get('/mongodb/instrument',getInstrumentPostgre)

router.get('/mongodb/instrument/search/:id',searchInstrumentPostgre)




export default router;