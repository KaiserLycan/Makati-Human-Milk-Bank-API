import express from 'express';
import { UpdateRawMilkQAT, LogPrePoolIncident } from "../controllers/prepool.controller.js";
import { ProtectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

/**
 * @openapi
 * /api/prepool/raw-milk/{ctn}/qat:
 *   patch:
 *     summary: Update QAT status for raw milk
 *     tags:
 *       - Pre-Pooling
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ctn
 *         required: true
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
 *               remarks:
 *                 type: string
 *     responses:
 *       200:
 *         description: QAT status updated successfully.
 *       400:
 *         description: Invalid input.
 *       404:
 *         description: Record not found.
 */
router.patch("/raw-milk/:ctn/qat", ProtectRoute, UpdateRawMilkQAT);

/**
 * @openapi
 * /api/prepool/raw-milk/{ctn}/incident:
 *   patch:
 *     summary: Record contamination or leakage for raw milk
 *     tags:
 *       - Pre-Pooling
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ctn
 *         required: true
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
 *               updated_volume_ml:
 *                 type: number
 *                 description: Required if incident_type is leakage
 *               remarks:
 *                 type: string
 *     responses:
 *       200:
 *         description: Incident recorded successfully.
 *       400:
 *         description: Invalid input.
 *       404:
 *         description: Record not found.
 */
router.patch("/raw-milk/:ctn/incident", ProtectRoute, LogPrePoolIncident);

export default router;