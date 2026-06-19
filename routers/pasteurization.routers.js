import express from "express";
import {
    queryPasteurizedMilkRecords,
    viewPasteurizedMilk,
    createPasteurizedMilk,
    updatePasteurizedMilk,
    deletePasteurizedMilk,
    updateQATStatus,
    updateMilkStatus,
} from "../controllers/pasteurization.controllers.js";
import { protectRoute } from "../middleware/protectRoute.js";
import { validateRequest } from "../middleware/validate.js";
import {
    pasteurizedMilkSchema,
    pasteurizedMilkQuerySchema,
    updateQATStatusSchema,
    updateMilkStatusSchema,
} from "../schemas/pasteurizedMilk.schemas.js";
import { IdSchema } from "../schemas/id.schemas.js";

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     PasteurizedMilk:
 *       type: object
 *       properties:
 *         pid:
 *           type: integer
 *           example: 12345
 *         batch_number:
 *           type: integer
 *           example: 1
 *         bottle_count:
 *           type: integer
 *           example: 10
 *         volume_per_bottle:
 *           type: integer
 *           example: 100
 *         bottle_type:
 *           type: string
 *           example: "Glass"
 *         pasteurization_date:
 *           type: string
 *           format: date
 *           example: "2024-05-20"
 *     UpdateQATStatus:
 *       type: object
 *       properties:
 *         qat_status:
 *           type: string
 *           enum: [pending, pass, fail]
 *           example: "pass"
 *     UpdateMilkStatus:
 *       type: object
 *       properties:
 *         milk_status:
 *           type: string
 *           enum: [good, contaminated, discarded, expired]
 *           example: "good"
 *         remarks:
 *           type: string
 *           example: "Looks good"
 */

/**
 * @swagger
 * /api/pasteurization:
 *   get:
 *     tags:
 *       - Pasteurization
 *     summary: Query pasteurized milk records
 *     description: Retrieve a list of pasteurized milk records with optional filtering and pagination.
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
 *         example: "pid"
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
 *         example: "12345"
 *       - in: query
 *         name: milk_status
 *         schema:
 *           type: string
 *           enum: [good, contaminated, discarded, expired]
 *         example: "good"
 *       - in: query
 *         name: qat_status
 *         schema:
 *           type: string
 *           enum: [pending, pass, fail]
 *         example: "pass"
 *       - in: query
 *         name: dispense_status
 *         schema:
 *           type: string
 *           enum: [available, reserved, dispensed]
 *         example: "available"
 *     responses:
 *       200:
 *         description: A list of pasteurized milk records.
 *       401:
 *         description: Unauthorized.
 */
router.get(
    "/",
    protectRoute,
    validateRequest({ query: pasteurizedMilkQuerySchema }),
    queryPasteurizedMilkRecords,
);

/**
 * @swagger
 * /api/pasteurization/{btl_id}:
 *   get:
 *     tags:
 *       - Pasteurization
 *     summary: View pasteurized milk
 *     description: Retrieve a single pasteurized milk record by its bottle ID.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: btl_id
 *         required: true
 *         schema:
 *           type: string
 *         example: "12345"
 *     responses:
 *       200:
 *         description: The pasteurized milk record.
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Not Found.
 */
router.get("/:btl_id", protectRoute, validateRequest({ params: IdSchema }), viewPasteurizedMilk);

/**
 * @swagger
 * /api/pasteurization:
 *   post:
 *     tags:
 *       - Pasteurization
 *     summary: Create pasteurized milk record
 *     description: Create a new pasteurized milk record.
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PasteurizedMilk'
 *     responses:
 *       201:
 *         description: Pasteurized milk record created successfully.
 *       400:
 *         description: Bad Request.
 *       401:
 *         description: Unauthorized.
 */
router.post(
    "/",
    protectRoute,
    validateRequest({ body: pasteurizedMilkSchema }),
    createPasteurizedMilk,
);

/**
 * @swagger
 * /api/pasteurization/{btl_id}:
 *   put:
 *     tags:
 *       - Pasteurization
 *     summary: Update pasteurized milk record
 *     description: Update a pasteurized milk record's information.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: btl_id
 *         required: true
 *         schema:
 *           type: string
 *         example: "12345"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PasteurizedMilk'
 *     responses:
 *       200:
 *         description: Pasteurized milk record updated successfully.
 *       400:
 *         description: Bad Request.
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Not Found.
 */
router.put(
    "/:btl_id",
    protectRoute,
    validateRequest({ body: pasteurizedMilkSchema, params: IdSchema }),
    updatePasteurizedMilk,
);

/**
 * @swagger
 * /api/pasteurization/{btl_id}:
 *   delete:
 *     tags:
 *       - Pasteurization
 *     summary: Delete pasteurized milk record
 *     description: Delete a pasteurized milk record.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: btl_id
 *         required: true
 *         schema:
 *           type: string
 *         example: "12345"
 *     responses:
 *       200:
 *         description: Pasteurized milk record deleted successfully.
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Not Found.
 */
router.delete(
    "/:btl_id",
    protectRoute,
    validateRequest({ params: IdSchema }),
    deletePasteurizedMilk,
);

/**
 * @swagger
 * /api/pasteurization/{btl_id}/qat-status:
 *   patch:
 *     tags:
 *       - Pasteurization
 *     summary: Update QAT status
 *     description: Update the Quality Assurance Test status of a pasteurized milk record.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: btl_id
 *         required: true
 *         schema:
 *           type: string
 *         example: "12345"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateQATStatus'
 *     responses:
 *       200:
 *         description: QAT status updated successfully.
 *       400:
 *         description: Bad Request.
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Not Found.
 */
router.patch(
    "/:btl_id/qat-status",
    protectRoute,
    validateRequest({ body: updateQATStatusSchema, params: IdSchema }),
    updateQATStatus,
);

/**
 * @swagger
 * /api/pasteurization/{btl_id}/milk-status:
 *   patch:
 *     tags:
 *       - Pasteurization
 *     summary: Update milk status
 *     description: Update the status of the milk in a pasteurized milk record.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: btl_id
 *         required: true
 *         schema:
 *           type: string
 *         example: "12345"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateMilkStatus'
 *     responses:
 *       200:
 *         description: Milk status updated successfully.
 *       400:
 *         description: Bad Request.
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Not Found.
 */
router.patch(
    "/:btl_id/milk-status",
    protectRoute,
    validateRequest({ body: updateMilkStatusSchema, params: IdSchema }),
    updateMilkStatus,
);

export default router;
