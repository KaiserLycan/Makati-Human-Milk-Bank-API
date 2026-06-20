import { z } from "zod";

export const requestQuerySchemas = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(15),
    sortBy: z.string().optional().default("requested_date"),
    sortOrder: z.enum(["asc", "desc"]).optional().default("asc"),
    request_status: z
        .enum(
            ["waiting", "allocated", "completed", "canceled"],
            "Invalid request status. Only 'waiting', 'allocated', 'completed' and 'canceled' are allowed.",
        )
        .optional(),
});
