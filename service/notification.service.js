import { prisma } from "../db/db.ts";

export const CreateNotification = async (
  recipientId,
  entityType,
  entityId,
  notificationType,
  title,
  message,
  modifierId
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
  modifierId
) => {
  try {
    // Get all active staff users (role: 'staff')
    const staffUsers = await prisma.user.findMany({
      where: {
        role: "staff",
        status: "active",
      },
    });

    // Create notification for each staff member
    const notifications = await Promise.all(
      staffUsers.map((staff) =>
        CreateNotification(
          staff.user_id,
          applicantType,
          applicantId,
          "new_application",
          `New ${applicantType} Application`,
          `${applicantName} has submitted a new ${applicantType} application for review.`,
          modifierId
        )
      )
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
    console.error("Error fetching staff notifications:", error);
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
