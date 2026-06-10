import express from "express";
import { ProtectRoute } from "../middleware/auth.middleware.js";
import { GetDashboardMetrics } from "../controllers/dashboard.controller.js";

const router = express.Router();


router.get("/summary", ProtectRoute, GetDashboardMetrics);

export default router;