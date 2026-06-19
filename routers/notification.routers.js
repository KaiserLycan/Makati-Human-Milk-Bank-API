import { Router } from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import {
    GetNotifications,
    MarkNotificationRead,
    triggerExpirationCheck,
} from "../controllers/notification.controllers.js";

const router = Router();

router.get("/", protectRoute, GetNotifications);

router.patch("/:nid/read", protectRoute, MarkNotificationRead);

router.post("/trigger-expiration", protectRoute, triggerExpirationCheck);

export default router;
