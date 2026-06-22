import { Router } from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import {
    getNotifications,
    readNotification,
    triggerExpirationCheck,
} from "../controllers/notification.controllers.js";
import { validateRequest } from "../middleware/validate.js";
import { IdSchema } from "../schemas/id.schemas.js";

const router = Router();

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     tags:
 *       - Notifications
 *     summary: Get notifications
 *     description: Retrieve a list of notifications for the authenticated user.
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: A list of notifications.
 *       401:
 *         description: Unauthorized.
 */
router.get("/", protectRoute, getNotifications);

/**
 * @swagger
 * /api/notifications/{nid}/read:
 *   patch:
 *     tags:
 *       - Notifications
 *     summary: Mark notification as read
 *     description: Mark a specific notification as read.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: nid
 *         required: true
 *         schema:
 *           type: integer
 *         example: 12345
 *     responses:
 *       200:
 *         description: Notification marked as read successfully.
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Not Found.
 */
router.patch(
    "/:nid/read",
    protectRoute,
    validateRequest({
        params: IdSchema,
    }),
    readNotification,
);

/**
 * @swagger
 * /api/notifications/trigger-expiration:
 *   post:
 *     tags:
 *       - Notifications
 *     summary: Trigger expiration check
 *     description: Manually trigger a check for expired milk.
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Expiration check triggered successfully.
 *       401:
 *         description: Unauthorized.
 */
router.post("/trigger-expiration", protectRoute, triggerExpirationCheck);

export default router;
