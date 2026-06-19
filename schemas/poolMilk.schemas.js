import { z } from "zod";
import { listQuerySchema } from "./query.schemas.js";

export const milkPoolSchema = z.object({
    collections: z
        .array(z.coerce.number().int().positive())
        .min(1, "At least one collection is required"),
    actual_volume: z.coerce.number().int().positive(),
    remarks: z.string().max(100, "Remarks cannot exceed 100 characters.").optional(),
});

export const milkPoolQuerySchema = listQuerySchema.extend({
    milk_status: z.enum(["good", "contaminated", "discarded", "expired"]).optional(),
    qat_status: z.enum(["pending", "pass", "fail"]).optional(),
});

export const updateQATStatusSchema = z.object({
    qat_status: z.enum(["pending", "pass", "fail"]),
});

export const updateMilkPoolStatusSchema = z.object({
    milk_status: z.enum(["good", "contaminated", "discarded", "expired"]),
    remarks: z.string().max(100, "Remarks cannot exceed 100 characters.").optional(),
});
