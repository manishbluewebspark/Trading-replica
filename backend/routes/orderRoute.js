import express from 'express';
import { getAllInstruments, getInstrumentPostgre, getKiteAllInstruments, getKiteAllOrders, getKiteFunds, getKiteProfile, getKiteTradesData, getPerticularInstruments, getTradeDataForKiteDeshboard, searchInstrumentPostgre } from '../controllers/instrumentController.js';
import { getOrder ,placeOrder,getLTP, cancelOrder, ModifyOrder, getOrderWithDate, getOrderPerticular, getOrderInTables, getTradeWithDate, adminGetTradeInTables, userGetTradeInTables, searchOrders} from '../controllers/placeOrderController.js';
import {authMiddleware,AdminAuthMiddleware} from '../middleware/authMiddleware.js';
import { createAngelOneCredential, getAngelOneCredential } from '../controllers/angelOneCrendential.js';
import { getPerticularTradeBook, getTradeBook, getTradeBookInTable, getTradeBookWithDateFilter } from '../controllers/tradeController.js';
import { getHoldingDataInAngelOne, getPosition, getProfitAndLoss } from '../controllers/holdingDataController.js';
import { dummyOrderData, dummyTradeData, getOrderDataForDeshboard, getTradeDataForDeshboard } from '../controllers/testController.js';
import { getLTPInstrument } from '../controllers/instrumentPriceController.js';
import { getCloneUserHolding } from '../controllers/admin/cloneUserController.js';


const router = express.Router();


//  order 
router.get('/search',authMiddleware,searchOrders);  
router.get('/get/order',authMiddleware,getOrder);   
router.post('/place/order',AdminAuthMiddleware,placeOrder)
router.get('/update/oneorder',getOrderPerticular); 
router.post('/cancel/order',AdminAuthMiddleware,cancelOrder)

router.post('/datefilter/trade',getTradeWithDate)
router.post('/get/order',authMiddleware,getOrder); 
router.get('/get/oneorder',getOrderPerticular); 
router.put('/modify/order',AdminAuthMiddleware,ModifyOrder)
router.get('/get/table/order',authMiddleware,getOrderInTables); 


// get current price
router.post('/get/ltp',authMiddleware,getLTP)

// router.post('/get/ltp',authMiddleware,getLTPInstrument)

//  get traded book data
router.get('/get/trade/book',authMiddleware,getTradeBook)
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
router.get('/get/holdingdata',

    authMiddleware, (req, res,next) => { 

    if (req.role === "clone-user") {  

    return getCloneUserHolding(req, res,next);

    } else if(req.role === "user"&&req.borker==='angelone') {

      return getHoldingDataInAngelOne(req, res,next);
      
    }else{
        return getCloneUserHolding(req, res,next);
    }
  },
)

router.get('/get/position',authMiddleware,getPosition)
router.get('/get/profitandloss',authMiddleware,getProfitAndLoss)


router.get('/dummydataorder',authMiddleware,getOrderDataForDeshboard)
router.get('/dummydatatrade',authMiddleware,getTradeDataForDeshboard)


router.get('/mongodb/instrument',authMiddleware,getInstrumentPostgre)

router.get('/mongodb/instrument/search/:id',authMiddleware,searchInstrumentPostgre)


// new routes 
router.get('/get/tabletradebook',authMiddleware,userGetTradeInTables)
router.post('/datefilter/order',authMiddleware,getOrderWithDate)


router.get('/kite/instrument',getKiteAllInstruments)
router.get('/kite/orders',getKiteAllOrders)
router.get('/kite/fund',getKiteFunds)
router.get('/kite/profile',getKiteProfile)
router.get('/kite/profile2',getKiteProfile)

router.get('/kite/deshbaord/todaytrade',authMiddleware,getTradeDataForKiteDeshboard)

router.get('/kite/trade',getKiteTradesData)



export default router;