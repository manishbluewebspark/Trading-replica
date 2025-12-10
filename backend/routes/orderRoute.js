import express from 'express';

import { getOrderWithDate, getOrderInTables, getTradeWithDate, userGetTradeInTables, searchOrders} from '../controllers/placeOrderController.js';
import { authMiddleware} from '../middleware/authMiddleware.js';
import { getTradeBookInTable } from '../controllers/tradeController.js';


const router = express.Router();

//  update routes
router.get('/get/table/order',authMiddleware,getOrderInTables); 
router.post('/datefilter/order',authMiddleware,getOrderWithDate)
router.get('/search',authMiddleware,searchOrders); 
router.get('/get/tabletradebook',authMiddleware,userGetTradeInTables)

 
router.post('/datefilter/trade',getTradeWithDate)



router.get('/get/table/tradebook',authMiddleware,getTradeBookInTable)


router.get('/get/userpostion/tradebook',authMiddleware,
    async (req, res) => {
        console.log(req.borker,'hhhy');
        
    }
)


export default router;