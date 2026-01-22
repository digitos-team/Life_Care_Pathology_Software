import { ApiError } from "../utils/ApiError.js";

export const validate = (schema) => (req, res, next) => {
    const validSchema = schema.body || schema;
    const objectToValidate = schema.body ? req.body : req;

    if (!validSchema) {
        return next();
    }

    const { value, error } = validSchema.validate(objectToValidate, {
        abortEarly: false,
        stripUnknown: true
    });

    if (error) {
        const errorMessage = error.details
            .map((details) => details.message)
            .join(", ");
        return next(new ApiError(400, errorMessage));
    }

    Object.assign(req, value);
    return next();
};
