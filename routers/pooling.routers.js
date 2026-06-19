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

router.get("/", protectRoute, validateRequest({ query: milkPoolQuerySchema }), queryMilkPools);

router.get("/:pid", protectRoute, validateRequest({ params: IdSchema }), viewMilkPool);

router.post("/", protectRoute, validateRequest({ body: milkPoolSchema }), createMilkPool);

router.put(
    "/:pid",
    protectRoute,
    validateRequest({ body: milkPoolSchema, params: IdSchema }),
    updateMilkPool,
);

router.delete("/:pid", protectRoute, validateRequest({ params: IdSchema }), deleteMilkPool);

router.patch(
    "/:pid/qat-status",
    protectRoute,
    validateRequest({ body: updateQATStatusSchema, params: IdSchema }),
    updateQATStatus,
);

router.patch(
    "/:pid/milk-status",
    protectRoute,
    validateRequest({ body: updateMilkPoolStatusSchema, params: IdSchema }),
    updateMilkPoolStatus,
);

export default router;
