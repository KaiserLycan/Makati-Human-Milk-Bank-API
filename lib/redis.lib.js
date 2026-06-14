import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

export const redis = new Redis(process.env.REDIS_URL);

export const getCachedData = async (key) => {
    const cachedData = await redis.get(key);
    if (cachedData) {
        return JSON.parse(cachedData);
    }
};

export const clearCachedData = async (key) => {
    let cursor = "0";
    do {
        const [nextCursor, keys] = await redis.scan(cursor, "MATCH", key, "COUNT", 100);

        cursor = nextCursor;

        if (keys.length > 0) {
            await redis.del(keys);
        }
    } while (cursor !== "0");
};

export const cacheData = async (key, data) => {
    await redis.set(key, JSON.stringify(data), "EX", 3600);
};
