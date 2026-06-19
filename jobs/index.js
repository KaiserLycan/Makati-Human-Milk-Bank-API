import { logger } from "../library/utils/logger.js";
import { expirationJobs } from "./expiration.jobs.js";

export const initializeCronJobs = () => {
    logger.info("[CRON]: Initializing cron jobs...");
    expirationJobs();
};
