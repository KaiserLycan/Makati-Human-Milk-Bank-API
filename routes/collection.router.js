import express from "express";
import { GetCollections } from "../controllers/collection.controller.js";
import { ProtectRoute } from "../middleware/auth.middleware.js";
import { 
    LogMilkyWayCollection, 
    LogSupsupTodoCollection, 
    LogMomsActCollection, 
    LogWalkInCollection 
} from "../controllers/collection.controller.js"

const router = express.Router();

router.get("/", ProtectRoute, GetCollections);
router.post("/milkyway", ProtectRoute, LogMilkyWayCollection);
router.post("/supsup-todo", ProtectRoute, LogSupsupTodoCollection);
router.post("/moms-act", ProtectRoute, LogMomsActCollection);
router.post("/walkin", ProtectRoute, LogWalkInCollection);

export default router;