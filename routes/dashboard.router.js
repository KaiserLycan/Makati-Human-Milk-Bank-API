import express from "express";
import { ProtectRoute } from "../middleware/auth.middleware.js";
import { GetDashboardMetrics, GetDashboardTrends } from "../controllers/dashboard.controller.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: API for retrieving system metrics and generating reports
 */

/**
 * @swagger
 * /api/dashboard/summary:
 *   get:
 *     summary: Get weekly, monthly, or yearly system metrics (R62)
 *     tags: [Dashboard]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: range
 *         required: true
 *         schema:
 *           type: string
 *           enum: [week, month, year]
 *         description: The timeframe for the dashboard metrics
 *     responses:
 *       200:
 *         description: Successfully retrieved dashboard metrics.
 *       400:
 *         description: Invalid timeframe range provided.
 *       500:
 *         description: Internal Server Error.
 */
router.get("/summary", ProtectRoute, GetDashboardMetrics);

router.get("/trends", ProtectRoute, GetDashboardTrends);

export default router;