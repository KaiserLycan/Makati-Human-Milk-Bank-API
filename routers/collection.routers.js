import express from "express";
import {
    queryCollections,
    viewCollection,
    logCollection,
    updateCollection,
    deleteCollection,
    updateMilkStatus,
    updateQATStatus,
} from "../controllers/collection.controllers.js";
import { protectRoute } from "../middleware/protectRoute.js";
import { validateRequest } from "../middleware/validate.js";
import {
    collectionSchema,
    collectionQuerySchema,
    updateMilkStatusSchema,
    updateQATStatusSchema,
} from "../schemas/rawMilk.schemas.js";
import { IdSchema } from "../schemas/id.schemas.js";

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Collection:
 *       type: object
 *       required:
 *         - program
 *         - dtn
 *         - volume_ml
 *         - expiration_date
 *         - collected_by
 *       properties:
 *         program:
 *           type: string
 *           enum: [ST, MA, MW, WI]
 *         dtn:
 *           type: integer
 *         volume_ml:
 *           type: integer
 *         expiration_date:
 *           type: string
 *           format: date
 *         collected_by:
 *           type: string
 *           format: uuid
 *         remarks:
 *           type: string
 *         health_center:
 *           type: string
 *         pickup_date:
 *           type: string
 *           format: date
 *         hospital:
 *           type: string
 *       example:
 *         program: "ST"
 *         dtn: 12345
 *         volume_ml: 150
 *         expiration_date: "2024-12-31"
 *         collected_by: "a1b2c3d4-e5f6-7890-1234-567890abcdef"
 *         remarks: "First collection"
 *         health_center: "Makati Central"
 *     UpdateMilkStatus:
 *       type: object
 *       required:
 *         - milk_status
 *       properties:
 *         milk_status:
 *           type: string
 *           enum: [good, contaminated, discarded, expired]
 *       example:
 *         milk_status: "contaminated"
 *     UpdateQATStatus:
 *       type: object
 *       required:
 *         - qat_status
 *       properties:
 *         qat_status:
 *           type: string
 *           enum: [pending, pass, fail]
 *       example:
 *         qat_status: "pass"
 */

/**
 * @swagger
 * /api/collections:
 *   get:
 *     tags:
 *       - Collection
 *     summary: Query collections
 *     description: Retrieve a list of milk collections with optional filtering and pagination.
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
 *         example: "dtn"
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
 *         name: program
 *         schema:
 *           type: string
 *           enum: [ST, MA, MW, WI]
 *         example: "ST"
 *     responses:
 *       200:
 *         description: A list of milk collections.
 *       401:
 *         description: Unauthorized.
 */
router.get("/", protectRoute, validateRequest({ query: collectionQuerySchema }), queryCollections);

/**
 * @swagger
 * /api/collections/{ctn}:
 *   get:
 *     tags:
 *       - Collection
 *     summary: View collection
 *     description: Retrieve a single milk collection by its container number.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: ctn
 *         required: true
 *         schema:
 *           type: string
 *         example: "12345"
 *     responses:
 *       200:
 *         description: The milk collection.
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Not Found.
 */
router.get("/:ctn", protectRoute, validateRequest({ params: IdSchema }), viewCollection);

/**
 * @swagger
 * /api/collections:
 *   post:
 *     tags:
 *       - Collection
 *     summary: Log a new collection
 *     description: Log a new milk collection.
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Collection'
 *     responses:
 *       201:
 *         description: Collection logged successfully.
 *       400:
 *         description: Bad Request.
 *       401:
 *         description: Unauthorized.
 */
router.post("/", protectRoute, validateRequest({ body: collectionSchema }), logCollection);

/**
 * @swagger
 * /api/collections/{ctn}:
 *   put:
 *     tags:
 *       - Collection
 *     summary: Update collection
 *     description: Update a milk collection's information.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: ctn
 *         required: true
 *         schema:
 *           type: string
 *         example: "12345"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Collection'
 *     responses:
 *       200:
 *         description: Collection updated successfully.
 *       400:
 *         description: Bad Request.
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Not Found.
 */
router.put(
    "/:ctn",
    protectRoute,
    validateRequest({ body: collectionSchema, params: IdSchema }),
    updateCollection,
);

/**
 * @swagger
 * /api/collections/{ctn}:
 *   delete:
 *     tags:
 *       - Collection
 *     summary: Delete collection
 *     description: Delete a milk collection.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: ctn
 *         required: true
 *         schema:
 *           type: string
 *         example: "12345"
 *     responses:
 *       200:
 *         description: Collection deleted successfully.
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Not Found.
 */
router.delete("/:ctn", protectRoute, validateRequest({ params: IdSchema }), deleteCollection);

/**
 * @swagger
 * /api/collections/{ctn}/milk-status:
 *   patch:
 *     tags:
 *       - Collection
 *     summary: Update milk status
 *     description: Update the status of the milk in a collection.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: ctn
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
    "/:ctn/milk-status",
    protectRoute,
    validateRequest({ body: updateMilkStatusSchema, params: IdSchema }),
    updateMilkStatus,
);

/**
 * @swagger
 * /api/collections/{ctn}/qat-status:
 *   patch:
 *     tags:
 *       - Collection
 *     summary: Update QAT status
 *     description: Update the Quality Assurance Test status of a collection.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: ctn
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
    "/:ctn/qat-status",
    protectRoute,
    validateRequest({ body: updateQATStatusSchema, params: IdSchema }),
    updateQATStatus,
);

export default router;
