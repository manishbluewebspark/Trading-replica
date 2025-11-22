import express from 'express';
import { getAllUsers, getUserById, updateUserPakage, updateUserProfile, userLogout } from '../controllers/userController.js';
import { getAngelOneProfile, getAngelOneProfileFund, loginWithTOTPInAngelOne, logoutAngelOne, reGenerateTokenWithAngelOne, testGetAngelOneProfile, testGetAngelOneProfileFund } from '../controllers/authController.js';
import {authMiddleware} from '../middleware/authMiddleware.js';
import { downloadOrderData, downloadUserAngelOneCredential, downloadUserExcelFile } from '../excelFiles/downloadExcel.js';
import multer from "multer";
import { testGetOrder, testGetPerticularOrder, testGetTradeBook } from '../controllers/tradeController.js';


// Store uploaded images in /uploads folder
const storage = multer.memoryStorage(); // or diskStorage if you want actual file
const upload = multer({ storage });



const router = express.Router();
  
router.get('/get-users', getAllUsers);

router.get('/get/user/profile', getAngelOneProfile);   // our code 

router.get('/login/totp/angelone',authMiddleware, loginWithTOTPInAngelOne);   // our code 

router.get('/get/user/fund',authMiddleware, getAngelOneProfileFund); 

router.post('/regenerate/user/token', authMiddleware,reGenerateTokenWithAngelOne);   // our code 

router.get('/logout/user/profile',authMiddleware, logoutAngelOne);   // our code 

router.put('/profile/update',upload.single("image"), updateUserProfile);

router.put('/package/update', updateUserPakage);

router.get('/getuser/profile',authMiddleware, getUserById);

router.get('/logout',authMiddleware, userLogout);


//  test apis
router.get('/test/get/user/fund', testGetAngelOneProfileFund); 
router.get('/test/get/user/profile', testGetAngelOneProfile); 
router.get('/test/get/user/trade', testGetTradeBook); 
router.get('/test/get/user/order', testGetOrder); 
router.get('/test/get/user/perticular/order', testGetPerticularOrder); 




// excel 
// router.get('/export/users',authMiddleware, downloadUserExcelFile);
// router.get('/export/angelone/credential',authMiddleware, downloadUserAngelOneCredential);
// router.get('/export/orders',authMiddleware, downloadOrderData);






export default router;