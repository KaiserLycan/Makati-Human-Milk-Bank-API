import { z } from "zod";
import { listQuerySchema } from "./query.schemas.js";

export const pasteurizedMilkSchema = z.object({
    pid: z.coerce.number().int().positive(),
    batch_number: z.coerce.number().int().positive(),
    bottle_count: z.coerce.number().int().positive(),
    volume_per_bottle: z.coerce.number().int().positive(),
    bottle_type: z.string().optional(),
    pasteurization_date: z.coerce.date(),
});

export const pasteurizedMilkQuerySchema = listQuerySchema.extend({
    milk_status: z.enum(["good", "contaminated", "discarded", "expired"]).optional(),
    qat_status: z.enum(["pending", "pass", "fail"]).optional(),
    dispense_status: z.enum(["available", "reserved", "dispensed"]).optional(),
});

export const updateQATStatusSchema = z.object({
    qat_status: z.enum(["pending", "pass", "fail"]),
});

export const updateMilkStatusSchema = z.object({
    milk_status: z.enum(["good", "contaminated", "discarded", "expired"]),
    remarks: z.string().max(100, "Remarks cannot exceed 100 characters.").optional(),
});
