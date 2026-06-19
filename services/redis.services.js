import { redis } from "../configuration/redis.js";

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
    await redis.set(key, JSON.stringify(data), "EX", 4 * 24 * 60 * 60);
};

export const fetchCachedData = async (key) => {
    const cached = await redis.get(key);
    return JSON.parse(cached);
};
