import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import {
    ExportCollectionReport,
    ExportDispensingReport,
    ExportProcessingReport,
} from "../controllers/reports.controllers.js";

const router = express.Router();

router.get("/collection/export", protectRoute, ExportCollectionReport);

router.get("/processing/export", protectRoute, ExportProcessingReport);

router.get("/dispensing/export", protectRoute, ExportDispensingReport);

export default router;
