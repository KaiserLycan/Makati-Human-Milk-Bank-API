import { z } from "zod";

export const IdSchema = z.object({
    user_id: z.uuid({ error: "Invalid user id." }).optional(),
    dtn: z.coerce.number().int().positive().optional(),
    bid: z.coerce.number().int().positive().optional(),
    pid: z.coerce.number().int().positive().optional(),
    rid: z.coerce.number().int().positive().optional(),
    nid: z.coerce.number().int().positive().optional(),
    btl_id: z.coerce.number().int().positive().optional(),
    ctn: z.coerce.number().int().positive().optional(),
    log_id: z.coerce.number().int().positive().optional(),
});
