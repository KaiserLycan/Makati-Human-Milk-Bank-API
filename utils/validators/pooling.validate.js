import Joi from 'joi';

export const CreatePoolSchemaValidator = Joi.object({
    body: Joi.object({
        raw_milk_ctns: Joi.array()
            .items(Joi.number().integer().positive().messages({
                'number.base': 'CTN must be a number.',
                'number.integer': 'CTN must be an integer.',
                'number.positive': 'CTN must be a positive integer.'
            }))
            .min(1)
            .required()
            .messages({
                'array.min': 'You must provide at least one raw milk CTN to create a pool.',
                'any.required': 'raw_milk_ctns array is required.'
            }),
        actual_volume_ml: Joi.number().positive().optional().messages({
            'number.positive': 'Volume must be a positive number.'
        }),
        remarks: Joi.string().max(255).optional().messages({
            'string.max': 'Remarks cannot exceed 255 characters.'
        })
    }).unknown(true), 
    params: Joi.any(),
    query: Joi.any()
}).unknown(true);


export const UpdatePoolQATSchemaValidator = Joi.object({
    body: Joi.object({
        qat_status: Joi.string().valid('pass', 'fail').required().messages({
            'any.only': "qat_status must be either 'pass' or 'fail'."
        }),
        remarks: Joi.string().max(255).optional()
    }).unknown(true),
    
    params: Joi.object({
        pid: Joi.string().pattern(/^\d+$/).required().messages({
            'string.pattern.base': 'Pool ID must be a valid number.'
        })
    }).unknown(true),

    query: Joi.any()
}).unknown(true);