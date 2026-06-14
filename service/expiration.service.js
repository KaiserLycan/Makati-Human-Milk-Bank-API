import { prisma } from "../db/db.ts";
import cron from "node-cron";
import { SendCancellationNotification } from "./email.service.js";

export const runExpirationCheck = async () => {
    console.log("Running daily milk expiration check...");
    try {
        const now = new Date();

        // 1. Get all active staff users to notify
        const staffUsers = await prisma.user.findMany({
            where: { role: "staff", status: "active" },
        });

        const notifyStaff = async (entityType, entityId, message) => {
            if (staffUsers.length === 0) return;

            const notifications = staffUsers.map((staff) => ({
                recipient_id: staff.user_id,
                entity_type: entityType,
                entity_id: entityId,
                notification_type: "EXPIRATION_ALERT",
                title: "Milk Expiration Alert",
                message: message,
            }));

            await prisma.notification.createMany({ data: notifications });
        };

        // 2. Check Raw Milk (Collection Stage)
        const expiredRaw = await prisma.raw_milk.findMany({
            where: { expiration_date: { lt: now }, milk_status: "good" },
        });
        for (const milk of expiredRaw) {
            await prisma.raw_milk.update({
                where: { ctn: milk.ctn },
                data: { milk_status: "expired" },
            });
            await notifyStaff(
                "raw_milk",
                milk.ctn,
                `Raw milk collection (CTN: ${milk.ctn}) has expired.`,
            );
        }

        // 3. Check Pool Milk (Processing Stage)
        const expiredPool = await prisma.pool_milk.findMany({
            where: { expiration_date: { lt: now }, milk_status: "good" },
        });
        for (const milk of expiredPool) {
            await prisma.pool_milk.update({
                where: { pid: milk.pid },
                data: { milk_status: "expired" },
            });
            await notifyStaff(
                "pool_milk",
                milk.pid,
                `Pooled milk batch (PID: ${milk.pid}) has expired.`,
            );
        }

        // 4. Check Pasteurized Milk (Dispensing Stage)
        const expiredPasteurized = await prisma.pasteurized_milk.findMany({
            where: {
                expiration_date: { lt: now },
                milk_status: "good",
                dispense_status: { not: "dispensed" },
            },
            include: {
                request_bottles: {
                    include: { request: { include: { beneficiary: true } } },
                },
            },
        });

        for (const milk of expiredPasteurized) {
            await prisma.pasteurized_milk.update({
                where: { btl_id: milk.btl_id },
                data: { milk_status: "expired" },
            });
            await notifyStaff(
                "pasteurized_milk",
                milk.btl_id,
                `Pasteurized milk bottle (ID: ${milk.btl_id}) has expired.`,
            );

            // 5. Check if it affects any beneficiary requests (R60)
            for (const rb of milk.request_bottles) {
                const req = rb.request;
                if (
                    req &&
                    (req.request_status === "waiting" || req.request_status === "allocated")
                ) {
                    // Cancel the request
                    await prisma.request.update({
                        where: { rid: req.rid },
                        data: { request_status: "canceled" },
                    });

                    // Send email to caregiver
                    const email = req.beneficiary.caregiver_email;
                    console.log(
                        `[EMAIL ALERT] Sending cancellation email to ${email} for Request ID: ${req.rid}`,
                    );
                    await SendCancellationNotification(req.beneficiary);
                }
            }
        }

        console.log("Milk expiration check completed successfully.");
    } catch (error) {
        console.error("Error during expiration check job:", error);
        throw error;
    }
};

export const CheckExpirationJob = () => {
    // Runs every day at midnight ('0 0 * * *')
    // For testing purposes, you can change this to '* * * * *' to run every minute!
    cron.schedule("0 0 * * *", runExpirationCheck);
};
