import { prisma } from "../library/db/db.ts";
import { omit } from "../configuration/constants.js";
import { fetchActiveUsers } from "./user.services.js";

export const fetchNotifications = async (user_id) => {
    return prisma.notification.findMany({
        where: { recipient_id: user_id },
        omit,
    });
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
                role: "staff",
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

        return notifications;
    } catch (error) {
        console.error("Error notifying staff of new application:", error);
        throw error;
    }
};

export const GetStaffNotifications = async (staffId, isRead = null) => {
    try {
        const where = { recipient_id: staffId };
        if (isRead !== null) {
            where.is_read = isRead;
        }

        const notifications = await prisma.notification.findMany({
            where,
            orderBy: { created_at: "desc" },
        });

        return notifications;
    } catch (error) {
        console.error("Error fetching staff 11 notifications:", error);
        throw error;
    }
};

export const MarkNotificationAsRead = async (notificationId) => {
    try {
        const notification = await prisma.notification.update({
            where: { nid: notificationId },
            data: {
                is_read: true,
                read_at: new Date(),
            },
        });
        return notification;
    } catch (error) {
        console.error("Error marking notification as read:", error);
        throw error;
    }
};
