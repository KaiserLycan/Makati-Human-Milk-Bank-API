import express from "express";
import { ProtectRoute } from "../middleware/auth.middleware.js";
import { Authorize } from "../middleware/authorize.middleware.js";
import {
    GetRequests,
    GetRequest,
    CreateRequest,
    CancelRequest,
} from "../controllers/reservation.controller.js";

const router = express.Router();

/**
 * @openapi
 * /api/reservations:
 *   get:
 *     summary: Get all milk requests
 *     tags:
 *       - Reservation
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: request_status
 *         schema:
 *           type: string
 *           enum: [waiting, allocated, completed, canceled]
 *         description: Filter requests by status
 *     responses:
 *       200:
 *         description: List of requests retrieved successfully.
 *       500:
 *         description: Internal Server Error.
 */
router.get("/", ProtectRoute, GetRequests);

/**
 * @openapi
 * /api/reservations/{rid}:
 *   get:
 *     summary: Get a specific milk request
 *     tags:
 *       - Reservation
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: rid
 *         required: true
 *         schema:
 *           type: integer
 *         description: Request ID
 *     responses:
 *       200:
 *         description: Request retrieved successfully.
 *       404:
 *         description: Request not found.
 *       500:
 *         description: Internal Server Error.
 */
router.get("/:rid", ProtectRoute, GetRequest);

/**
 * @openapi
 * /api/reservations:
 *   post:
 *     summary: Create a new milk request
 *     tags:
 *       - Reservation
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - bid
 *               - requested_vol_ml
 *             properties:
 *               bid:
 *                 type: integer
 *               requested_vol_ml:
 *                 type: number
 *               hospital:
 *                 type: string
 *     responses:
 *       201:
 *         description: Request created successfully.
 *       400:
 *         description: Validation error.
 *       404:
 *         description: Beneficiary not found.
 *       500:
 *         description: Internal Server Error.
 */
router.post("/", ProtectRoute, CreateRequest);

/**
 * @openapi
 * /api/reservations/{rid}/cancel:
 *   patch:
 *     summary: Cancel a milk request
 *     tags:
 *       - Reservation
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: rid
 *         required: true
 *         schema:
 *           type: integer
 *         description: Request ID
 *     responses:
 *       200:
 *         description: Request canceled successfully.
 *       400:
 *         description: Cannot cancel request.
 *       404:
 *         description: Request not found.
 *       500:
 *         description: Internal Server Error.
 */
router.patch("/:rid/cancel", ProtectRoute, CancelRequest);

export default router;