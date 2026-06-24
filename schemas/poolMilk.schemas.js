import { z } from "zod";
import { listQuerySchema } from "./query.schemas.js";

export const milkPoolSchema = z.object({
    collections: z
        .array(z.coerce.number().int().positive())
        .min(1, "At least one collection is required"),
    actual_volume_ml: z.coerce.number().positive(),
    remarks: z.string().max(100, "Remarks cannot exceed 100 characters.").optional(),
});

export const updatePoolSchema = z.object({
    pooled_by: z.uuid().optional(),
    pooled_date: z.coerce.date().optional(),
    expiration_date: z.coerce.date().optional(),
    actual_volume_ml: z.coerce.number().positive().optional(),
    remarks: z.string().max(100, "Remarks cannot exceed 100 characters.").optional(),
});

export const milkPoolQuerySchema = listQuerySchema.extend({
    milk_status: z.enum(["good", "contaminated", "discarded", "expired"]).optional(),
    search: z.string().optional(),
});

export const updateMilkPoolStatusSchema = z.object({
    milk_status: z.enum(["good", "contaminated", "discarded", "expired"]),
    remarks: z.string().max(100, "Remarks cannot exceed 100 characters.").optional(),
});
