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

router.get("/", ProtectRoute, GetCollections);
/**
 * @openapi
 * /api/collections/milky-way:
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
 * @openapi
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
 * @openapi
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
 * @openapi
 * /api/collections/walk-in:
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

router.put("/:ctn", ProtectRoute, UpdateCollection);
router.delete("/:ctn", ProtectRoute, DeleteCollection);
router.patch("/:ctn/milk-status", ProtectRoute, PatchMilkStatus);
router.patch("/:ctn/qat-status", ProtectRoute, PatchQATStatus);
export default router;