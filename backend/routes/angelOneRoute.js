import express from 'express';
import {  authMiddleware } from '../middleware/authMiddleware.js';
import { angelOneCallback, cancelOrder, getAngelOneLTP, getAngelOneOrder, getAngelOneProfileFund, getCloneUserHolding, getHoldingDataInAngelOne, getPerticularTradeBook, getPosition,
   getTradeBook,
   getTradeDataForDeshboard, loginWithAngelOne, loginWithTOTPInAngelOne, logoutAngelOne,
    reGenerateTokenWithAngelOne } from '../controllers/angelController.js';
import { createAngelOneCredential, getAngelOneCredential } from '../controllers/angelOneCrendential.js';
import {  getInstrumentPostgre, searchInstrumentPostgre } from '../controllers/instrumentController.js';




const router = express.Router();


router.get('/angelone/login/totp',authMiddleware,loginWithTOTPInAngelOne );   // our code 
router.get('/angelone/user/fund',authMiddleware, getAngelOneProfileFund); 
router.get('/angelone/dummydatatrade',authMiddleware,getTradeDataForDeshboard)

// Holding Data in AngelOne
router.get('/angelone/get/holdingdata',

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

router.post('/agnelone/instrument/ltp',authMiddleware,getAngelOneLTP)

router.get('/agnelone/instrument',getInstrumentPostgre)
router.get('/agnelone/instrument/search/:id',authMiddleware,searchInstrumentPostgre)



//  AngelOne Credential 
router.post('/angelone/credential/create',authMiddleware,createAngelOneCredential)
router.get('/angelone/credential/get',authMiddleware,getAngelOneCredential)


// AngelOne Login
router.get('/angelone', loginWithAngelOne); 
router.get('/angelone/callback', angelOneCallback);


router.post('/regenerate/user/token', authMiddleware,reGenerateTokenWithAngelOne);   // our code 
router.get('/angelone/logout/user',authMiddleware, logoutAngelOne);   // our code 


router.get('/angelone/position',authMiddleware,getPosition)

 

// not used Routes

router.get('/angelone/cancel/order',cancelOrder)
// router.post('/place/order',AdminAuthMiddleware,placeOrder)
// router.get('/update/oneorder',AdminAuthMiddleware,getOrderPerticular);
// router.put('/modify/order',AdminAuthMiddleware,ModifyOrder)
// router.get('/dummydataorder',authMiddleware,getOrderDataForDeshboard)
// router.get('/get/user/profile', getAngelOneProfile);  
router.get('/angelone/get/order',getAngelOneOrder);
// router.post('/get/instrument/one',authMiddleware,getPerticularInstruments)
router.get('/angelone/get/trade/book',getTradeBook)
router.get('/perticular/trade/book',getPerticularTradeBook)
// router.post('/gettradedatawithfilter/book',authMiddleware,getTradeBookWithDateFilter)


export default router;