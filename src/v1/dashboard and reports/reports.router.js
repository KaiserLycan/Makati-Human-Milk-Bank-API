import express from "express";
import { ProtectRoute } from "../middleware/auth.middleware.js";
import {
    ExportCollectionReport,
    ExportDispensingReport,
    ExportProcessingReport,
} from "../controllers/reports.controller.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Reports
 *   description: API for generating and downloading PDF reports
 */

/**
 * @swagger
 * /api/reports/collection/export:
 *   get:
 *     summary: Download the monthly Collection PDF Report
 *     tags: [Reports]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: PDF file downloaded successfully.
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get("/collection/export", ProtectRoute, ExportCollectionReport);

/**
 * @swagger
 * /api/reports/processing/export:
 *   get:
 *     summary: Download the monthly Processing & MBT PDF Report
 *     tags: [Reports]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: PDF file downloaded successfully.
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get("/processing/export", ProtectRoute, ExportProcessingReport);

/**
 * @swagger
 * /api/reports/dispensing/export:
 *   get:
 *     summary: Download the monthly Dispensing PDF Report
 *     tags: [Reports]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: PDF file downloaded successfully.
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get("/dispensing/export", ProtectRoute, ExportDispensingReport);

export default router;
