import express from 'express';
import { register, login, profileUpdate, addressUpdate, updatePassword, sendForgotEmail, verifyCode, newPassword, loginWithAngelOne, angelOneCallback, kiteLogin, kiteCallback, loginWithGroww, growwCallback, fyersLogin, fyersCallback } from '../controllers/authController.js';
import { upload } from "../middleware/upload.js"
import authMiddleware from '../middleware/authMiddleware.js';
const router = express.Router();

router.post('/register', register);
router.post('/login', login);

router.post('/forgotpassword', login);


// AngelOne Login
router.get('/angelone', loginWithAngelOne); 
router.get('/angelone/callback', angelOneCallback);


// Kite Login
router.get("/kite", kiteLogin);
router.get("/kite/callback", kiteCallback);


// Groww Login
router.get("/groww", loginWithGroww);
router.get("/groww/callback", growwCallback);

router.get('/fyers', fyersLogin);
router.get('/fyers/callback', fyersCallback);



router.put('/profile/update', upload.single("image"), profileUpdate);
router.put("/address/update", upload.none(), addressUpdate);

router.put('/update-password',authMiddleware, updatePassword);
router.post('/forgot-password', sendForgotEmail);
router.post('/verify-code', verifyCode);

router.post('/new-password', newPassword);


export default router;
