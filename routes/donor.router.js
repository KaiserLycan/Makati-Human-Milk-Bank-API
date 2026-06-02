import express from 'express';
import {ProtectRoute} from "../middleware/auth.middleware.js";
import {
    DeleteDonor,
    GetDonor,
    GetDonors,
    RegisterDonor,
    UpdateApplicationStatus, UpdateDonor
} from "../controllers/donor.contoller.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Donors
 *   description: API for managing donors
 */

/**
 * @swagger
 * /api/donors:
 *   get:
 *     summary: Get all donors
 *     tags: [Donors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: application_status
 *         schema:
 *           type: string
 *           enum: [pending, rejected, approved]
 *         description: Filter donors by application status
 *     responses:
 *       200:
 *         description: A list of donors
 *       404:
 *         description: Not found (invalid application status)
 *       500:
 *         description: Internal Server Error
 */
router.get("/", ProtectRoute, GetDonors);

/**
 * @swagger
 * /api/donors/{dtn}:
 *   get:
 *     summary: Get a donor by DTN
 *     tags: [Donors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: dtn
 *         required: true
 *         schema:
 *           type: integer
 *         description: The Donor Tracking Number (DTN)
 *     responses:
 *       200:
 *         description: A single donor object
 *       404:
 *         description: Not Found
 *       500:
 *         description: Internal Server Error
 */
router.get("/:dtn", ProtectRoute, GetDonor);

/**
 * @swagger
 * /api/donors/register:
 *   post:
 *     summary: Register a new donor (Protected)
 *     tags: [Donors]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               application:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   email:
 *                     type: string
 *                   phone:
 *                     type: string
 *                   birth_date:
 *                     type: string
 *                     format: date
 *                   profile:
 *                     type: string
 *     responses:
 *       201:
 *         description: Donor registered successfully
 *       400:
 *         description: Invalid input or missing values (e.g., email already registered)
 *       500:
 *         description: Internal Server Error
 */
router.post("/register", ProtectRoute, RegisterDonor);

/**
 * @swagger
 * /api/donors/public-register:
 *   post:
 *     summary: Register a new donor (Public)
 *     tags: [Donors]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               application:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   email:
 *                     type: string
 *                   phone:
 *                     type: string
 *                   birth_date:
 *                     type: string
 *                     format: date
 *                   profile:
 *                     type: string
 *     responses:
 *       201:
 *         description: Donor registered successfully
 *       400:
 *         description: Invalid input or missing values (e.g., email already registered)
 *       500:
 *         description: Internal Server Error
 */
router.post("/public-register", RegisterDonor);

/**
 * @swagger
 * /api/donors/{dtn}:
 *   patch:
 *     summary: Update donor application status
 *     tags: [Donors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: dtn
 *         required: true
 *         schema:
 *           type: integer
 *         description: The Donor Tracking Number (DTN)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               application_status:
 *                 type: string
 *                 enum: [pending, rejected, approved]
 *     responses:
 *       200:
 *         description: Application status updated successfully
 *       400:
 *         description: No status provided
 *       500:
 *         description: Internal Server Error
 */
router.patch("/:dtn", ProtectRoute, UpdateApplicationStatus)

/**
 * @swagger
 * /api/donors/{dtn}:
 *   delete:
 *     summary: Delete a donor by DTN
 *     tags: [Donors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: dtn
 *         required: true
 *         schema:
 *           type: integer
 *         description: The Donor Tracking Number (DTN)
 *     responses:
 *       204:
 *         description: Donor deleted successfully
 *       404:
 *         description: Not Found
 *       500:
 *         description: Internal Server Error
 */
router.delete("/:dtn", ProtectRoute, DeleteDonor);

/**
 * @swagger
 * /api/donors/{dtn}:
 *   put:
 *     summary: Update a donor by DTN
 *     tags: [Donors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: dtn
 *         required: true
 *         schema:
 *           type: integer
 *         description: The Donor Tracking Number (DTN)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               donor:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   email:
 *                     type: string
 *                   phone:
 *                     type: string
 *                   birth_date:
 *                     type: string
 *                     format: date
 *                   profile:
 *                     type: string
 *     responses:
 *       200:
 *         description: Donor updated successfully
 *       400:
 *         description: Invalid input or email already exists
 *       404:
 *         description: Not Found
 *       500:
 *         description: Internal Server Error
 */
router.put("/:dtn", ProtectRoute, UpdateDonor);



export default router;