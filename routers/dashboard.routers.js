import express from "express";

import { protectRoute } from "../middleware/protectRoute.js";
import { GetDashboardMetrics, GetDashboardTrends } from "../controllers/dashboard.controllers.js";
const router = express.Router();

router.get("/summary", protectRoute, GetDashboardMetrics);

router.get("/trends", protectRoute, GetDashboardTrends);

export default router;
