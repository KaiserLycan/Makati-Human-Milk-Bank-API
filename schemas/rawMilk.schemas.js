import { z } from "zod";
import { listQuerySchema } from "./query.schemas.js";

const baseCollectionSchema = z.object({
    dtn: z.coerce.number().int().positive(),
    volume_ml: z.coerce.number().int().positive(),
    expiration_date: z.coerce.date(),
    collected_by: z.uuid("Invalid user ID"),
    remarks: z.string().max(100, "Remarks cannot exceed 100 characters.").optional(),
});

const stSchema = baseCollectionSchema.extend({
    program: z.literal("ST"),
    health_center: z.string(),
});

const maSchema = baseCollectionSchema.extend({
    program: z.literal("MA"),
    pickup_date: z.coerce.date(),
});

const mwSchema = baseCollectionSchema.extend({
    program: z.literal("MW"),
    hospital: z.string("Hospital is required"),
    pickup_date: z.coerce.date(),
});

const wiSchema = baseCollectionSchema.extend({
    program: z.literal("WI"),
    volume_ml: z.coerce
        .number()
        .int()
        .positive()
        .min(30, "Volume must be between 30 and 240 ml.")
        .max(240, "Volume must be between 30 and 240 ml."),
    pickup_date: z.coerce.date(),
});

export const collectionSchema = z.discriminatedUnion("program", [
    stSchema,
    maSchema,
    mwSchema,
    wiSchema,
]);

export const collectionQuerySchema = listQuerySchema.extend({
    milk_status: z.enum(["good", "contaminated", "discarded", "expired"]).optional(),
    qat_status: z.enum(["pending", "pass", "fail"]).optional(),
    program: z.enum(["ST", "MA", "MW", "WI"]).optional(),
});

export const updateQATStatusSchema = z.object({
    qat_status: z.enum(["pending", "pass", "fail"]),
});

export const updateMilkStatusSchema = z.object({
    milk_status: z.enum(["good", "contaminated", "discarded", "expired"]),
});
