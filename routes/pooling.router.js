import express from "express";
import { ProtectRoute } from "../middleware/auth.middleware.js";
import { Authorize } from "../middleware/authorize.middleware.js";
import Validate from "../utils/validate.util.js";
import {
    CreatePoolSchemaValidator,
    UpdatePoolQATSchemaValidator
} from "../utils/validators/pooling.validate.js";
import {
    CreateMilkPool,
    UpdatePoolQAT
} from "../controllers/pooling.controller.js";

const router = express.Router();

/**
 * @swagger
 * /api/pooling/create:
 *   post:
 *     summary: Create a milk pool
 *     tags:
 *       - Pooling
 *     description: Combines multiple passed raw milk records into a single pool (R41). Automatically rejects milk that failed QAT (R40).
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - raw_milk_ctns
 *             properties:
 *               raw_milk_ctns:
 *                 type: array
 *                 description: An array of CTNs (Container Tracking Numbers) to combine.
 *                 items:
 *                   type: integer
 *                 example: [1, 2, 3]
 *               actual_volume_ml:
 *                 type: number
 *                 description: The final volume after pooling. Use this if leakage occurred during transfer.
 *                 example: 340.5
 *               remarks:
 *                 type: string
 *                 description: Optional notes regarding the pooling process.
 *                 example: "Minor transfer loss observed."
 *     responses:
 *       201:
 *         description: Milk pool successfully created and volumes calculated.
 *       400:
 *         description: Validation failed.
 *       500:
 *         description: Internal Server Error.
 */
router.post(
    "/create",
    ProtectRoute,
    Authorize,
    Validate(CreatePoolSchemaValidator),
    CreateMilkPool
);

/**
 * @swagger
 * /api/pooling/{pid}/qat:
 *   patch:
 *     summary: Update post-pooling QAT status
 *     tags:
 *       - Pooling
 *     description: Updates the QAT status of a milk pool (R42). If the pool fails, it is automatically discarded (R44).
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: pid
 *         required: true
 *         description: The unique Pool ID.
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
 *                 enum:
 *                   - pass
 *                   - fail
 *                 example: pass
 *               remarks:
 *                 type: string
 *                 example: "Passed microbiological testing."
 *     responses:
 *       200:
 *         description: QAT status updated successfully.
 *       400:
 *         description: Validation failed.
 *       404:
 *         description: Pool not found.
 *       500:
 *         description: Internal Server Error.
 */
router.patch(
    "/:pid/qat",
    ProtectRoute,
    Authorize,
    Validate(UpdatePoolQATSchemaValidator),
    UpdatePoolQAT
);

export default router;