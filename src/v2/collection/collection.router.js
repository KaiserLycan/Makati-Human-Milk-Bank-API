import express from "express";
import { GetCollections } from "./collection.controller.js";
import { protectRoute } from "../../middleware/protectRoute.js";
import {
    LogMilkyWayCollection,
    LogSupsupTodoCollection,
    LogMomsActCollection,
    LogWalkInCollection,
    UpdateCollection,
    DeleteCollection,
    PatchMilkStatus,
    PatchQATStatus,
} from "./collection.controller.js";

const router = express.Router();

router.get("/", protectRoute, GetCollections);

router.post("/milkyway", protectRoute, LogMilkyWayCollection);

router.post("/supsup-todo", protectRoute, LogSupsupTodoCollection);

router.post("/moms-act", protectRoute, LogMomsActCollection);

router.post("/walkin", protectRoute, LogWalkInCollection);

router.put("/:ctn", protectRoute, UpdateCollection);

router.delete("/:ctn", protectRoute, DeleteCollection);

router.patch("/:ctn/milk-status", protectRoute, PatchMilkStatus);

router.patch("/:ctn/qat-status", protectRoute, PatchQATStatus);

export default router;
