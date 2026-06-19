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

router.get(
    "/",
    protectRoute,
    validateRequest({ query: pasteurizedMilkQuerySchema }),
    queryPasteurizedMilkRecords,
);
router.get("/:btl_id", protectRoute, validateRequest({ params: IdSchema }), viewPasteurizedMilk);
router.post(
    "/",
    protectRoute,
    validateRequest({ body: pasteurizedMilkSchema }),
    createPasteurizedMilk,
);
router.put(
    "/:btl_id",
    protectRoute,
    validateRequest({ body: pasteurizedMilkSchema, params: IdSchema }),
    updatePasteurizedMilk,
);
router.delete(
    "/:btl_id",
    protectRoute,
    validateRequest({ params: IdSchema }),
    deletePasteurizedMilk,
);
router.patch(
    "/:btl_id/qat-status",
    protectRoute,
    validateRequest({ body: updateQATStatusSchema, params: IdSchema }),
    updateQATStatus,
);
router.patch(
    "/:btl_id/milk-status",
    protectRoute,
    validateRequest({ body: updateMilkStatusSchema, params: IdSchema }),
    updateMilkStatus,
);

export default router;
