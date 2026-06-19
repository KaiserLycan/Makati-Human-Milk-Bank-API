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

router.get("/", protectRoute, validateRequest({ query: collectionQuerySchema }), queryCollections);

router.get("/:ctn", protectRoute, validateRequest({ params: IdSchema }), viewCollection);

router.post("/", protectRoute, validateRequest({ body: collectionSchema }), logCollection);

router.put(
    "/:ctn",
    protectRoute,
    validateRequest({ body: collectionSchema, params: IdSchema }),
    updateCollection,
);

router.delete("/:ctn", protectRoute, validateRequest({ params: IdSchema }), deleteCollection);

router.patch(
    "/:ctn/milk-status",
    protectRoute,
    validateRequest({ body: updateMilkStatusSchema, params: IdSchema }),
    updateMilkStatus,
);

router.patch(
    "/:ctn/qat-status",
    protectRoute,
    validateRequest({ body: updateQATStatusSchema, params: IdSchema }),
    updateQATStatus,
);

export default router;
