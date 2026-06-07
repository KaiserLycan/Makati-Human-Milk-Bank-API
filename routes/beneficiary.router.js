import express from 'express';
import {ProtectRoute} from "../middleware/auth.middleware.js";
import {
    DeleteBeneficiary,
    GetBeneficiaries,
    GetBeneficiary,
    RegisterBeneficiary, UpdateApplicationStatus,
    UpdateBeneficiary
} from "../controllers/beneficiary.controller.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Beneficiaries
 *   description: API for managing beneficiaries
 */

/**
 * @swagger
 * /api/beneficiaries:
 *   get:
 *     summary: Get all beneficiaries
 *     tags: [Beneficiaries]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: application_status
 *         schema:
 *           type: string
 *           enum: [pending, rejected, approved]
 *         description: Filter beneficiaries by application status
 *     responses:
 *       200:
 *         description: A list of beneficiaries
 *       404:
 *         description: Not found (No records found)
 *       500:
 *         description: Internal Server Error
 */
router.get("/", ProtectRoute, GetBeneficiaries);

/**
 * @swagger
 * /api/beneficiaries/{bid}:
 *   get:
 *     summary: Get a beneficiary by BID
 *     tags: [Beneficiaries]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: bid
 *         required: true
 *         schema:
 *           type: integer
 *         description: The Beneficiary ID (BID)
 *     responses:
 *       200:
 *         description: A single beneficiary object
 *       404:
 *         description: Not Found
 *       500:
 *         description: Internal Server Error
 */
router.get("/:bid", ProtectRoute, GetBeneficiary);

/**
 * @swagger
 * /api/beneficiaries/register:
 *   post:
 *     summary: Register a new beneficiary (Protected)
 *     tags: [Beneficiaries]
 *     security:
 *       - cookieAuth: []
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
 *                   caregiver:
 *                     type: string
 *                   caregiver_email:
 *                     type: string
 *                   caregiver_phone:
 *                     type: string
 *                   birth_date:
 *                     type: string
 *                     format: date
 *                   weight_kg:
 *                     type: number
 *                     format: float
 *                   feeding_requirement_ml:
 *                     type: integer
 *                   profile:
 *                     type: object
 *                     properties:
 *                       prescription_details:
 *                         type: string
 *                       clinical_abstract:
 *                         type: string
 *     responses:
 *       201:
 *         description: Beneficiary registered successfully
 *       400:
 *         description: Invalid input or missing values
 *       500:
 *         description: Internal Server Error
 */
router.post("/register", ProtectRoute, RegisterBeneficiary);

/**
 * @swagger
 * /api/beneficiaries/public-register:
 *   post:
 *     summary: Register a new beneficiary (Public)
 *     tags: [Beneficiaries]
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
 *                   caregiver:
 *                     type: string
 *                   caregiver_email:
 *                     type: string
 *                   caregiver_phone:
 *                     type: string
 *                   birth_date:
 *                     type: string
 *                     format: date
 *                   weight_kg:
 *                     type: number
 *                     format: float
 *                   feeding_requirement_ml:
 *                     type: integer
 *                   profile:
 *                     type: object
 *                     properties:
 *                       prescription_details:
 *                         type: string
 *                       clinical_abstract:
 *                         type: string
 *     responses:
 *       201:
 *         description: Beneficiary registered successfully
 *       400:
 *         description: Invalid input or missing values
 *       500:
 *         description: Internal Server Error
 */
router.post("/public-register", RegisterBeneficiary);

/**
 * @swagger
 * /api/beneficiaries/{bid}:
 *   patch:
 *     summary: Update beneficiary application status
 *     tags: [Beneficiaries]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: bid
 *         required: true
 *         schema:
 *           type: integer
 *         description: The Beneficiary ID (BID)
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
 *       404:
 *         description: Cannot update missing record
 *       500:
 *         description: Internal Server Error
 */
router.patch("/:bid", ProtectRoute, UpdateApplicationStatus);

/**
 * @swagger
 * /api/beneficiaries/{bid}:
 *   delete:
 *     summary: Delete a beneficiary by BID
 *     tags: [Beneficiaries]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: bid
 *         required: true
 *         schema:
 *           type: integer
 *         description: The Beneficiary ID (BID)
 *     responses:
 *       204:
 *         description: Beneficiary deleted successfully
 *       500:
 *         description: Internal Server Error
 */
router.delete("/:bid", ProtectRoute, DeleteBeneficiary);

/**
 * @swagger
 * /api/beneficiaries/{bid}:
 *   put:
 *     summary: Update a beneficiary by BID
 *     tags: [Beneficiaries]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: bid
 *         required: true
 *         schema:
 *           type: integer
 *         description: The Beneficiary ID (BID)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               beneficiary:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   caregiver:
 *                     type: string
 *                   caregiver_email:
 *                     type: string
 *                   caregiver_phone:
 *                     type: string
 *                   birth_date:
 *                     type: string
 *                     format: date
 *                   weight_kg:
 *                     type: number
 *                     format: float
 *                   feeding_requirement_ml:
 *                     type: integer
 *                   profile:
 *                     type: object
 *                     properties:
 *                       prescription_details:
 *                         type: string
 *                       clinical_abstract:
 *                         type: string
 *     responses:
 *       200:
 *         description: Beneficiary updated successfully
 *       400:
 *         description: Invalid input or email already exists
 *       404:
 *         description: Not Found
 *       500:
 *         description: Internal Server Error
 */
router.put("/:bid", ProtectRoute, UpdateBeneficiary);

export default router;