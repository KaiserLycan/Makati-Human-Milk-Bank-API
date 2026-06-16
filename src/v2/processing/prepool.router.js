import express from "express";
import { UpdateRawMilkQAT, LogPrePoolIncident } from "./prepool.controller.js";
import { protectRoute } from "../../middleware/protectRoute.js";

const router = express.Router();

router.patch("/raw-milk/:ctn/qat", protectRoute, UpdateRawMilkQAT);

router.patch("/raw-milk/:ctn/incident", protectRoute, LogPrePoolIncident);

export default router;
