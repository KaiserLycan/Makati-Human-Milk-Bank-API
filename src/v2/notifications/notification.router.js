import { Router } from "express";
import { protectRoute } from "../../middleware/protectRoute.js";
import { GetNotifications, MarkNotificationRead } from "./notification.controller.js";

const router = Router();

router.get("/", protectRoute, GetNotifications);

router.patch("/:nid/read", protectRoute, MarkNotificationRead);

router.post("/trigger-expiration", protectRoute, async (req, res) => {
    try {
        await runExpirationCheck();
        res.status(200).json({ message: "Expiration check completed successfully." });
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
});

export default router;
