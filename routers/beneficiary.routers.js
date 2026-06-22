import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import {
    queryBeneficiaries,
    viewBeneficiaryProfile,
    registerBeneficiary,
    updateBeneficiaryInformation,
    approveBeneficiary,
    rejectBeneficiary,
    toggleBeneficiaryStatus,
    removeBeneficiary,
} from "../controllers/beneficiary.controllers.js";
import { validateRequest } from "../middleware/validate.js";
import { beneficiaryQuerySchema, beneficiarySchemas } from "../schemas/beneficiary.schemas.js";
import { IdSchema } from "../schemas/id.schemas.js";
import { uploadBeneficiaryProfile } from "../middleware/upload.js";
import { parseFormDataJson } from "../middleware/parseFormatData.js";
import { strictLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Beneficiary:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: The name of the infant beneficiary.
 *           example: "John Doe Jr."
 *         caregiver:
 *           type: string
 *           description: The name of the caregiver.
 *           example: "Jane Doe"
 *         caregiver_email:
 *           type: string
 *           format: email
 *           description: The email address of the caregiver.
 *           example: "jane.doe@example.com"
 *         caregiver_phone:
 *           type: string
 *           description: The phone number of the caregiver.
 *           example: "+1234567890"
 *         birth_date:
 *           type: string
 *           format: date
 *           description: The birth date of the infant.
 *           example: "2024-05-15"
 *         weight_kg:
 *           type: number
 *           description: The weight of the infant in kilograms.
 *           example: 3.5
 *         feeding_requirement_ml:
 *           type: number
 *           description: The feeding requirement of the infant in milliliters.
 *           example: 100
 *         profile:
 *           type: object
 *           properties:
 *             profile_image_url:
 *               type: string
 *               format: url
 *               example: "http://example.com/profile.jpg"
 *             prescription_details:
 *               type: string
 *               format: url
 *               example: "http://example.com/prescription.pdf"
 *             clinical_abstract:
 *               type: string
 *               format: url
 *               example: "http://example.com/abstract.pdf"
 */

/**
 * @swagger
 * /api/beneficiaries:
 *   get:
 *     tags:
 *       - Beneficiaries
 *     summary: Query beneficiaries
 *     description: Retrieve a list of beneficiaries with optional filtering and pagination.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 15
 *         example: 10
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           default: "created_at"
 *         example: "name"
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: "desc"
 *         example: "asc"
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         example: "John"
 *       - in: query
 *         name: application_status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected]
 *         example: "approved"
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *         example: "active"
 *     responses:
 *       200:
 *         description: A list of beneficiaries.
 *       401:
 *         description: Unauthorized.
 */
router.get(
    "/",
    protectRoute,
    validateRequest({ query: beneficiaryQuerySchema }),
    queryBeneficiaries,
);

/**
 * @swagger
 * /api/beneficiaries/{bid}:
 *   get:
 *     tags:
 *       - Beneficiaries
 *     summary: View beneficiary profile
 *     description: Retrieve a single beneficiary's profile by their ID.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: bid
 *         required: true
 *         schema:
 *           type: integer
 *         example: 12345
 *     responses:
 *       200:
 *         description: The beneficiary's profile.
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Not Found.
 */
router.get("/:bid", protectRoute, validateRequest({ params: IdSchema }), viewBeneficiaryProfile);

/**
 * @swagger
 * /api/beneficiaries/register:
 *   post:
 *     tags:
 *       - Beneficiaries
 *     summary: Register a new beneficiary
 *     description: Register a new beneficiary with their profile information.
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               beneficiary_photo:
 *                 type: string
 *                 format: binary
 *               beneficiary_id_photo:
 *                 type: string
 *                 format: binary
 *               infant_photo:
 *                 type: string
 *                 format: binary
 *               infant_birth_certificate:
 *                 type: string
 *                 format: binary
 *               physician_request_form:
 *                 type: string
 *                 format: binary
 *               maternal_serology_result:
 *                 type: string
 *                 format: binary
 *               json:
 *                 type: string
 *                 example: '{"name":"John Doe Jr.","caregiver":"Jane Doe","caregiver_email":"jane.doe@example.com","caregiver_phone":"+1234567890","birth_date":"2024-05-15","weight_kg":3.5,"feeding_requirement_ml":100}'
 *     responses:
 *       201:
 *         description: Beneficiary registered successfully.
 *       400:
 *         description: Bad Request.
 *       401:
 *         description: Unauthorized.
 */
router.post(
    "/register",
    protectRoute,
    strictLimiter,
    uploadBeneficiaryProfile,
    parseFormDataJson,
    validateRequest({ body: beneficiarySchemas }),
    registerBeneficiary,
);

/**
 * @swagger
 * /api/beneficiaries/public-register:
 *   post:
 *     tags:
 *       - Beneficiaries
 *     summary: Publicly register a new beneficiary
 *     description: Publicly register a new beneficiary with their profile information.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               beneficiary_photo:
 *                 type: string
 *                 format: binary
 *               beneficiary_id_photo:
 *                 type: string
 *                 format: binary
 *               infant_photo:
 *                 type: string
 *                 format: binary
 *               infant_birth_certificate:
 *                 type: string
 *                 format: binary
 *               physician_request_form:
 *                 type: string
 *                 format: binary
 *               maternal_serology_result:
 *                 type: string
 *                 format: binary
 *               json:
 *                 type: string
 *                 example: '{"name":"John Doe Jr.","caregiver":"Jane Doe","caregiver_email":"jane.doe@example.com","caregiver_phone":"+1234567890","birth_date":"2024-05-15","weight_kg":3.5,"feeding_requirement_ml":100}'
 *     responses:
 *       201:
 *         description: Beneficiary registered successfully.
 *       400:
 *         description: Bad Request.
 */
router.post(
    "/public-register",
    strictLimiter,
    uploadBeneficiaryProfile,
    parseFormDataJson,
    validateRequest({ body: beneficiarySchemas }),
    registerBeneficiary,
);

/**
 * @swagger
 * /api/beneficiaries/{bid}:
 *   put:
 *     tags:
 *       - Beneficiaries
 *     summary: Update beneficiary information
 *     description: Update a beneficiary's profile information.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: bid
 *         required: true
 *         schema:
 *           type: integer
 *         example: 12345
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               beneficiary_photo:
 *                 type: string
 *                 format: binary
 *               beneficiary_id_photo:
 *                 type: string
 *                 format: binary
 *               infant_photo:
 *                 type: string
 *                 format: binary
 *               infant_birth_certificate:
 *                 type: string
 *                 format: binary
 *               physician_request_form:
 *                 type: string
 *                 format: binary
 *               maternal_serology_result:
 *                 type: string
 *                 format: binary
 *               json:
 *                 type: string
 *                 example: '{"name":"John Doe Jr.","caregiver":"Jane Doe","caregiver_email":"jane.doe@example.com","caregiver_phone":"+1234567890","birth_date":"2024-05-15","weight_kg":3.5,"feeding_requirement_ml":100}'
 *     responses:
 *       200:
 *         description: Beneficiary information updated successfully.
 *       400:
 *         description: Bad Request.
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Not Found.
 */
router.put(
    "/:bid",
    protectRoute,
    uploadBeneficiaryProfile,
    parseFormDataJson,
    validateRequest({ body: beneficiarySchemas, params: IdSchema }),
    updateBeneficiaryInformation,
);

/**
 * @swagger
 * /api/beneficiaries/approve/{bid}:
 *   patch:
 *     tags:
 *       - Beneficiaries
 *     summary: Approve a beneficiary
 *     description: Approve a beneficiary's registration.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: bid
 *         required: true
 *         schema:
 *           type: integer
 *         example: 12345
 *     responses:
 *       200:
 *         description: Beneficiary approved successfully.
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Not Found.
 */
router.patch(
    "/approve/:bid",
    protectRoute,
    validateRequest({ params: IdSchema }),
    approveBeneficiary,
);

/**
 * @swagger
 * /api/beneficiaries/reject/{bid}:
 *   patch:
 *     tags:
 *       - Beneficiaries
 *     summary: Reject a beneficiary
 *     description: Reject a beneficiary's registration.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: bid
 *         required: true
 *         schema:
 *           type: integer
 *         example: 12345
 *     responses:
 *       200:
 *         description: Beneficiary rejected successfully.
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Not Found.
 */
router.patch(
    "/reject/:bid",
    protectRoute,
    validateRequest({ params: IdSchema }),
    rejectBeneficiary,
);

/**
 * @swagger
 * /api/beneficiaries/toggle-status/{bid}:
 *   patch:
 *     tags:
 *       - Beneficiaries
 *     summary: Toggle beneficiary status
 *     description: Toggle a beneficiary's active status.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: bid
 *         required: true
 *         schema:
 *           type: integer
 *         example: 12345
 *     responses:
 *       200:
 *         description: Beneficiary status toggled successfully.
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Not Found.
 */
router.patch(
    "/toggle-status/:bid",
    protectRoute,
    validateRequest({ params: IdSchema }),
    toggleBeneficiaryStatus,
);

/**
 * @swagger
 * /api/beneficiaries/{bid}:
 *   delete:
 *     tags:
 *       - Beneficiaries
 *     summary: Remove a beneficiary
 *     description: Remove a beneficiary from the system.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: bid
 *         required: true
 *         schema:
 *           type: integer
 *         example: 12345
 *     responses:
 *       200:
 *         description: Beneficiary removed successfully.
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Not Found.
 */
router.delete("/:bid", protectRoute, validateRequest({ params: IdSchema }), removeBeneficiary);

export default router;
