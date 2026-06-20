import { prisma } from "../library/db/db.ts";
import { omit } from "../configuration/constants.js";
import { fetchActiveUsers } from "./user.services.js";
import { cacheData, clearCachedData, fetchCachedData } from "./redis.services.js";

const NOTIFICATION_CACHE_KEY = "notifications:*";

export const fetchNotificationsByUserId = async (params) => {
    const { user_id, is_read } = params;
    const key = `notifications:${JSON.stringify(params)}`;
    const cachedData = await fetchCachedData(key);
    if (cachedData) return cachedData;

    const notifications = await prisma.notification.findMany({
        where: {
            recipient_id: user_id,
            ...(is_read && { is_read }),
        },
        omit,
    });

    await cacheData(key, notifications);
    return notifications;
};

export const readNotification = async ({ nid, user_id }) => {
    const updatedNotification = prisma.notification.update({
        where: { nid, recipient_id: user_id },
        data: {
            is_read: true,
            read_at: new Date(),
        },
    });

    await clearCachedData(NOTIFICATION_CACHE_KEY);
    return updatedNotification;
};

export const buildStaffNotifications = async (entityType, ids, messageTemplate) => {
    const users = await fetchActiveUsers();
    if (users.length === 0 || ids.length === 0) return [];
    const notifications = [];
    for (const id of ids) {
        for (const user of users) {
            notifications.push({
                recipient_id: user.user_id,
                entity_type: entityType,
                entity_id: id,
                notification_type: "EXPIRATION_ALERT",
                title: "Milk Expiration Alert",
                message: messageTemplate(id),
            });
        }
    }
    return notifications;
};

export const notifyStaff = async (data) => {
    await prisma.notification.createMany({
        data,
    });
};

export const CreateNotification = async (
    recipientId,
    entityType,
    entityId,
    notificationType,
    title,
    message,
    modifierId,
) => {
    try {
        const notification = await prisma.notification.create({
            data: {
                recipient_id: recipientId,
                entity_type: entityType,
                entity_id: entityId,
                notification_type: notificationType,
                title,
                message,
                modified_by: modifierId,
            },
        });
        await clearCachedData(NOTIFICATION_CACHE_KEY);
        return notification;
    } catch (error) {
        console.error("Error creating notification:", error);
        throw error;
    }
};

export const NotifyStaffNewApplication = async (
    applicantName,
    applicantType,
    applicantId,
    modifierId,
) => {
    try {
        const staffUsers = await prisma.user.findMany({
            where: {
                status: "active",
            },
        });

        const notifications = await Promise.all(
            staffUsers.map((staff) =>
                CreateNotification(
                    staff.user_id,
                    applicantType,
                    applicantId,
                    "new_application",
                    `New ${applicantType} Application`,
                    `${applicantName} has submitted a new ${applicantType} application for review.`,
                    modifierId,
                ),
            ),
        );

        await clearCachedData(NOTIFICATION_CACHE_KEY);
        return notifications;
    } catch (error) {
        console.error("Error notifying staff of new application:", error);
        throw error;
    }
};
