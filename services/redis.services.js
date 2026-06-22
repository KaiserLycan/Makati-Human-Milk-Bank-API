import { redis } from "../configuration/redis.js";
import { logger } from "../library/utils/logger.js";

export const clearCachedData = async (key) => {
    try {
        let cursor = "0";
        do {
            const [nextCursor, keys] = await redis.scan(cursor, "MATCH", key, "COUNT", 100);

            cursor = nextCursor;

            if (keys.length > 0) {
                await redis.del(keys);
            }
        } while (cursor !== "0");
    } catch (error) {
        logger.error(`Redis clearCachedData failed for pattern ${key}:`, error);
    }
};

export const cacheData = async (key, data) => {
    try {
        await redis.set(key, JSON.stringify(data), "EX", 4 * 24 * 60 * 60);
    } catch (error) {
        logger.error(`Redis cacheData failed for key ${key}:`, error);
    }
};

export const fetchCachedData = async (key) => {
    try {
        const cached = await redis.get(key);
        return cached ? JSON.parse(cached) : null;
    } catch (error) {
        logger.error(`Redis fetchCachedData failed for key ${key}:`, error);
        return null;
    }
};
