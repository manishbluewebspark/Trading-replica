import express from 'express';
import { AdminGetTotalUsers, AdminLoginMultipleUser, adminPlaceMultipleOrder } from '../../controllers/admin/adminOrderController.js';
import { getTokens, storeTokens } from '../../controllers/testController.js';


const router = express.Router();

router.post('/place/order',adminPlaceMultipleOrder)

router.get('/login/users',AdminLoginMultipleUser)


router.get('/store/session',storeTokens)

router.get('/get/session',getTokens)

router.get('/get/totalusers',AdminGetTotalUsers)


export default router;