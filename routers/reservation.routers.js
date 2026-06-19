import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import {
    GetRequests,
    GetRequest,
    CreateRequest,
    CancelRequest,
} from "../controllers/reservation.controllers.js";

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Reservation:
 *       type: object
 *       properties:
 *         beneficiary_id:
 *           type: string
 *           example: "12345"
 *         volume_ml:
 *           type: integer
 *           example: 200
 */

/**
 * @swagger
 * /api/reservations:
 *   get:
 *     tags:
 *       - Reservation
 *     summary: Get all reservations
 *     description: Retrieve a list of all reservations.
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: A list of reservations.
 *       401:
 *         description: Unauthorized.
 */
router.get("/", protectRoute, GetRequests);

/**
 * @swagger
 * /api/reservations/{rid}:
 *   get:
 *     tags:
 *       - Reservation
 *     summary: Get a single reservation
 *     description: Retrieve a single reservation by its ID.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: rid
 *         required: true
 *         schema:
 *           type: string
 *         example: "12345"
 *     responses:
 *       200:
 *         description: The reservation.
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Not Found.
 */
router.get("/:rid", protectRoute, GetRequest);

/**
 * @swagger
 * /api/reservations:
 *   post:
 *     tags:
 *       - Reservation
 *     summary: Create a new reservation
 *     description: Create a new reservation.
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Reservation'
 *     responses:
 *       201:
 *         description: Reservation created successfully.
 *       400:
 *         description: Bad Request.
 *       401:
 *         description: Unauthorized.
 */
router.post("/", protectRoute, CreateRequest);

/**
 * @swagger
 * /api/reservations/{rid}/cancel:
 *   patch:
 *     tags:
 *       - Reservation
 *     summary: Cancel a reservation
 *     description: Cancel a reservation by its ID.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: rid
 *         required: true
 *         schema:
 *           type: string
 *         example: "12345"
 *     responses:
 *       200:
 *         description: Reservation cancelled successfully.
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Not Found.
 */
router.patch("/:rid/cancel", protectRoute, CancelRequest);

export default router;
