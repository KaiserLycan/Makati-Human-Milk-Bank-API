import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import {
    ExportCollectionReport,
    ExportDispensingReport,
    ExportProcessingReport,
} from "../controllers/reports.controllers.js";

const router = express.Router();

/**
 * @swagger
 * /api/reports/collection/export:
 *   get:
 *     tags:
 *       - Reports
 *     summary: Export collection report
 *     description: Export a report of milk collections.
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: The collection report.
 *       401:
 *         description: Unauthorized.
 */
router.get("/collection/export", protectRoute, ExportCollectionReport);

/**
 * @swagger
 * /api/reports/processing/export:
 *   get:
 *     tags:
 *       - Reports
 *     summary: Export processing report
 *     description: Export a report of milk processing.
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: The processing report.
 *       401:
 *         description: Unauthorized.
 */
router.get("/processing/export", protectRoute, ExportProcessingReport);

/**
 * @swagger
 * /api/reports/dispensing/export:
 *   get:
 *     tags:
 *       - Reports
 *     summary: Export dispensing report
 *     description: Export a report of milk dispensing.
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: The dispensing report.
 *       401:
 *         description: Unauthorized.
 */
router.get("/dispensing/export", protectRoute, ExportDispensingReport);

export default router;
