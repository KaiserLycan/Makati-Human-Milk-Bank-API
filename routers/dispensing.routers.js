import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import {
    getAllocatedRequests,
    DispenseMilk,
    getAllocatedRequest,
} from "../controllers/dispensing.controllers.js";
import { validateRequest } from "../middleware/validate.js";
import { requestQuerySchemas } from "../schemas/request.schemas.js";
import { IdSchema } from "../schemas/id.schemas.js";

const router = express.Router();

/**
 * @swagger
 * /api/dispensing:
 *   get:
 *     tags:
 *       - Dispensing
 *     summary: Get dispensing queue
 *     description: Retrieve the queue of milk to be dispensed.
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: The dispensing queue.
 *       401:
 *         description: Unauthorized.
 */
router.get(
    "/",
    protectRoute,
    validateRequest({ query: requestQuerySchemas }),
    getAllocatedRequests,
);

/**
 * @swagger
 * /api/dispensing/{rid}:
 *   get:
 *     tags:
 *       - Dispensing
 *     summary: Get details of an allocated request
 *     description: Retrieve details of a specific allocated request by its ID.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: rid
 *         required: true
 *         schema:
 *           type: integer
 *         example: 12345
 *     responses:
 *       200:
 *         description: Details of the allocated request.
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Not Found.
 */
router.get(
    "/:rid",
    protectRoute,
    validateRequest({
        params: IdSchema,
    }),
    getAllocatedRequest,
);

/**
 * @swagger
 * /api/dispensing/{rid}/dispense:
 *   patch:
 *     tags:
 *       - Dispensing
 *     summary: Dispense milk
 *     description: Dispense milk for a specific reservation.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: rid
 *         required: true
 *         schema:
 *           type: integer
 *         example: 12345
 *     responses:
 *       200:
 *         description: Milk dispensed successfully.
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Not Found.
 */
router.patch("/:rid/dispense", protectRoute, DispenseMilk);

export default router;
