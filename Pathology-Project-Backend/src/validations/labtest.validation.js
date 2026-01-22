import Joi from "joi";

// Parameters Schema
const parameterSchema = Joi.object({
  name: Joi.string().required(),
  unit: Joi.string().required(),
  referenceRanges: Joi.array().items(
    Joi.object({
      gender: Joi.string().valid("Male", "Female").required(),
      min: Joi.number().required(),
      max: Joi.number().greater(Joi.ref("min")).required(),
    })
  ).min(1).required(),
});

const categoryEnum = [
  "Blood",
  "Urine",
  "Biochemistry",
  "Hormone",
  "Immunology",
  "Microbiology",
  "Other",
];

export const createTest = {
  body: Joi.object({
    testName: Joi.string().trim().min(2).required(),
    category: Joi.string()
      .valid(...categoryEnum)
      .required(),
    price: Joi.number().positive().required(),
    parameters: Joi.array().items(parameterSchema).min(1).required(),
  }),
};

// PUT /api/tests/:id
export const updateTest = {
  body: Joi.object({
    testName: Joi.string().trim().min(2).optional(),
    category: Joi.string()
      .valid(...categoryEnum)
      .optional(),
    price: Joi.number().positive().optional(),
    parameters: Joi.array().items(parameterSchema).min(1).optional(),
    isActive: Joi.boolean().optional(),
  }),
};