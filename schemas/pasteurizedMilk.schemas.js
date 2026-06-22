import { z } from "zod";
import { listQuerySchema } from "./query.schemas.js";

export const createBatchMilkSchema = z.object({
    pid: z.coerce.number().int().positive(),
    bottle_count: z.coerce.number().int().positive(),
    volume_per_bottle: z.coerce.number().int().positive(),
    bottle_type: z
        .enum(["korea", "ameda", "red_cap"], {
            error: "Invalid bottle type. Only korea, ameda, and red_cap are accepted.",
        })
        .optional()
        .default("ameda"),
    pasteurization_date: z.coerce.date(),
});

export const updatePasteurizedMilkSchema = z.object({
    volume_per_bottle: z.coerce.number().int().positive().optional(),
    pasteurization_date: z.coerce.date().optional(),
});

export const pasteurizedMilkQuerySchema = listQuerySchema.extend({
    milk_status: z.enum(["good", "contaminated", "discarded", "expired"]).optional(),
    mbt_status: z.enum(["pending", "pass", "fail"]).optional(),
    dispense_status: z.enum(["available", "reserved", "dispensed"]).optional(),
});

export const updateMBTStatusSchema = z.object({
    mbt_status: z.enum(["pending", "pass", "fail"]),
});

export const updateMilkStatusSchema = z.object({
    milk_status: z.enum(["good", "contaminated", "discarded", "expired"]),
    remarks: z.string().max(100, "Remarks cannot exceed 100 characters.").optional(),
});