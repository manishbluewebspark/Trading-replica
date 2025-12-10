

import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { FinavasiaLogin } from '../controllers/finavasiaController.js';





const router = express.Router();



router.get('/finavasia/login',FinavasiaLogin); // Get login URL
// router.get('/kite/callback', ); // Handle callback (no auth needed)













export default router;