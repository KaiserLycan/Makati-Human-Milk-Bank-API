import Redis from "ioredis";
import dotenv from "dotenv";
import { logger } from "../library/utils/logger.js";

dotenv.config();

export const redis = new Redis(process.env.REDIS_URL);

redis.on("error", (error) => {
    logger.error("Redis connection error:", error);
});
