import express from "express";

// 1. Import Middleware (The Bouncers)
import { ProtectRoute } from "../middleware/auth.middleware.js";
import { Authorize } from "../middleware/authorize.middleware.js";
import Validate from "../utils/validate.util.js";
import { CreatePoolSchemaValidator, UpdatePoolQATSchemaValidator } from "../utils/validators/pooling.validate.js";

// 2. Import Controllers (The Chefs)
import { CreateMilkPool, UpdatePoolQAT } from "../controllers/pooling.controller.js";

const router = express.Router();

/**
 * @openapi
 * /api/pooling/create:
 * post:
 * summary: Create a Milk Pool
 * tags:
 * - Pooling
 * description: Combines multiple passed raw milk records into a single pool (R41). Automatically rejects milk that failed QAT (R40).
 * security:
 * - cookieAuth: []
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required:
 * - raw_milk_ctns
 * properties:
 * raw_milk_ctns:
 * type: array
 * items:
 * type: integer
 * description: An array of CTNs (Container Tracking Numbers) to combine.
 * example: [1, 2, 3]
 * actual_volume_ml:
 * type: number
 * description: The final volume after pooling. Use this if leakage occurred during transfer. If omitted, defaults to the expected sum.
 * example: 340.5
 * remarks:
 * type: string
 * description: Optional notes regarding the pooling process.
 * responses:
 * 201:
 * description: Milk pool successfully created and volumes calculated.
 * 400:
 * description: Validation failed (e.g., attempting to pool milk that failed QAT, or CTN already pooled).
 * 500:
 * description: Internal Server Error.
 */
router.post(
    "/create", 
    ProtectRoute, 
    Authorize, 
    Validate(CreatePoolSchemaValidator), 
    CreateMilkPool
);

/**
 * @openapi
 * /api/pooling/{pid}/qat:
 * patch:
 * summary: Update Post-Pooling QAT Status
 * tags:
 * - Pooling
 * description: Updates the QAT status of a milk pool (R42). If the pool fails, it is automatically discarded (R44).
 * security:
 * - cookieAuth: []
 * parameters:
 * - in: path
 * name: pid
 * required: true
 * schema:
 * type: integer
 * description: The unique Pool ID
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required:
 * - qat_status
 * properties:
 * qat_status:
 * type: string
 * enum: [pass, fail]
 * remarks:
 * type: string
 * responses:
 * 200:
 * description: QAT status updated successfully.
 * 400:
 * description: Validation failed (e.g., invalid status, or pool already discarded).
 * 404:
 * description: Pool not found.
 * 500:
 * description: Internal Server Error.
 */
router.patch(
    "/:pid/qat", 
    ProtectRoute, 
    Authorize, 
    Validate(UpdatePoolQATSchemaValidator), 
    UpdatePoolQAT
);

export default router;