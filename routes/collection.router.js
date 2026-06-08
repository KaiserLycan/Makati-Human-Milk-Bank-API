import express from "express";
import { GetCollections } from "../controllers/collection.controller.js";
import { ProtectRoute } from "../middleware/auth.middleware.js";
import { 
    LogMilkyWayCollection, 
    LogSupsupTodoCollection, 
    LogMomsActCollection, 
    LogWalkInCollection,
    UpdateCollection,
    DeleteCollection,
    PatchMilkStatus,
    PatchQATStatus
} from "../controllers/collection.controller.js"

const router = express.Router();

/**
 * @swagger
 * /api/collections:
 *   get:
 *     summary: Get all raw milk collections
 *     tags:
 *       - Collection
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of raw milk collections retrieved successfully.
 *       500:
 *         description: Internal Server Error.
 */
router.get("/", ProtectRoute, GetCollections);

/**
 * @swagger
 * /api/collections/milkyway:
 *   post:
 *     summary: Log a Milky Way hospital collection
 *     tags:
 *       - Collection
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - dtn
 *               - volume_ml
 *               - expiration_date
 *               - hospital
 *             properties:
 *               dtn:
 *                 type: integer
 *               volume_ml:
 *                 type: number
 *               expiration_date:
 *                 type: string
 *                 format: date
 *               pickup_date:
 *                 type: string
 *                 format: date
 *               hospital:
 *                 type: string
 *               remarks:
 *                 type: string
 *     responses:
 *       201:
 *         description: Milky Way collection logged successfully.
 *       400:
 *         description: Missing hospital name.
 */
router.post("/milkyway", ProtectRoute, LogMilkyWayCollection);

/**
 * @swagger
 * /api/collections/supsup-todo:
 *   post:
 *     summary: Log a SUPSUP TODO community collection
 *     tags:
 *       - Collection
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - dtn
 *               - volume_ml
 *               - expiration_date
 *               - health_center
 *             properties:
 *               dtn:
 *                 type: integer
 *               volume_ml:
 *                 type: number
 *               expiration_date:
 *                 type: string
 *                 format: date
 *               health_center:
 *                 type: string
 *               remarks:
 *                 type: string
 *     responses:
 *       201:
 *         description: SUPSUP TODO collection logged successfully.
 *       400:
 *         description: Missing health center name.
 */
router.post("/supsup-todo", ProtectRoute, LogSupsupTodoCollection);

/**
 * @swagger
 * /api/collections/moms-act:
 *   post:
 *     summary: Log a Moms ACT remote collection
 *     tags:
 *       - Collection
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - dtn
 *               - volume_ml
 *               - expiration_date
 *             properties:
 *               dtn:
 *                 type: integer
 *               volume_ml:
 *                 type: number
 *               expiration_date:
 *                 type: string
 *                 format: date
 *               pickup_date:
 *                 type: string
 *                 format: date
 *               remarks:
 *                 type: string
 *     responses:
 *       201:
 *         description: Moms ACT collection logged successfully.
 */
router.post("/moms-act", ProtectRoute, LogMomsActCollection);

/**
 * @swagger
 * /api/collections/walkin:
 *   post:
 *     summary: Log a walk-in milk collection
 *     tags:
 *       - Collection
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - dtn
 *               - volume_ml
 *               - expiration_date
 *             properties:
 *               dtn:
 *                 type: integer
 *               volume_ml:
 *                 type: number
 *               expiration_date:
 *                 type: string
 *                 format: date
 *               remarks:
 *                 type: string
 *     responses:
 *       201:
 *         description: Walk-In collection logged successfully.
 *       400:
 *         description: Volume validation failed (session or daily limit).
 */
router.post("/walkin", ProtectRoute, LogWalkInCollection);

/**
 * @swagger
 * /api/collections/{ctn}:
 *   put:
 *     summary: Update a raw milk collection record
 *     tags:
 *       - Collection
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ctn
 *         required: true
 *         schema:
 *           type: integer
 *         description: The Collection Tracking Number (CTN) of the record to update.
 *     requestBody:
 *       description: Optional fields to update for the collection.
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               volume_ml:
 *                 type: number
 *               expiration_date:
 *                 type: string
 *                 format: date
 *               pickup_date:
 *                 type: string
 *                 format: date
 *               hospital:
 *                 type: string
 *               health_center:
 *                 type: string
 *               remarks:
 *                 type: string
 *     responses:
 *       200:
 *         description: Collection updated successfully.
 *       404:
 *         description: Collection record not found.
 *       500:
 *         description: Internal Server Error.
 */
router.put("/:ctn", ProtectRoute, UpdateCollection);

/**
 * @swagger
 * /api/collections/{ctn}:
 *   delete:
 *     summary: Delete a raw milk collection record
 *     tags:
 *       - Collection
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ctn
 *         required: true
 *         schema:
 *           type: integer
 *         description: The Collection Tracking Number (CTN) of the record to delete.
 *     responses:
 *       200:
 *         description: Collection record deleted successfully.
 *       404:
 *         description: Collection record not found.
 *       500:
 *         description: Internal Server Error.
 */
router.delete("/:ctn", ProtectRoute, DeleteCollection);

/**
 * @swagger
 * /api/collections/{ctn}/milk-status:
 *   patch:
 *     summary: Update the milk status of a collection
 *     tags:
 *       - Collection
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ctn
 *         required: true
 *         schema:
 *           type: integer
 *         description: The Collection Tracking Number (CTN) of the record to update.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - milk_status
 *             properties:
 *               milk_status:
 *                 type: string
 *                 enum: [good, contaminated, discarded, expired]
 *     responses:
 *       200:
 *         description: Milk status updated successfully.
 *       400:
 *         description: Invalid milk status provided.
 *       404:
 *         description: Collection record not found.
 *       500:
 *         description: Internal Server Error.
 */
router.patch("/:ctn/milk-status", ProtectRoute, PatchMilkStatus);

/**
 * @swagger
 * /api/collections/{ctn}/qat-status:
 *   patch:
 *     summary: Update the QAT status of a collection
 *     tags:
 *       - Collection
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ctn
 *         required: true
 *         schema:
 *           type: integer
 *         description: The Collection Tracking Number (CTN) of the record to update.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - qat_status
 *             properties:
 *               qat_status:
 *                 type: string
 *                 enum: [pending, pass, fail]
 *     responses:
 *       200:
 *         description: QAT status updated successfully.
 *       400:
 *         description: Invalid QAT status provided.
 *       404:
 *         description: Collection record not found.
 *       500:
 *         description: Internal Server Error.
 */
router.patch("/:ctn/qat-status", ProtectRoute, PatchQATStatus);

export default router;