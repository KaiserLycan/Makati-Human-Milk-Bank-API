import express from "express";
import { getAuditByID, queryAuditLogs } from "../controllers/audit.controllers.js";
import { protectRoute } from "../middleware/protectRoute.js";
import { authorize } from "../middleware/authorize.js";
import { validate } from "node-cron";
import { validateRequest } from "../middleware/validate.js";
import { queryAuditSchemas } from "../schemas/audit.schemas.js";
import { IdSchema } from "../schemas/id.schemas.js";

const router = express.Router();

router.get(
    "/",
    protectRoute,
    authorize,
    validateRequest({
        query: queryAuditSchemas,
    }),
    queryAuditLogs,
);

router.get(
    "/:log_id",
    protectRoute,
    authorize,
    validateRequest({
        params: IdSchema,
    }),
    getAuditByID,
);

export default router;
