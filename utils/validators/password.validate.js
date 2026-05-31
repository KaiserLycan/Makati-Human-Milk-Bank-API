import Joi from "joi";

export const PasswordSchemaValidator = Joi.object({

    old_password: Joi.string()
        .required()
        .messages({
            "any.required": "Old password is required"
        }),

    new_password: Joi.string().min(8).required()
        .not(Joi.ref("old_password"))
        .messages({
            "string.min" : "New Password must be at least 8 characters long.",
            "any.required": "New Password is required.",
            "any.invalid": "New password cannot be the same as the old password"
    })
})