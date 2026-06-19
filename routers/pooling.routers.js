import express from "express";
import {
    queryMilkPools,
    viewMilkPool,
    createMilkPool,
    updateMilkPool,
    deleteMilkPool,
    updateQATStatus,
    updateMilkPoolStatus,
} from "../controllers/pooling.controllers.js";
import { protectRoute } from "../middleware/protectRoute.js";
import { validateRequest } from "../middleware/validate.js";
import {
    milkPoolSchema,
    milkPoolQuerySchema,
    updateQATStatusSchema,
    updateMilkPoolStatusSchema,
} from "../schemas/poolMilk.schemas.js";
import { IdSchema } from "../schemas/id.schemas.js";

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     MilkPool:
 *       type: object
 *       properties:
 *         collections:
 *           type: array
 *           items:
 *             type: integer
 *           example: [1, 2, 3]
 *         actual_volume:
 *           type: integer
 *           example: 500
 *         remarks:
 *           type: string
 *           example: "Pooled from three collections"
 *     UpdateQATStatus:
 *       type: object
 *       properties:
 *         qat_status:
 *           type: string
 *           enum: [pending, pass, fail]
 *           example: "pass"
 *     UpdateMilkPoolStatus:
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
 * /api/pooling:
 *   get:
 *     tags:
 *       - Pooling
 *     summary: Query milk pools
 *     description: Retrieve a list of milk pools with optional filtering and pagination.
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
 *     responses:
 *       200:
 *         description: A list of milk pools.
 *       401:
 *         description: Unauthorized.
 */
router.get("/", protectRoute, validateRequest({ query: milkPoolQuerySchema }), queryMilkPools);

/**
 * @swagger
 * /api/pooling/{pid}:
 *   get:
 *     tags:
 *       - Pooling
 *     summary: View milk pool
 *     description: Retrieve a single milk pool by its ID.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: pid
 *         required: true
 *         schema:
 *           type: string
 *         example: "12345"
 *     responses:
 *       200:
 *         description: The milk pool.
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Not Found.
 */
router.get("/:pid", protectRoute, validateRequest({ params: IdSchema }), viewMilkPool);

/**
 * @swagger
 * /api/pooling:
 *   post:
 *     tags:
 *       - Pooling
 *     summary: Create milk pool
 *     description: Create a new milk pool.
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MilkPool'
 *     responses:
 *       201:
 *         description: Milk pool created successfully.
 *       400:
 *         description: Bad Request.
 *       401:
 *         description: Unauthorized.
 */
router.post("/", protectRoute, validateRequest({ body: milkPoolSchema }), createMilkPool);

/**
 * @swagger
 * /api/pooling/{pid}:
 *   put:
 *     tags:
 *       - Pooling
 *     summary: Update milk pool
 *     description: Update a milk pool's information.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: pid
 *         required: true
 *         schema:
 *           type: string
 *         example: "12345"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MilkPool'
 *     responses:
 *       200:
 *         description: Milk pool updated successfully.
 *       400:
 *         description: Bad Request.
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Not Found.
 */
router.put(
    "/:pid",
    protectRoute,
    validateRequest({ body: milkPoolSchema, params: IdSchema }),
    updateMilkPool,
);

/**
 * @swagger
 * /api/pooling/{pid}:
 *   delete:
 *     tags:
 *       - Pooling
 *     summary: Delete milk pool
 *     description: Delete a milk pool.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: pid
 *         required: true
 *         schema:
 *           type: string
 *         example: "12345"
 *     responses:
 *       200:
 *         description: Milk pool deleted successfully.
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Not Found.
 */
router.delete("/:pid", protectRoute, validateRequest({ params: IdSchema }), deleteMilkPool);

/**
 * @swagger
 * /api/pooling/{pid}/qat-status:
 *   patch:
 *     tags:
 *       - Pooling
 *     summary: Update QAT status
 *     description: Update the Quality Assurance Test status of a milk pool.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: pid
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
    "/:pid/qat-status",
    protectRoute,
    validateRequest({ body: updateQATStatusSchema, params: IdSchema }),
    updateQATStatus,
);

/**
 * @swagger
 * /api/pooling/{pid}/milk-status:
 *   patch:
 *     tags:
 *       - Pooling
 *     summary: Update milk pool status
 *     description: Update the status of the milk in a milk pool.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: pid
 *         required: true
 *         schema:
 *           type: string
 *         example: "12345"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateMilkPoolStatus'
 *     responses:
 *       200:
 *         description: Milk pool status updated successfully.
 *       400:
 *         description: Bad Request.
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Not Found.
 */
router.patch(
    "/:pid/milk-status",
    protectRoute,
    validateRequest({ body: updateMilkPoolStatusSchema, params: IdSchema }),
    updateMilkPoolStatus,
);

export default router;
