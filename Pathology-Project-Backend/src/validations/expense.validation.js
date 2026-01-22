import Joi from "joi";

const categoryEnum = ['LAB_MATERIALS', 'SALARY', 'COMMISSION', 'UTILITY', 'RENT', 'MISCELLANEOUS'];

export const createExpense = {
    body: Joi.object({
        title: Joi.string().trim().required(),
        amount: Joi.number().min(0).required(),
        category: Joi.string()
            .valid(...categoryEnum)
            .required(),
        description: Joi.string().trim().optional(),
        quantity: Joi.number().min(0).optional(),
        unit: Joi.string().trim().optional(),
        supplier: Joi.string().trim().optional(),
        date: Joi.date().iso().optional(),
        doctor: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional().messages({ "string.pattern.base": "Invalid Doctor ID format" }),
    }),
};

export const updateExpense = {
    body: Joi.object({
        title: Joi.string().trim().optional(),
        amount: Joi.number().min(0).optional(),
        category: Joi.string()
            .valid(...categoryEnum)
            .optional(),
        description: Joi.string().trim().optional(),
        quantity: Joi.number().min(0).optional(),
        unit: Joi.string().trim().optional(),
        supplier: Joi.string().trim().optional(),
        date: Joi.date().iso().optional(),
        doctor: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional().messages({ "string.pattern.base": "Invalid Doctor ID format" }),
    }),
};

export const createBatchExpenses = {
    body: Joi.object({
        // Accept either array or string (FormData sends JSON as string)
        expenses: Joi.alternatives().try(
            Joi.array().items(
                Joi.object({
                    title: Joi.string().trim().required(),
                    amount: Joi.number().min(0).required(),
                    category: Joi.string()
                        .valid(...categoryEnum)
                        .required(),
                    description: Joi.string().trim().optional(),
                    quantity: Joi.number().min(0).optional(),
                    unit: Joi.string().trim().optional(),
                    supplier: Joi.string().trim().optional(),
                    date: Joi.date().iso().optional(),
                    doctor: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional().messages({ "string.pattern.base": "Invalid Doctor ID format" }),
                })
            ).min(1),
            Joi.string().trim().min(1) // Allow string for FormData (will be parsed in controller)
        ).required()
    })
}
