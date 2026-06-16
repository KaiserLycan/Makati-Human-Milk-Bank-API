import express from "express";
import { FetchAuditLogs } from "./auditLog.controller.js";
import { protectRoute } from "../../middleware/protectRoute.js";
import { authorize } from "../../middleware/authorize.js";

const router = express.Router();

router.get("/", protectRoute, authorize, FetchAuditLogs);

export default router;
