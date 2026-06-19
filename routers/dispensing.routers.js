import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import { GetDispensingQueue, DispenseMilk } from "../controllers/dispensing.controllers.js";

const router = express.Router();

router.get("/", protectRoute, GetDispensingQueue);

router.patch("/:rid/dispense", protectRoute, DispenseMilk);

export default router;
