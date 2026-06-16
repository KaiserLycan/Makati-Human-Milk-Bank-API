import express from "express";
import { protectRoute } from "../../middleware/protectRoute.js";
import { GetRequests, GetRequest, CreateRequest, CancelRequest } from "./reservation.controller.js";

const router = express.Router();

router.get("/", protectRoute, GetRequests);

router.get("/:rid", protectRoute, GetRequest);

router.post("/", protectRoute, CreateRequest);

router.patch("/:rid/cancel", protectRoute, CancelRequest);

export default router;
