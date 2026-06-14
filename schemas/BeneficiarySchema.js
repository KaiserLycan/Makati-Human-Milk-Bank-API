import { z } from "zod";
import { standardListQuery } from "./querySchemas.js";

export const beneficiarySchema = z.object({
    name: z.string().min(2, { error: "Name must be at least 2 characters" }),
    caregiver: z.string().min(2, { error: "Caregiver's name must be at least 2 characters" }),
    caregiver_email: z.email({ error: "Invalid email address" }),
    caregiver_phone: z.e164({ error: "Invalid phone number" }),
    birth_date: z.coerce.date(),
    weight_kg: z.coerce.number(),
    feeding_requirement_ml: z.coerce.number(),
    profile: {
        profile_image_url: z.url().optional(),
        prescription_details: z.url().optional(),
        clinical_abstract: z.url().optional(),
    },
});

export const beneficiaryQuerySchema = standardListQuery.extend({
    application_status: z
        .enum(["pending", "approved", "rejected"], "Invalid application status")
        .optional(),
    status: z.enum(["active", "inactive"]).optional(),
    search: z.string().optional(),
});
