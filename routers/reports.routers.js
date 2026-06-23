import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import {
    ExportCollectionReport,
    ExportDispensingReport,
    ExportProcessingReport,
    GetCollectionReportData,
    GetProcessingReportData,
    GetDispensingReportData,
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
 * /api/reports/collection/data:
 *   get:
 *     tags:
 *       - Reports
 *     summary: Get collection report JSON data
 *     description: Retrieve raw JSON data for the collection report.
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: The collection report data.
 *       401:
 *         description: Unauthorized.
 */
router.get("/collection/data", protectRoute, GetCollectionReportData);

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
 * /api/reports/processing/data:
 *   get:
 *     tags:
 *       - Reports
 *     summary: Get processing report JSON data
 *     description: Retrieve raw JSON data for the processing report.
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: The processing report data.
 *       401:
 *         description: Unauthorized.
 */
router.get("/processing/data", protectRoute, GetProcessingReportData);

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

/**
 * @swagger
 * /api/reports/dispensing/data:
 *   get:
 *     tags:
 *       - Reports
 *     summary: Get dispensing report JSON data
 *     description: Retrieve raw JSON data for the dispensing report.
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: The dispensing report data.
 *       401:
 *         description: Unauthorized.
 */
router.get("/dispensing/data", protectRoute, GetDispensingReportData);

export default router;
