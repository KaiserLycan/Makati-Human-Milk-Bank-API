import { z } from "zod";
import { listQuerySchema } from "./query.schemas.js";

export const beneficiarySchemas = z.object({
    name: z.string().min(2, "Name must be at least 2 characters").optional(),
    caregiver: z.string().min(2, "Caregiver's name must be at least 2 characters").optional(),
    caregiver_email: z.email("Invalid email address").optional(),
    caregiver_phone: z.e164("Invalid phone number").optional(),
    birth_date: z.coerce.date().optional(),
    weight_kg: z.coerce.number().optional(),
    feeding_requirement_ml: z.coerce.number().optional(),
    profile: z
        .object({
            profile_image_url: z.url().or(z.literal("")).optional(),
            prescription_details: z.url().or(z.literal("")).optional(),
            clinical_abstract: z.url().or(z.literal("")).optional(),
        })
        .optional(),
});

export const beneficiaryQuerySchema = listQuerySchema.extend({
    application_status: z.enum(["pending", "approved", "rejected"]).optional(),
    status: z.enum(["active", "inactive"]).optional(),
    search: z.string().optional(),
});
