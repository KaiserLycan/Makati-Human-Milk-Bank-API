import cron from "node-cron";
import { checkExpirationDate } from "../services/expiration.services.js";
import { logger } from "../library/utils/logger.js";

export const expirationJobs = () => {
    cron.schedule(
        "0 0 * * *",
        async () => {
            logger.info("Running daily milk expiration check...");
            try {
                await checkExpirationDate();
                logger.info("Daily milk expiration check completed successfully.");
            } catch (error) {
                logger.error("Error executing daily milk expiration check:", error);
            }
        },
        {
            scheduled: true,
            timezone: "Asia/Manila",
        },
    );
};
