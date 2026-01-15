import express from "express";
import { getGrowwAppCredential, getGrowwUserDetail, getGrowwUserMargins, growwAppCredential } from "../controllers/growwController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";


const router = express.Router();

// 🔐 Create or Update Groww Credential
router.post(
  "/groww/appcredential/create",
  authMiddleware,
  growwAppCredential
);

// 📥 Get Groww Credential
router.get(
  "/groww/appcredential/get",
  authMiddleware,
  getGrowwAppCredential
);

router.get("/groww/userdetails/get",authMiddleware, getGrowwUserDetail);

router.get("/margins/detail/user",authMiddleware,getGrowwUserMargins);


export default router;