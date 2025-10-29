import express from "express";
import { getAllLicenses } from "../controllers/licenseController.js";

const router = express.Router();

router.get("/", getAllLicenses);

export default router;
