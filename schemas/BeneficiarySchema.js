import { z } from "zod";
import { standardListQuery } from "./querySchemas.js";

export const beneficiarySchema = z.object({
    name: z.string().min(2, { error: "Name must be at least 2 characters" }).optional(),
    caregiver: z
        .string()
        .min(2, { error: "Caregiver's name must be at least 2 characters" })
        .optional(),
    caregiver_email: z.email({ error: "Invalid email address" }).optional(),
    caregiver_phone: z.e164({ error: "Invalid phone number" }).optional(),
    birth_date: z.coerce.date().optional(),
    weight_kg: z.coerce.number().optional(),
    feeding_requirement_ml: z.coerce.number().optional(),
    profile: z
        .object({
            profile_image_url: z.union([z.literal(""), z.string().url()]).optional(),
            prescription_details: z.union([z.literal(""), z.string().url()]).optional(),
            clinical_abstract: z.union([z.literal(""), z.string().url()]).optional(),
        })
        .optional(),
});

export const beneficiaryQuerySchema = standardListQuery.extend({
    application_status: z
        .enum(["pending", "approved", "rejected"], "Invalid application status")
        .optional(),
    status: z.enum(["active", "inactive"]).optional(),
    search: z.string().optional(),
});
