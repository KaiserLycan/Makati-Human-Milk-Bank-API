import winston from "winston";

const { combine, timestamp, printf, colorize, json } = winston.format;

const devFormat = printf(({ level, message, timestamp, stack }) => {
    return `${timestamp} ${level}: ${stack || message}`;
});

export const logger = winston.createLogger({
    level: process.env.NODE_ENV === "production" ? "info" : "debug",
    format: combine(
        timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        process.env.NODE_ENV === "production" ? json() : combine(colorize(), devFormat),
    ),
    transports: [new winston.transports.Console()],
});

if (process.env.NODE_ENV === "production") {
    logger.add(new winston.transports.File({ filename: "classes.log", level: "error" }));
}
