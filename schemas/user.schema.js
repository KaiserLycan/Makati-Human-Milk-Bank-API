import { z } from "zod";
import { listQuerySchema } from "./query.schemas.js";

export const updateUserSchemas = z.object({
    name: z.string({ error: "Name is required" }).min(2, "Name must be at least 2 characters"),
    role: z
        .enum(["manager", "staff"], {
            error: "Invalid role. User can only be a manager or staff.",
        })
        .optional(),
    email: z.email({
        error: (issue) => (issue.input === undefined ? "Email is required" : "Invalid email"),
    }),
    phone: z.e164({
        error: (issue) =>
            issue.input === undefined
                ? "Phone is required"
                : "Invalid phone format please use E164 formatting.",
    }),
    profile_image_url: z.url().optional(),
});

export const userSchema = z.object({
    name: z.string({ error: "Name is required" }).min(2, "Name must be at least 2 characters"),
    role: z
        .enum(["manager", "staff"], {
            error: "Invalid role. User can only be a manager or staff.",
        })
        .optional()
        .default("staff"),
    email: z.email({
        error: (issue) => (issue.input === undefined ? "Email is required" : "Invalid email"),
    }),
    phone: z.e164({
        error: (issue) =>
            issue.input === undefined
                ? "Phone is required"
                : "Invalid phone format please use E164 formatting.",
    }),
    profile_image_url: z.url().optional(),
    password: z
        .string({
            error: "Password is required ",
        })
        .min(8, "Password must be at least 8 characters"),
});

export const userIDSchema = z.object({
    user_id: z.uuid("Invalid User ID"),
});

export const usersQuery = listQuerySchema.extend({
    role: z.enum(["manager", "staff"]).optional(),
    status: z.enum(["active", "inactive"]).optional().default("active"),
    search: z.string().optional(),
});

export const updatePasswordSchemas = z.object({
    new_password: z.string().min(8, "New password must be at least 8 characters"),
});

export const changePasswordSchemas = updatePasswordSchemas.extend({
    old_password: z.string().min(8, "Old password must be at least 8 characters"),
});
