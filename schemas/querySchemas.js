import { z } from "zod";

export const standardListQuery = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(15),
    sortBy: z.string().optional().default("created_at"),
    sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});
