import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import {
    getRequests,
    getRequestById,
    createRequest,
    cancelRequest,
    updateRequest,
    deleteRequest,
} from "../controllers/reservation.controllers.js";
import { validateRequest } from "../middleware/validate.js";
import { listQuerySchema } from "../schemas/query.schemas.js";
import { requestQuerySchemas } from "../schemas/request.schemas.js";
import { IdSchema } from "../schemas/id.schemas.js";

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
router.get(
    "/",
    protectRoute,
    validateRequest({
        query: requestQuerySchemas,
    }),
    getRequests,
);

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
 *           type: integer
 *         example: 12345
 *     responses:
 *       200:
 *         description: The reservation.
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
    getRequestById,
);

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
router.post("/", protectRoute, createRequest);

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
 *           type: integer
 *         example: 12345
 *     responses:
 *       200:
 *         description: Reservation canceled successfully.
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Not Found.
 */
router.patch("/:rid/cancel", protectRoute, cancelRequest);

/**
 * @swagger
 * /api/reservations/{rid}:
 *   put:
 *     tags:
 *       - Reservation
 *     summary: Update a waiting reservation
 *     description: Update a reservation's information. Only 'waiting' requests can be updated.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: rid
 *         required: true
 *         schema:
 *           type: integer
 *         example: 12345
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               requested_vol_ml:
 *                 type: integer
 *                 example: 250
 *               hospital:
 *                 type: string
 *                 example: "Makati Medical Center"
 *     responses:
 *       200:
 *         description: Reservation updated successfully.
 *       400:
 *         description: Bad Request.
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Not Found.
 */
router.put("/:rid", protectRoute, updateRequest);

/**
 * @swagger
 * /api/reservations/{rid}:
 *   delete:
 *     tags:
 *       - Reservation
 *     summary: Permanently delete a reservation
 *     description: Permanently delete a reservation by its ID.
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
 *         description: Reservation permanently deleted.
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Not Found.
 */
router.delete("/:rid", protectRoute, deleteRequest);

export default router;
