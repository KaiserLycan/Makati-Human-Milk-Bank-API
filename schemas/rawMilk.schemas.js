import { z } from "zod";
import { listQuerySchema } from "./query.schemas.js";

const baseCollectionSchema = z.object({
    dtn: z.coerce.number().int().positive(),
    volume_ml: z.coerce.number().positive(),
    expiration_date: z.coerce.date({ error: "Expiration date is required" }),
    collected_by: z.uuid("Invalid user ID"),
    remarks: z.string().max(100, "Remarks cannot exceed 100 characters.").optional(),
});

const stSchema = baseCollectionSchema.extend({
    program: z.literal("ST"),
    collection_date: z.coerce.date().optional(),
    health_center: z.string({ error: "Health center is required" }),
});

const maSchema = baseCollectionSchema.extend({
    program: z.literal("MA"),
    collection_date: z.coerce.date({ error: "Collection date is required" }),
    pickup_date: z.coerce.date({ error: "Pickup date is required" }),
});

const mwSchema = baseCollectionSchema.extend({
    program: z.literal("MW"),
    hospital: z.string("Hospital is required"),
    collection_date: z.coerce.date({ error: "Collection date is required" }),
    pickup_date: z.coerce.date({ error: "Pickup date is required" }),
});

const wiSchema = z.object({
    program: z.literal("WI"),
    dtn: z.coerce.number().int().positive(),
    collection_date: z.coerce.date().optional(),
    expiration_date: z.coerce.date({ error: "Expiration date is required" }),
    collected_by: z.uuid("Invalid user ID"),
    remarks: z.string().max(100, "Remarks cannot exceed 100 characters.").optional(),
    volume_ml: z.coerce
        .number()
        .positive()
        .min(30, "Volume must be between 30 and 240 ml.")
        .max(240, "Volume must be between 30 and 240 ml."),
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
    dtn: z.coerce.number().int().positive().optional(),
});

export const updateQATStatusSchema = z.object({
    qat_status: z.enum(["pending", "pass", "fail"]),
});

export const updateMilkStatusSchema = z.object({
    milk_status: z.enum(["good", "contaminated", "discarded", "expired"]),
});
