import express from "express";
import { ProtectRoute } from "../middleware/auth.middleware.js";
import { LogPasteurizationBatch, ReportPasteurizationIncident, 
    UpdateMBTStatus } from "../controllers/pasteurization.controller.js";


const router = express.Router();

router.post("/batch", ProtectRoute, LogPasteurizationBatch);
router.patch("/:btl_id/incident", ProtectRoute, ReportPasteurizationIncident);
router.patch("/:btl_id/mbt", ProtectRoute, UpdateMBTStatus);
export default router;