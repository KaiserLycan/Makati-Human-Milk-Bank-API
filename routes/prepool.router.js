import express from 'express';
import { UpdateRawMilkQAT, LogPrePoolIncident } from "../controllers/prepool.controller.js";
import { ProtectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Pre-Pooling
 *   description: API for managing pre-pooling tasks (raw milk quality testing and incidents)
 */

/**
 * @swagger
 * /api/prepool/raw-milk/{ctn}/qat:
 *   patch:
 *     summary: Update QAT status for raw milk
 *     tags: [Pre-Pooling]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: ctn
 *         required: true
 *         description: The Container Tracking Number (CTN) of the raw milk
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - qat_status
 *             properties:
 *               qat_status:
 *                 type: string
 *                 enum: [pass, fail]
 *                 example: pass
 *               remarks:
 *                 type: string
 *                 example: "Passed initial screening."
 *     responses:
 *       200:
 *         description: QAT status updated successfully.
 *       400:
 *         description: Invalid input or missing required fields.
 *       404:
 *         description: Record not found.
 *       500:
 *         description: Internal Server Error.
 */
router.patch("/raw-milk/:ctn/qat", ProtectRoute, UpdateRawMilkQAT);

/**
 * @swagger
 * /api/prepool/raw-milk/{ctn}/incident:
 *   patch:
 *     summary: Record contamination or leakage for raw milk
 *     tags: [Pre-Pooling]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: ctn
 *         required: true
 *         description: The Container Tracking Number (CTN) of the raw milk
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - incident_type
 *             properties:
 *               incident_type:
 *                 type: string
 *                 enum: [contamination, leakage]
 *                 example: leakage
 *               updated_volume_ml:
 *                 type: number
 *                 description: Required if incident_type is leakage (the new remaining volume)
 *                 example: 180.5
 *               remarks:
 *                 type: string
 *                 example: "Container was slightly damaged during transport."
 *     responses:
 *       200:
 *         description: Incident recorded successfully.
 *       400:
 *         description: Invalid input or missing required fields based on incident type.
 *       404:
 *         description: Record not found.
 *       500:
 *         description: Internal Server Error.
 */
router.patch("/raw-milk/:ctn/incident", ProtectRoute, LogPrePoolIncident);

export default router;