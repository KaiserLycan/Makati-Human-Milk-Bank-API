import { z } from "zod";

export const queryAuditSchemas = z.object({
    modified_by: z.string().optional(),
    action_performed: z.string().toUpperCase().optional(),
    table_name: z.string().optional(),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    sortBy: z.string().optional().default("performed_at"),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(10000).default(15),
    sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});
