import express from "express";

import { protectRoute } from "../middleware/protectRoute.js";
import { GetDashboardMetrics, GetDashboardTrends } from "../controllers/dashboard.controllers.js";
const router = express.Router();

/**
 * @swagger
 * /dashboard/summary:
 *   get:
 *     tags:
 *       - Dashboard
 *     summary: Get dashboard metrics
 *     description: Retrieve a summary of dashboard metrics.
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: A summary of dashboard metrics.
 *       401:
 *         description: Unauthorized.
 */
router.get("/summary", protectRoute, GetDashboardMetrics);

/**
 * @swagger
 * /dashboard/trends:
 *   get:
 *     tags:
 *       - Dashboard
 *     summary: Get dashboard trends
 *     description: Retrieve dashboard trends data.
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Dashboard trends data.
 *       401:
 *         description: Unauthorized.
 */
router.get("/trends", protectRoute, GetDashboardTrends);

export default router;
