import express from "express";
import { protectRoute } from "../../middleware/protectRoute.js";
import {
    LogPasteurizationBatch,
    ReportPasteurizationIncident,
    UpdateMBTStatus,
} from "./pasteurization.controller.js";

const router = express.Router();

router.post("/batch", protectRoute, LogPasteurizationBatch);

router.patch("/:btl_id/incident", protectRoute, ReportPasteurizationIncident);

router.patch("/:btl_id/mbt", protectRoute, UpdateMBTStatus);

export default router;
