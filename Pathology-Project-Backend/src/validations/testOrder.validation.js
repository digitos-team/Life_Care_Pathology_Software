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
        ).unique().optional().default([]),
        packageIds: Joi.array().items(
            Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required().messages({
                "string.pattern.base": "Invalid Package ID format"
            })
        ).unique().optional().default([]),
        discountId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).allow(null, "").messages({
            "string.pattern.base": "Invalid Discount ID format"
        }),
    }).custom((value, helpers) => {
        // At least one of testIds or packageIds must be provided
        if ((!value.testIds || value.testIds.length === 0) && (!value.packageIds || value.packageIds.length === 0)) {
            return helpers.message('At least one test or package must be selected');
        }
        return value;
    }),
};
