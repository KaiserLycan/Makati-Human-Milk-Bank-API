import express from "express";
import { ProtectRoute } from "../middleware/auth.middleware.js";
import { GetDispensingQueue, DispenseMilk } from "../controllers/dispensing.controller.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Dispensing
 *   description: API for managing dispensing
 */

/**
 * @swagger
 * /api/dispensing:
 *   get:
 *     summary: Get dispensing queue
 *     tags:
 *       - Dispensing
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of results per page
 *     description: Returns all allocated requests ready for dispensing, ordered by requested date (FCFS).
 *     responses:
 *       200:
 *         description: Dispensing queue retrieved successfully.
 *       500:
 *         description: Internal Server Error.
 */
router.get("/", ProtectRoute, GetDispensingQueue);

/**
 * @swagger
 * /api/dispensing/{rid}/dispense:
 *   patch:
 *     summary: Dispense milk for a request
 *     tags:
 *       - Dispensing
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: rid
 *         required: true
 *         schema:
 *           type: integer
 *         description: Request ID
 *     responses:
 *       200:
 *         description: Milk dispensed successfully.
 *       400:
 *         description: Request is not in allocated status.
 *       404:
 *         description: Request not found.
 *       500:
 *         description: Internal Server Error.
 */
router.patch("/:rid/dispense", ProtectRoute, DispenseMilk);

export default router;
