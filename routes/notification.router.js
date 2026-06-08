import { Router } from "express";
import { ProtectRoute } from "../middleware/auth.middleware.js";
import { GetNotifications, MarkNotificationRead } from "../controllers/notification.controller.js";

const router = Router();

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Retrieve staff notifications
 *     tags: [Notifications]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: is_read
 *         schema:
 *           type: boolean
 *         description: Filter notifications by read status
 *     responses:
 *       200:
 *         description: A list of notifications
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal Server Error
 */
router.get("/", ProtectRoute, GetNotifications);

/**
 * @swagger
 * /api/notifications/{nid}/read:
 *   patch:
 *     summary: Mark a specific notification as read
 *     tags: [Notifications]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: nid
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the notification
 *     responses:
 *       200:
 *         description: Notification marked as read successfully
 *       400:
 *         description: Invalid notification ID
 *       404:
 *         description: Notification not found
 *       500:
 *         description: Internal Server Error
 */
router.patch("/:nid/read", ProtectRoute, MarkNotificationRead);

export default router;