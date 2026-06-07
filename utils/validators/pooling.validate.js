import {z} from 'zod';

export const CreatePoolSchemaValidator = z.object({
  body: z.object({
    // must be an array of positive integers, at least 1 item, and required
    raw_milk_ctns: z.array(z.number().int().positive("CTN must be a positive integer.")).min(1, "Please provide at least one raw milk CTN."),
    // optional actual_volume_ml, but if provided must be a positive number
    actual_volume_ml: z.number().positive("Volume must be a positive number.").optional(),
    
    // optional remarks, but if provided must be a string with max length of 255 characters
    remarks: z.string().max(255, "Remarks cannot exceed 255 characters.").optional(),
})

});