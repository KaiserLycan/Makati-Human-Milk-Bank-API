import { prisma } from "../library/db/db.ts";
import { createPgClient } from "../library/db/pgClient.js";
import { cacheData, clearCachedData, fetchCachedData } from "./redis.services.js";
import { logger } from "../library/utils/logger.js";

const clearCachedLogs = async () => {
    const key = "auditLogs:*";
    await clearCachedData(key);
};

let pgClient;
let reconnectTimeout = null;

const connectToPg = async () => {
    try {
        pgClient = createPgClient();
        await pgClient.connect();
        logger.info("Successfully connected pgClient for notifications.");

        pgClient.on("notification", async (msg) => {
            if (msg.channel === "audit_channel") {
                try {
                    await clearCachedLogs();
                } catch (error) {
                    logger.error("Error during cache clearing:", error);
                }
            }
        });

        await pgClient.query("LISTEN audit_channel");
        logger.info("Subscribed to audit_channel for notifications.");

        pgClient.on("error", (err) => {
            logger.error("An error occurred with the pgClient:", err);
            scheduleReconnect();
        });

        pgClient.on("end", () => {
            logger.info("pgClient connection ended.");
            scheduleReconnect();
        });
    } catch (error) {
        logger.error("Failed to connect or subscribe to audit_channel:", error);
        scheduleReconnect();
    }
};

const scheduleReconnect = () => {
    if (!reconnectTimeout) {
        reconnectTimeout = setTimeout(async () => {
            reconnectTimeout = null;
            logger.info("Attempting to reconnect pgClient...");
            try {
                if (pgClient) await pgClient.end().catch(() => {});
            } catch (e) {
                logger.error("Error during reconnect cleanup:", e);
            }
            await connectToPg();
        }, 5000);
    }
};

export const subToAuditLogs = () => {
    connectToPg();
};

export const fetchAuditLogs = async (params) => {
    const {
        modified_by,
        action_performed,
        table_name,
        start_date,
        end_date,
        page,
        limit,
        sortBy,
        sortOrder,
    } = params;

    const key = `auditLogs:list:${JSON.stringify(params)}`;
    const cached = await fetchCachedData(key);
    if (cached) return cached;

    const where = {
        ...(modified_by && { modified_by }),
        ...(action_performed && { action_performed }),
        ...(table_name && { table_name }),
        ...((start_date || end_date) && {
            performed_at: {
                ...(start_date && { gte: new Date(start_date) }),
                ...(end_date && { lte: new Date(end_date) }),
            },
        }),
    };

    const [total, logs] = await prisma.$transaction([
        prisma.audit_log.count({ where }),
        prisma.audit_log.findMany({
            where,
            orderBy: { [sortBy]: sortOrder },
            include: {
                user: {
                    select: {
                        user_id: true,
                        role: true,
                        name: true,
                        status: true,
                    },
                },
            },
            skip: (page - 1) * limit,
            take: limit,
        }),
    ]);

    const result = {
        data: logs,
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    };

    await cacheData(key, result);
    return result;
};

export const retrieveAuditLogById = async (log_id) => {
    const key = `auditLogs:${log_id}`;
    const cached = await fetchCachedData(key);
    if (cached) return cached;

    const audit = await prisma.audit_log.findUniqueOrThrow({
        where: {
            log_id: log_id,
        },
        include: {
            user: {
                select: {
                    user_id: true,
                    role: true,
                    name: true,
                    status: true,
                },
            },
        },
    });

    await cacheData(key, audit);
    return audit;
};

export const auditUserLogin = async (user_id) => {
    await prisma.audit_log.create({
        data: {
            modified_by: user_id,
            action_performed: "LOGIN",
            table_name: "user",
        },
    });
};

export const auditUserLogout = async (user_id) => {
    await prisma.audit_log.create({
        data: {
            modified_by: user_id,
            action_performed: "LOGOUT",
            table_name: "user",
        },
    });
};
