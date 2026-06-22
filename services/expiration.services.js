import { prisma } from "../library/db/db.ts";
import { markExpiredRawMilk } from "./rawMilk.services.js";
import { markExpiredPoolMilk } from "./poolMilk.services.js";
import { processRequestWithExpiredMilk } from "./request.services.js";
import { markExpiredPasteurizedMilk } from "./pasteurizedMilk.service.js";
import { logger } from "../library/utils/logger.js";

export const checkExpirationDate = async () => {
    logger.info("Running daily expiration check...");
    await markExpiredRawMilk();
    await markExpiredPoolMilk();
    await processRequestWithExpiredMilk();
    await markExpiredPasteurizedMilk();
    await prisma.$executeRaw`SELECT internal_execute_allocation()`;
    logger.info("Daily expiration check complete.");
};
