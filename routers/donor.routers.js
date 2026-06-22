import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import {
    removeDonor,
    viewDonorProfile,
    queryDonors,
    registerDonor,
    updateDonorInformation,
    approveDonor,
    rejectDonor,
    toggleDonorStatus,
} from "../controllers/donor.controllers.js";
import { validateRequest } from "../middleware/validate.js";
import { donorQuerySchema, donorSchemas } from "../schemas/donor.schemas.js";
import { uploadSingleImage } from "../middleware/upload.js";
import { parseFormDataJson } from "../middleware/parseFormatData.js";
import { IdSchema } from "../schemas/id.schemas.js";
import { strictLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Donor:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           example: "Jane Doe"
 *         email:
 *           type: string
 *           format: email
 *           example: "jane.doe@example.com"
 *         phone:
 *           type: string
 *           example: "+1234567890"
 *         birth_date:
 *           type: string
 *           format: date
 *           example: "1990-01-01"
 *         profile:
 *           type: object
 *           properties:
 *             personal_information:
 *               type: object
 *               properties:
 *                 profile_image_url:
 *                   type: string
 *                   format: url
 *                   example: "http://example.com/profile.jpg"
 *                 occupation:
 *                   type: string
 *                   example: "Software Engineer"
 *                 marital_status:
 *                   type: string
 *                   example: "Single"
 *                 home_address:
 *                   type: string
 *                   example: "123 Main St, Anytown, USA"
 *             traveling_information:
 *               type: object
 *               properties:
 *                 travelled_recently:
 *                   type: string
 *                   enum: [yes, no]
 *                   example: "no"
 *                 country_visited:
 *                   type: string
 *                   example: "Canada"
 *                 purpose:
 *                   type: string
 *                   example: "Vacation"
 *             donation_information:
 *               type: object
 *               properties:
 *                 reason:
 *                   type: string
 *                   example: "To help babies in need"
 *                 spouse_consent:
 *                   type: string
 *                   enum: [yes, no]
 *                   example: "yes"
 *                 previously_donated:
 *                   type: string
 *                   enum: [yes, no]
 *                   example: "no"
 *                 last_donation:
 *                   type: string
 *                   format: date
 *                   example: "2023-12-01"
 *                 place_donated:
 *                   type: string
 *                   example: "General Hospital"
 *                 reason_for_stopping:
 *                   type: string
 *                   example: "Moved to a new city"
 *             medical_information:
 *               type: object
 *               properties:
 *                 infectious_medical_illness:
 *                   type: object
 *                   properties:
 *                     tuberculosis: { type: string, enum: [yes, no], example: "no" }
 *                     hepatitis_b: { type: string, enum: [yes, no], example: "no" }
 *                     mastitis: { type: string, enum: [yes, no], example: "no" }
 *                     syphilis: { type: string, enum: [yes, no], example: "no" }
 *                     herpes: { type: string, enum: [yes, no], example: "no" }
 *                     std: { type: string, enum: [yes, no], example: "no" }
 *                 substance_user_habits:
 *                   type: object
 *                   properties:
 *                     consumed_alcohol: { type: string, enum: [yes, no], example: "no" }
 *                     smoke: { type: string, enum: [yes, no], example: "no" }
 *                     illegal_drugs: { type: string, enum: [yes, no], example: "no" }
 *                     intravenous_drug_use: { type: string, enum: [yes, no], example: "no" }
 *                 diet_supplement_tracking:
 *                   type: object
 *                   properties:
 *                     vegetarian: { type: string, enum: [yes, no], example: "no" }
 *                     multivitamins: { type: string, enum: [yes, no], example: "yes" }
 *                     herbal_drugs: { type: string, enum: [yes, no], example: "no" }
 *                 blood_exposure_transfusion:
 *                   type: object
 *                   properties:
 *                     received_blood: { type: string, enum: [yes, no], example: "no" }
 *                     needle_contact: { type: string, enum: [yes, no], example: "no" }
 *                     repeated_blood_transfusion: { type: string, enum: [yes, no], example: "no" }
 *                 surgical_specialized_medical_history:
 *                   type: object
 *                   properties:
 *                     hormone_control: { type: string, enum: [yes, no], example: "no" }
 *                     breast_surgery: { type: string, enum: [yes, no], example: "no" }
 *                     breast_implant: { type: string, enum: [yes, no], example: "no" }
 *                 exposure_behavior:
 *                   type: object
 *                   properties:
 *                     tattoos: { type: string, enum: [yes, no], example: "no" }
 *                     polygamy: { type: string, enum: [yes, no], example: "no" }
 *                     std: { type: string, enum: [yes, no], example: "no" }
 */

/**
 * @swagger
 * /api/donors:
 *   get:
 *     tags:
 *       - Donors
 *     summary: Query donors
 *     description: Retrieve a list of donors with optional filtering and pagination.
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
 *         example: "Jane"
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
 *         description: A list of donors.
 *       401:
 *         description: Unauthorized.
 */
router.get("/", protectRoute, validateRequest({ query: donorQuerySchema }), queryDonors);

/**
 * @swagger
 * /api/donors/{dtn}:
 *   get:
 *     tags:
 *       - Donors
 *     summary: View donor profile
 *     description: Retrieve a single donor's profile by their donor tracking number.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: dtn
 *         required: true
 *         schema:
 *           type: integer
 *         example: 12345
 *     responses:
 *       200:
 *         description: The donor's profile.
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Not Found.
 */
router.get("/:dtn", protectRoute, validateRequest({ params: IdSchema }), viewDonorProfile);

/**
 * @swagger
 * /api/donors/register:
 *   post:
 *     tags:
 *       - Donors
 *     summary: Register a new donor
 *     description: Register a new donor with their profile information.
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *               json:
 *                 type: string
 *                 example: '{"name":"Jane Doe","email":"jane.doe@example.com","phone":"+1234567890","birth_date":"1990-01-01","profile":{"personal_information":{"occupation":"Software Engineer","marital_status":"Single","home_address":"123 Main St, Anytown, USA"},"traveling_information":{"travelled_recently":"no"},"donation_information":{"reason":"To help babies in need","spouse_consent":"yes","previously_donated":"no"},"medical_information":{"infectious_medical_illness":{},"substance_user_habits":{},"diet_supplement_tracking":{},"blood_exposure_transfusion":{},"surgical_specialized_medical_history":{},"exposure_behavior":{}}}}'
 *     responses:
 *       201:
 *         description: Donor registered successfully.
 *       400:
 *         description: Bad Request.
 *       401:
 *         description: Unauthorized.
 */
router.post(
    "/register",
    protectRoute,
    strictLimiter,
    uploadSingleImage,
    parseFormDataJson,
    validateRequest({ body: donorSchemas }),
    registerDonor,
);

/**
 * @swagger
 * /api/donors/public-register:
 *   post:
 *     tags:
 *       - Donors
 *     summary: Publicly register a new donor
 *     description: Publicly register a new donor with their profile information.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *               json:
 *                 type: string
 *                 example: '{"name":"Jane Doe","email":"jane.doe@example.com","phone":"+1234567890","birth_date":"1990-01-01","profile":{"personal_information":{"occupation":"Software Engineer","marital_status":"Single","home_address":"123 Main St, Anytown, USA"},"traveling_information":{"travelled_recently":"no"},"donation_information":{"reason":"To help babies in need","spouse_consent":"yes","previously_donated":"no"},"medical_information":{"infectious_medical_illness":{},"substance_user_habits":{},"diet_supplement_tracking":{},"blood_exposure_transfusion":{},"surgical_specialized_medical_history":{},"exposure_behavior":{}}}}'
 *     responses:
 *       201:
 *         description: Donor registered successfully.
 *       400:
 *         description: Bad Request.
 */
router.post(
    "/public-register",
    strictLimiter,
    uploadSingleImage,
    parseFormDataJson,
    validateRequest({ body: donorSchemas }),
    registerDonor,
);

/**
 * @swagger
 * /api/donors/{dtn}:
 *   put:
 *     tags:
 *       - Donors
 *     summary: Update donor information
 *     description: Update a donor's profile information.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: dtn
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
 *               image:
 *                 type: string
 *                 format: binary
 *               json:
 *                 type: string
 *                 example: '{"name":"Jane Doe","email":"jane.doe@example.com","phone":"+1234567890","birth_date":"1990-01-01","profile":{"personal_information":{"occupation":"Software Engineer","marital_status":"Single","home_address":"123 Main St, Anytown, USA"},"traveling_information":{"travelled_recently":"no"},"donation_information":{"reason":"To help babies in need","spouse_consent":"yes","previously_donated":"no"},"medical_information":{"infectious_medical_illness":{},"substance_user_habits":{},"diet_supplement_tracking":{},"blood_exposure_transfusion":{},"surgical_specialized_medical_history":{},"exposure_behavior":{}}}}'
 *     responses:
 *       200:
 *         description: Donor information updated successfully.
 *       400:
 *         description: Bad Request.
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Not Found.
 */
router.put(
    "/:dtn",
    protectRoute,
    uploadSingleImage,
    parseFormDataJson,
    validateRequest({ body: donorSchemas, params: IdSchema }),
    updateDonorInformation,
);

/**
 * @swagger
 * /api/donors/approve/{dtn}:
 *   patch:
 *     tags:
 *       - Donors
 *     summary: Approve a donor
 *     description: Approve a donor's registration.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: dtn
 *         required: true
 *         schema:
 *           type: integer
 *         example: 12345
 *     responses:
 *       200:
 *         description: Donor approved successfully.
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Not Found.
 */
router.patch("/approve/:dtn", protectRoute, validateRequest({ params: IdSchema }), approveDonor);

/**
 * @swagger
 * /api/donors/reject/{dtn}:
 *   patch:
 *     tags:
 *       - Donors
 *     summary: Reject a donor
 *     description: Reject a donor's registration.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: dtn
 *         required: true
 *         schema:
 *           type: integer
 *         example: 12345
 *     responses:
 *       200:
 *         description: Donor rejected successfully.
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Not Found.
 */
router.patch("/reject/:dtn", protectRoute, validateRequest({ params: IdSchema }), rejectDonor);

/**
 * @swagger
 * /api/donors/toggle-status/{dtn}:
 *   patch:
 *     tags:
 *       - Donors
 *     summary: Toggle donor status
 *     description: Toggle a donor's active status.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: dtn
 *         required: true
 *         schema:
 *           type: integer
 *         example: 12345
 *     responses:
 *       200:
 *         description: Donor status toggled successfully.
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Not Found.
 */
router.patch(
    "/toggle-status/:dtn",
    protectRoute,
    validateRequest({ params: IdSchema }),
    toggleDonorStatus,
);

/**
 * @swagger
 * /api/donors/{dtn}:
 *   delete:
 *     tags:
 *       - Donors
 *     summary: Remove a donor
 *     description: Remove a donor from the system.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: dtn
 *         required: true
 *         schema:
 *           type: integer
 *         example: 12345
 *     responses:
 *       200:
 *         description: Donor removed successfully.
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Not Found.
 */
router.delete("/:dtn", protectRoute, validateRequest({ params: IdSchema }), removeDonor);

export default router;
