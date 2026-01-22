import Joi from "joi";

export const createTestOrder = {
    body: Joi.object({
        patientId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required().messages({
            "string.pattern.base": "Invalid Patient ID format"
        }),
        doctorId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).allow(null, "").messages({
            "string.pattern.base": "Invalid Doctor ID format"
        }),
        testIds: Joi.array().items(
            Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required().messages({
                "string.pattern.base": "Invalid Test ID format"
            })
        ).min(1).unique().required(),
        discountId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).allow(null, "").messages({
            "string.pattern.base": "Invalid Discount ID format"
        }),
    }),
};
