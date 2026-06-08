import express from "express";
import { ProtectRoute } from "../middleware/auth.middleware.js";
import { LogPasteurizationBatch, 
        ReportPasteurizationIncident, 
        UpdateMBTStatus } from "../controllers/pasteurization.controller.js";


const router = express.Router();


/**
 * @openapi
 * /api/pasteurization/batch:
 * post:
 * summary: Log a new pasteurization batch from a pool
 * tags:
 * - Pasteurization
 * security:
 * - bearerAuth: []
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required:
 * - pid
 * - batch_number
 * - bottle_count
 * - volume_per_bottle
 * properties:
 * pid:
 * type: integer
 * batch_number:
 * type: integer
 * bottle_count:
 * type: integer
 * volume_per_bottle:
 * type: number
 * bottle_type:
 * type: string
 * enum: [ameda, korea, red_cap]
 * responses:
 * 201:
 * description: Successfully created pasteurized bottle records.
 * 400:
 * description: Volume mismatch or missing fields.
 * 404:
 * description: Pool record not found.
 */
router.post("/batch", ProtectRoute, LogPasteurizationBatch);
/**
 * @openapi
 * /api/pasteurization/{btl_id}/incident:
 * patch:
 * summary: Report leakage or contamination for a specific bottle
 * tags:
 * - Pasteurization
 * security:
 * - bearerAuth: []
 * parameters:
 * - in: path
 * name: btl_id
 * required: true
 * schema:
 * type: integer
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * volume_ml:
 * type: number
 * milk_status:
 * type: string
 * enum: [good, contaminated, discarded, expired]
 * remarks:
 * type: string
 * responses:
 * 200:
 * description: Incident reported successfully.
 */
router.patch("/:btl_id/incident", ProtectRoute, ReportPasteurizationIncident);
/**
 * @openapi
 * /api/pasteurization/{btl_id}/mbt:
 * patch:
 * summary: Update MBT status (automatically handles discarding or dispensing lists)
 * tags:
 * - Pasteurization
 * security:
 * - bearerAuth: []
 * parameters:
 * - in: path
 * name: btl_id
 * required: true
 * schema:
 * type: integer
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required:
 * - mbt_status
 * properties:
 * mbt_status:
 * type: string
 * enum: [pass, fail]
 * remarks:
 * type: string
 * responses:
 * 200:
 * description: MBT status updated successfully.
 */
router.patch("/:btl_id/mbt", ProtectRoute, UpdateMBTStatus);
export default router;