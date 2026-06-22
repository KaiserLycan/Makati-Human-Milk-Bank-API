import { z } from "zod";
import { listQuerySchema } from "./query.schemas.js";

const yesNoEnum = z.enum(["yes", "no"]).optional();

const infectiousIllnessSchema = z.object({
    tuberculosis: yesNoEnum,
    hepatitis_b: yesNoEnum,
    mastitis: yesNoEnum,
    syphilis: yesNoEnum,
    herpes: yesNoEnum,
    std: yesNoEnum,
});

const substanceHabitsSchema = z.object({
    consumed_alcohol: yesNoEnum,
    smoke: yesNoEnum,
    illegal_drugs: yesNoEnum,
    intravenous_drug_use: yesNoEnum,
});

const dietSupplementSchema = z.object({
    vegetarian: yesNoEnum,
    multivitamins: yesNoEnum,
    herbal_drugs: yesNoEnum,
});

const bloodExposureSchema = z.object({
    received_blood: yesNoEnum,
    needle_contact: yesNoEnum,
    repeated_blood_transfusion: yesNoEnum,
});

const surgicalHistorySchema = z.object({
    hormone_control: yesNoEnum,
    breast_surgery: yesNoEnum,
    breast_implant: yesNoEnum,
});

const exposureBehaviorSchema = z.object({
    tattoos: yesNoEnum,
    polygamy: yesNoEnum,
    std: yesNoEnum,
});

const personalInformationSchema = z.object({
    profile_image_url: z.url().optional(),
    occupation: z.string().min(2),
    marital_status: z.string(),
    home_address: z.string().min(5),
});

const travelingInformationSchema = z.object({
    travelled_recently: yesNoEnum,
    country_visited: z.string().optional(),
    purpose: z.string().optional(),
});

const donationInformationSchema = z.object({
    reason: z.string(),
    spouse_consent: yesNoEnum,
    previously_donated: yesNoEnum,
    last_donation: z.coerce.date().optional(),
    place_donated: z.string().optional(),
    reason_for_stopping: z.string().optional(),
});

const medicalInformationSchema = z.object({
    infectious_medical_illness: infectiousIllnessSchema,
    substance_user_habits: substanceHabitsSchema,
    diet_supplement_tracking: dietSupplementSchema,
    blood_exposure_transfusion: bloodExposureSchema,
    surgical_specialized_medical_history: surgicalHistorySchema,
    exposure_behavior: exposureBehaviorSchema,
});

const profileSchema = z.object({
    personal_information: personalInformationSchema,
    traveling_information: travelingInformationSchema,
    donation_information: donationInformationSchema,
    medical_information: medicalInformationSchema,
});

export const donorSchemas = z.object({
    name: z.string().min(2, { error: "Name must be at least 2 characters" }),
    email: z.email({ error: "Invalid email address" }),
    phone: z.e164({ error: "Invalid phone number" }),
    birth_date: z.coerce.date(),
    profile: profileSchema,
});

export const donorQuerySchema = listQuerySchema.extend({
    application_status: z
        .enum(
            ["pending", "approved", "rejected"],
            "Invalid application status. Application status can only be 'pending', 'approved', 'rejected'",
        )
        .optional(),
    status: z.enum(["active", "inactive"]).optional(),
    search: z.string().optional(),
});
