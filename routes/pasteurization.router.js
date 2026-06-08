import express from "express";
import { ProtectRoute } from "../middleware/auth.middleware.js";
import { 
    LogPasteurizationBatch, 
    ReportPasteurizationIncident, 
    UpdateMBTStatus 
} from "../controllers/pasteurization.controller.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Pasteurization
 *   description: API for managing pasteurization batches and MBT testing
 */

/**
 * @swagger
 * /api/pasteurization/batch:
 *   post:
 *     summary: Log a new pasteurization batch by splitting a pool into bottles
 *     tags: [Pasteurization]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - pid
 *               - batch_number
 *               - bottle_count
 *               - volume_per_bottle
 *               - bottle_type
 *               - pasteurization_date
 *             properties:
 *               pid:
 *                 type: integer
 *               batch_number:
 *                 type: integer
 *               bottle_count:
 *                 type: integer
 *               volume_per_bottle:
 *                 type: number
 *               bottle_type:
 *                 type: string
 *                 enum: [ameda, korea, red_cap]
 *               pasteurization_date:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Successfully created pasteurized bottle records.
 *       400:
 *         description: Volume mismatch or missing required fields.
 *       404:
 *         description: Pool record not found.
 *       500:
 *         description: Internal Server Error
 */
router.post("/batch", ProtectRoute, LogPasteurizationBatch);

/**
 * @swagger
 * /api/pasteurization/{btl_id}/incident:
 *   patch:
 *     summary: Report leakage or contamination for a specific bottle
 *     tags: [Pasteurization]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: btl_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The Bottle ID (btl_id)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               volume_ml:
 *                 type: number
 *               milk_status:
 *                 type: string
 *                 enum: [good, contaminated, discarded, expired]
 *               remarks:
 *                 type: string
 *     responses:
 *       200:
 *         description: Incident reported and bottle updated successfully.
 *       400:
 *         description: Invalid milk status enum provided.
 *       404:
 *         description: Bottle record not found.
 *       500:
 *         description: Internal Server Error
 */
router.patch("/:btl_id/incident", ProtectRoute, ReportPasteurizationIncident);

/**
 * @swagger
 * /api/pasteurization/{btl_id}/mbt:
 *   patch:
 *     summary: Update MBT status (automatically handles discarding or dispensing lists)
 *     tags: [Pasteurization]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: btl_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The Bottle ID (btl_id)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mbt_status
 *             properties:
 *               mbt_status:
 *                 type: string
 *                 enum: [pass, fail]
 *               remarks:
 *                 type: string
 *     responses:
 *       200:
 *         description: MBT status updated successfully.
 *       400:
 *         description: Invalid MBT status enum provided.
 *       404:
 *         description: Bottle record not found.
 *       500:
 *         description: Internal Server Error
 */
router.patch("/:btl_id/mbt", ProtectRoute, UpdateMBTStatus);

export default router;