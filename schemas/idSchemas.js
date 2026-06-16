import { z } from "zod";

export const IdSchema = z.object({
    dtn: z.coerce.number().int().positive().optional(),
    bid: z.coerce.number().int().positive().optional(),
});
