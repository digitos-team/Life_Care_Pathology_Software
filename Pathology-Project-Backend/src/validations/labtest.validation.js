import Joi from "joi";
import { categoryEnum } from "../models/labtest.model.js";

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
    price: Joi.number().positive().optional(),
    parameters: Joi.array().items(parameterSchema).min(1).optional(),
    specializationIds: Joi.array().items(Joi.string()).optional(),
    status: Joi.string().optional(),
    isActive: Joi.boolean().optional(),
  }),
};