import express from "express";
import { protectRoute } from "../../middleware/protectRoute.js";
import { authorize } from "../../middleware/authorize.js";
import { CreateMilkPool, UpdatePoolQAT } from "./pooling.controller.js";

const router = express.Router();

router.post("/create", protectRoute, authorize, CreateMilkPool);

router.patch("/:pid/qat", protectRoute, authorize, UpdatePoolQAT);

export default router;
