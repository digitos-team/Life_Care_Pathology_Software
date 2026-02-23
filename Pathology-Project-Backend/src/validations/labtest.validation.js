import Joi from "joi";
import { categoryEnum, resultTypeEnum } from "../models/labtest.model.js";

// Parameters Schema — conditionally validates based on resultType
const parameterSchema = Joi.object({
  name: Joi.string().required(),
  unit: Joi.string().allow("").optional(),
  resultType: Joi.string()
    .valid(...resultTypeEnum)
    .default("NUMERIC"),

  // NUMERIC: gender-specific min-max ranges
  referenceRanges: Joi.when("resultType", {
    is: "NUMERIC",
    then: Joi.array()
      .items(
        Joi.object({
          gender: Joi.string().valid("Male", "Female").required(),
          min: Joi.number().required(),
          max: Joi.number().greater(Joi.ref("min")).required(),
        })
      )
      .min(1)
      .required(),
    otherwise: Joi.array().optional(),
  }),

  // UNISEX_NUMERIC: single min-max for both genders
  unisexRange: Joi.when("resultType", {
    is: "UNISEX_NUMERIC",
    then: Joi.object({
      min: Joi.number().required(),
      max: Joi.number().greater(Joi.ref("min")).required(),
    }).required(),
    otherwise: Joi.object({
      min: Joi.number().optional(),
      max: Joi.number().optional(),
    }).optional(),
  }),

  // COMPARISON: array of { gender? comparator, value }
  comparisonRanges: Joi.when("resultType", {
    is: "COMPARISON",
    then: Joi.array()
      .items(
        Joi.object({
          gender: Joi.string().valid("Male", "Female").optional(),
          comparator: Joi.string().valid("<", "<=", ">", ">=").required(),
          value: Joi.number().required(),
        })
      )
      .min(1)
      .required(),
    otherwise: Joi.array().optional(),
  }),

  // QUALITATIVE: list of options + normal value
  qualitativeOptions: Joi.when("resultType", {
    is: "QUALITATIVE",
    then: Joi.object({
      options: Joi.array().items(Joi.string()).min(2).required(),
      normalValue: Joi.string().required(),
    }).required(),
    otherwise: Joi.object({
      options: Joi.array().items(Joi.string()).optional(),
      normalValue: Joi.string().optional(),
    }).optional(),
  }),
});

export const createTest = {
  body: Joi.object({
    testName: Joi.string().trim().min(2).required(),
    departmentId: Joi.string().required(),
    category: Joi.string()
      .valid(...categoryEnum)
      .optional(),
    price: Joi.number().min(0).required(),
    parameters: Joi.array().items(parameterSchema).min(1).required(),
    specializationIds: Joi.array().items(Joi.string()).optional(),
    status: Joi.string().valid("Active", "Inactive").optional(),
    labId: Joi.string().optional(),
  }),
};

// PUT /api/tests/:id
export const updateTest = {
  body: Joi.object({
    testName: Joi.string().trim().min(2).optional(),
    departmentId: Joi.string().optional(),
    category: Joi.string()
      .valid(...categoryEnum)
      .optional(),
    price: Joi.number().min(0).optional(),
    parameters: Joi.array().items(parameterSchema).min(1).optional(),
    specializationIds: Joi.array().items(Joi.string()).optional(),
    status: Joi.string().optional(),
    isActive: Joi.boolean().optional(),
  }),
};