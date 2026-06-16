import { z } from "zod";
import { standardListQuery } from "../../shared/schemas/querySchemas.js";

export const updateUserSchemas = z.object({
    name: z.string().min(2, {
        error: "Name must be at least 2 characters",
    }),
    role: z
        .enum(["manager", "staff"], {
            error: "Invalid role. User can only be a manager or staff.",
        })
        .optional()
        .default("staff"),
    email: z.email({ error: "Invalid email address" }),
    phone: z.e164({ error: "Invalid phone number" }),
    profile_image_url: z.url().optional(),
});

export const userSchema = updateUserSchemas.extend({
    password: z.string().min(8, { error: "Password must be at least 8 characters" }),
});

export const userIDSchema = z.object({
    user_id: z.uuid({ error: "Invalid User ID" }),
});

export const usersQuery = standardListQuery.extend({
    role: z.enum(["manager", "staff"]).optional(),
    status: z.enum(["active", "inactive"]).optional().default("active"),
    search: z.string().optional(),
});

export const updatePasswordSchemas = z.object({
    new_password: z.string().min(8, { error: "New password must be at least 8 characters" }),
});

export const changePasswordSchemas = updatePasswordSchemas.extend({
    old_password: z.string().min(8, { error: "New password must be at least 8 characters" }),
});
