import { Router } from "express";
import { ProtectRoute } from "../middleware/auth.middleware.js";
import { GetStaffNotifications, MarkNotificationAsRead } from "../service/notification.service.js";
import { prisma } from "../db/db.ts";

const router = Router();

router.get("/", ProtectRoute, async (req, res) => {
    try {
        const { is_read } = req.query;
        const user_id = req.user.user_id;
        
        const where = { recipient_id: user_id };
        if (is_read !== undefined) {
            where.is_read = is_read === "true";
        }

        const notifications = await prisma.notification.findMany({
            where,
            orderBy: { created_at: "desc" }
        });

        return res.status(200).json(notifications);
    } catch (error) {
        console.log("Error fetching notifications:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

router.patch("/:nid/read", ProtectRoute, async (req, res) => {
    try {
        const { nid } = req.params;
        
        const notification = await prisma.notification.update({
            where: { nid: parseInt(nid) },
            data: { is_read: true, read_at: new Date() }
        });

        return res.status(200).json(notification);
    } catch (error) {
        if (error.code === "P2025") return res.status(404).json({ error: "Notification not found." });
        console.log("Error marking notification as read:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

export default router;