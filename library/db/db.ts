import "dotenv/config";
import { PrismaClient } from "./generated/prisma/client.js";
import { PrismaNeon } from "@prisma/adapter-neon";

const adapter = new PrismaNeon({
    connectionString: process.env.DATABASE_URL,
    // Limit pool size to avoid exhausting Neon's connection limit under concurrent load
    connectionTimeoutMillis: 10000,
});

export const prisma = new PrismaClient({
    adapter,
    transactionOptions: {
        // Ensure interactive transactions don't hang past the gateway's 30s timeout
        timeout: 25000,
        maxWait: 5000,
    },
});
