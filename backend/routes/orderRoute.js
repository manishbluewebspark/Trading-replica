import express from 'express';

import { getOrderWithDate, getOrderInTables, getTradeWithDate, userGetTradeInTables, searchOrders} from '../controllers/placeOrderController.js';
import { authMiddleware} from '../middleware/authMiddleware.js';
import { getTradeBookInTable } from '../controllers/tradeController.js';
import { getKiteAllOrders, getTradeDataForKiteDeshboard, getTradeDataForUserPosition } from '../controllers/kiteController.js';
import { getCloneUserTrade } from '../controllers/admin/cloneUserController.js';
import { getTradeDataForDeshboard, getTradeDataUserPostion } from '../controllers/angelController.js';


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

       return getTradeDataForUserPosition(req, res,next);
       
      }else if(role === "user" && brokername === "angelone") {

        return getTradeDataUserPostion(req, res,next)
      }else {
      
        return getCloneUserTrade(req,res,next)
        

      }

  } catch (error) {
    console.error("ControllerPicker Error:", error);
    return res.status(500).json({ status: false, message: "Server error" });
  }
}

)


export default router;