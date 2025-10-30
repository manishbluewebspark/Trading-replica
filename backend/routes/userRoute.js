import express from 'express';
import { getAllUsers } from '../controllers/userController.js';
import { getAngelOneProfile, getAngelOneProfileFund, loginWithTOTPInAngelOne, logoutAngelOne, reGenerateTokenWithAngelOne } from '../controllers/authController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import { downloadOrderData, downloadUserAngelOneCredential, downloadUserExcelFile } from '../excelFiles/downloadExcel.js';


const router = express.Router();
  
router.get('/get-users', getAllUsers);

router.get('/get/user/profile', getAngelOneProfile);   // our code 

router.get('/login/totp/angelone',authMiddleware, loginWithTOTPInAngelOne);   // our code 

router.get('/get/user/fund',authMiddleware, getAngelOneProfileFund); 

router.post('/regenerate/user/token', authMiddleware,reGenerateTokenWithAngelOne);   // our code 

router.get('/logout/user/profile',authMiddleware, logoutAngelOne);   // our code 


// excel 
// router.get('/export/users',authMiddleware, downloadUserExcelFile);
// router.get('/export/angelone/credential',authMiddleware, downloadUserAngelOneCredential);
// router.get('/export/orders',authMiddleware, downloadOrderData);



export default router;