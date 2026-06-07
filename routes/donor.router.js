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
 *       - cookieAuth: []
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
 *       - cookieAuth: []
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
 *                   email:
 *                     type: string
 *                   phone:
 *                     type: string
 *                   birth_date:
 *                     type: string
 *                     format: date
 *                   profile:
 *                     type: object
 *                     properties:
 *                       personal_information:
 *                         type: object
 *                         properties:
 *                           occupation:
 *                             type: string
 *                           marital_status:
 *                             type: string
 *                           home_address:
 *                             type: string
 *                       traveling_information:
 *                         type: object
 *                         properties:
 *                           traveled_recently:
 *                             type: string
 *                           country_visited:
 *                             type: string
 *                           purpose:
 *                             type: string
 *                       donation_information:
 *                         type: object
 *                         properties:
 *                           reason:
 *                             type: string
 *                           spouse_consent:
 *                             type: string
 *                           previously_donated:
 *                             type: string
 *                           last_donation:
 *                             type: string
 *                             format: date-time
 *                           place_donated:
 *                             type: string
 *                           reason_for_stopping:
 *                             type: string
 *                       medical_information:
 *                         type: object
 *                         properties:
 *                           infectious_medical_illness:
 *                             type: object
 *                             properties:
 *                               tuberculosis:
 *                                 type: string
 *                               hepatitis_b:
 *                                 type: string
 *                               mastitis:
 *                                 type: string
 *                               syphilis:
 *                                 type: string
 *                               herpes:
 *                                 type: string
 *                               std:
 *                                 type: string
 *                           substance_user_habits:
 *                             type: object
 *                             properties:
 *                               consumed_alcohol:
 *                                 type: string
 *                               smoke:
 *                                 type: string
 *                               illegal_drugs:
 *                                 type: string
 *                               intravenous_drug_use:
 *                                 type: string
 *                           diet_supplement_tracking:
 *                             type: object
 *                             properties:
 *                               vegetarian:
 *                                 type: string
 *                               multivitamins:
 *                                 type: string
 *                               herbal_drugs:
 *                                 type: string
 *                           blood_exposure_transfusion:
 *                             type: object
 *                             properties:
 *                               received_blood:
 *                                 type: string
 *                               needle_contact:
 *                                 type: string
 *                               repeated_blood_transfusion:
 *                                 type: string
 *                           surgical_specialized_medical_history:
 *                             type: object
 *                             properties:
 *                               hormone_control:
 *                                 type: string
 *                               breast_surgery:
 *                                 type: string
 *                               breast_implant:
 *                                 type: string
 *                           exposure_behavior:
 *                             type: object
 *                             properties:
 *                               tattoos:
 *                                 type: string
 *                               polygamy:
 *                                 type: string
 *                               std:
 *                                 type: string
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
 *                     type: object
 *                     properties:
 *                       personal_information:
 *                         type: object
 *                         properties:
 *                           occupation:
 *                             type: string
 *                           marital_status:
 *                             type: string
 *                           home_address:
 *                             type: string
 *                       traveling_information:
 *                         type: object
 *                         properties:
 *                           traveled_recently:
 *                             type: string
 *                           country_visited:
 *                             type: string
 *                           purpose:
 *                             type: string
 *                       donation_information:
 *                         type: object
 *                         properties:
 *                           reason:
 *                             type: string
 *                           spouse_consent:
 *                             type: string
 *                           previously_donated:
 *                             type: string
 *                           last_donation:
 *                             type: string
 *                             format: date-time
 *                           place_donated:
 *                             type: string
 *                           reason_for_stopping:
 *                             type: string
 *                       medical_information:
 *                         type: object
 *                         properties:
 *                           infectious_medical_illness:
 *                             type: object
 *                             properties:
 *                               tuberculosis:
 *                                 type: string
 *                               hepatitis_b:
 *                                 type: string
 *                               mastitis:
 *                                 type: string
 *                               syphilis:
 *                                 type: string
 *                               herpes:
 *                                 type: string
 *                               std:
 *                                 type: string
 *                           substance_user_habits:
 *                             type: object
 *                             properties:
 *                               consumed_alcohol:
 *                                 type: string
 *                               smoke:
 *                                 type: string
 *                               illegal_drugs:
 *                                 type: string
 *                               intravenous_drug_use:
 *                                 type: string
 *                           diet_supplement_tracking:
 *                             type: object
 *                             properties:
 *                               vegetarian:
 *                                 type: string
 *                               multivitamins:
 *                                 type: string
 *                               herbal_drugs:
 *                                 type: string
 *                           blood_exposure_transfusion:
 *                             type: object
 *                             properties:
 *                               received_blood:
 *                                 type: string
 *                               needle_contact:
 *                                 type: string
 *                               repeated_blood_transfusion:
 *                                 type: string
 *                           surgical_specialized_medical_history:
 *                             type: object
 *                             properties:
 *                               hormone_control:
 *                                 type: string
 *                               breast_surgery:
 *                                 type: string
 *                               breast_implant:
 *                                 type: string
 *                           exposure_behavior:
 *                             type: object
 *                             properties:
 *                               tattoos:
 *                                 type: string
 *                               polygamy:
 *                                 type: string
 *                               std:
 *                                 type: string
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
 *       - cookieAuth: []
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
 *       - cookieAuth: []
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
 *       - cookieAuth: []
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
 *                     type: object
 *                     properties:
 *                       personal_information:
 *                         type: object
 *                         properties:
 *                           occupation:
 *                             type: string
 *                           marital_status:
 *                             type: string
 *                           home_address:
 *                             type: string
 *                       traveling_information:
 *                         type: object
 *                         properties:
 *                           traveled_recently:
 *                             type: string
 *                           country_visited:
 *                             type: string
 *                           purpose:
 *                             type: string
 *                       donation_information:
 *                         type: object
 *                         properties:
 *                           reason:
 *                             type: string
 *                           spouse_consent:
 *                             type: string
 *                           previously_donated:
 *                             type: string
 *                           last_donation:
 *                             type: string
 *                             format: date-time
 *                           place_donated:
 *                             type: string
 *                           reason_for_stopping:
 *                             type: string
 *                       medical_information:
 *                         type: object
 *                         properties:
 *                           infectious_medical_illness:
 *                             type: object
 *                             properties:
 *                               tuberculosis:
 *                                 type: string
 *                               hepatitis_b:
 *                                 type: string
 *                               mastitis:
 *                                 type: string
 *                               syphilis:
 *                                 type: string
 *                               herpes:
 *                                 type: string
 *                               std:
 *                                 type: string
 *                           substance_user_habits:
 *                             type: object
 *                             properties:
 *                               consumed_alcohol:
 *                                 type: string
 *                               smoke:
 *                                 type: string
 *                               illegal_drugs:
 *                                 type: string
 *                               intravenous_drug_use:
 *                                 type: string
 *                           diet_supplement_tracking:
 *                             type: object
 *                             properties:
 *                               vegetarian:
 *                                 type: string
 *                               multivitamins:
 *                                 type: string
 *                               herbal_drugs:
 *                                 type: string
 *                           blood_exposure_transfusion:
 *                             type: object
 *                             properties:
 *                               received_blood:
 *                                 type: string
 *                               needle_contact:
 *                                 type: string
 *                               repeated_blood_transfusion:
 *                                 type: string
 *                           surgical_specialized_medical_history:
 *                             type: object
 *                             properties:
 *                               hormone_control:
 *                                 type: string
 *                               breast_surgery:
 *                                 type: string
 *                               breast_implant:
 *                                 type: string
 *                           exposure_behavior:
 *                             type: object
 *                             properties:
 *                               tattoos:
 *                                 type: string
 *                               polygamy:
 *                                 type: string
 *                               std:
 *                                 type: string
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