import { rateLimit } from "express-rate-limit";

export const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500,
    message: { success: false, message: "Too many requests from this IP, please try again later" },
    standardHeaders: true,
    legacyHeaders: false,
});

export const strictLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20,
    message: { success: false, message: "Too many attempts, please try again in 15 minutes" },
    standardHeaders: true,
    legacyHeaders: false,
});
