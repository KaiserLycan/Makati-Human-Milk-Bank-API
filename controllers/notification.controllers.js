import { prisma } from "../library/db/db.ts";
import { checkExpirationDate } from "../services/expiration.services.js";
import { APIResponse } from "../library/classes/APIResponse.js";

export const GetNotifications = async (req, res) => {
    try {
        const user_id = req.user?.user_id;
        if (!user_id) {
            return res.status(401).json({ error: "Unauthorized: User not authenticated" });
        }

        const { is_read } = req.query;

        const where = { recipient_id: user_id };
        if (is_read !== undefined) {
            where.is_read = is_read === "true";
        }

        const notifications = await prisma.notification.findMany({
            where,
            orderBy: { created_at: "desc" },
        });

        return res.status(200).json(notifications || []);
    } catch (error) {
        console.error("Error fetching 11 notifications:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

export const MarkNotificationRead = async (req, res) => {
    try {
        const { nid } = req.params;
        const user_id = req.user?.user_id;

        if (!nid) return res.status(400).json({ error: "Notification ID is required" });
        if (!user_id) return res.status(401).json({ error: "Unauthorized" });

        const notificationId = parseInt(nid);
        if (isNaN(notificationId))
            return res.status(400).json({ error: "Notification ID must be a valid number" });

        const notification = await prisma.notification.update({
            where: {
                nid: notificationId,
                recipient_id: user_id,
            },
            data: { is_read: true, read_at: new Date() },
        });

        return res.status(200).json(notification);
    } catch (error) {
        if (error.code === "P2025") {
            return res.status(404).json({ error: "Notification not found or access denied" });
        }
        console.error("Error marking notification as read:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

export const triggerExpirationCheck = async (req, res) => {
    await checkExpirationDate();
    return res.status(200).json(new APIResponse(200, null, "Checked expiration"));
};
