import express from 'express';

import { getOrderWithDate, getOrderInTables, getTradeWithDate, userGetTradeInTables, searchOrders} from '../controllers/placeOrderController.js';
import { authMiddleware} from '../middleware/authMiddleware.js';
import { getTradeBookInTable } from '../controllers/tradeController.js';
import {  getKiteHolding, getKiteTradesDataUserPosition } from '../controllers/kiteController.js';
import { getCloneUserHolding, getCloneUserTradeDataUserPostion } from '../controllers/admin/cloneUserController.js';
import { getAngelUserHolding, getAngelOneTradeDataUserPostion } from '../controllers/angelController.js';
import { getShoonyaUserHolding } from '../controllers/shoonyaController.js';
import { getFyersUserHolding } from '../controllers/fyersController.js';
import { getUpstoxUserHolding } from '../controllers/upStockController.js';


const router = express.Router();

//  update routes
router.get('/get/table/order',authMiddleware,getOrderInTables); 
router.post('/datefilter/order',authMiddleware,getOrderWithDate)
router.get('/search',authMiddleware,searchOrders); 
router.get('/get/tabletradebook',authMiddleware,userGetTradeInTables)

 
router.post('/datefilter/trade',getTradeWithDate)



router.get('/get/table/tradebook',authMiddleware,getTradeBookInTable)



router.get('/userposition/common/todaytrade',authMiddleware,
  async (req, res,next) => {
    try {

      const { role, borker:brokername } = req;

        if (role === "user" && brokername === "kite") {

        return getKiteTradesDataUserPosition(req, res,next);
        
        }else if(role === "user" && brokername === "angelone") {

          return getAngelOneTradeDataUserPostion(req, res,next)
        }else {
        
          return getCloneUserTradeDataUserPostion(req,res,next)
        
        }

    } catch (error) {
    
      return res.status(500).json({ status: false, message: "Server error" });
    }
  }

)

router.get('/user/common/holding',authMiddleware,
async (req, res,next) => {
    try {

      const { role, borker:brokername } = req;

        if (role === "user" && brokername === "kite") {

        return getKiteHolding(req, res,next);
        
        }else if(role === "user" && brokername === "angelone") {

          return getAngelUserHolding(req,res,next)

        
        }else  if(role === "user" && brokername === "finavasia"){

          return getShoonyaUserHolding(req,res,next)
        
        }else  if(role === "user" && brokername === "fyers"){
        
          return getFyersUserHolding(req,res,next)
          

        }else  if(role === "user" && brokername === "upstox"){
        
          return getUpstoxUserHolding(req,res,next)
          
        }
        else {
          return  getCloneUserHolding(req,res,next)
        }
    } catch (error) {
      
      return res.status(500).json({ status: false, message: "Server error" });
    }
}




)



export default router;