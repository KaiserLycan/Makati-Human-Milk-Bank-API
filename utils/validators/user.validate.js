import Joi from "joi";

export const UserSchemaValidator = Joi.object({
    name: Joi.string().min(2).required().messages({
        "string.min" : "Name must be at least 2 characters.",
        "any.required": "Name is required.",
    }),
    email_add: Joi.string().email().required().messages({
        "string.email": "Please enter a valid email address.",
        "any.required": "Email is required.",
    }),
    phone_num: Joi.string().required().messages({
        "any.required": "Phone number is required."
    }),
    password: Joi.string().min(8).required().messages({
        "string.min" : "Password must be at least 8 characters long.",
        "any.required": "Password is required.",
    })
})