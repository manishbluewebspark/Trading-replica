import express from 'express';
import { shoonyaLogin } from '../controllers/shoonyaController.js';



const router = express.Router();

router.post('/finvasia/login', shoonyaLogin);


export default router;