import { checkExpirationDate } from "../services/expiration.services.js";
import { APIResponse } from "../library/classes/APIResponse.js";
import {
    fetchNotificationsByUserId,
    readNotification as readNotificationService,
    unreadNotification as unreadNotificationService,
} from "../services/notification.services.js";

export const getNotifications = async (req, res) => {
    const user_id = req.user.user_id;
    const { is_read } = req.query;
    const notifications = await fetchNotificationsByUserId({ user_id, is_read });
    return res
        .status(200)
        .json(
            new APIResponse(
                200,
                notifications,
                `Successfully retrieved notifications for user ${user_id} `,
            ),
        );
};

export const readNotification = async (req, res) => {
    const { nid } = req.params;
    const { user_id } = req.user;
    const notification = await readNotificationService({ nid, user_id });
    return res
        .status(200)
        .json(new APIResponse(200, notification, `Marked notification (${nid}) as read`));
};

export const unreadNotification = async (req, res) => {
    const { nid } = req.params;
    const { user_id } = req.user;
    const notification = await unreadNotificationService({ nid, user_id });
    return res
        .status(200)
        .json(new APIResponse(200, notification, `Marked notification (${nid}) as unread`));
};

export const triggerExpirationCheck = async (req, res) => {
    await checkExpirationDate();
    return res.status(200).json(new APIResponse(200, null, "Checked expiration"));
};
