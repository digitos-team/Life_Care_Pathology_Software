import LabTest from "../models/labtest.model.js";
import { ApiError } from "../utils/ApiError.js";

/**
 * Validate and auto-flag test results based on parameter type
 * @param {Object} result - The result object to validate
 * @param {Object} parameter - The parameter definition from LabTest
 * @param {String} patientGender - Patient's gender for reference range selection
 * @returns {Object} - Enhanced result with validation flags
 */
export const validateAndFlagResult = (result, parameter, patientGender) => {
    const enhancedResult = { ...result };

    if (parameter.parameterType === "QUANTITATIVE") {
        // Validate numeric value
        const numericValue = parseFloat(result.numericValue || result.value);

        if (isNaN(numericValue)) {
            throw new ApiError(400, `Invalid numeric value for parameter: ${parameter.name}`);
        }

        enhancedResult.numericValue = numericValue;
        enhancedResult.value = numericValue.toString(); // Backward compatibility

        // Find appropriate reference range
        const refRange = parameter.referenceRanges.find(
            (range) => range.gender === patientGender
        ) || parameter.referenceRanges[0];

        if (refRange) {
            enhancedResult.referenceRange = {
                min: refRange.min,
                max: refRange.max,
            };

            // Auto-flag abnormal values
            if (numericValue < refRange.min) {
                enhancedResult.isAbnormal = true;
                enhancedResult.abnormalityType = "LOW";
            } else if (numericValue > refRange.max) {
                enhancedResult.isAbnormal = true;
                enhancedResult.abnormalityType = "HIGH";
            } else {
                enhancedResult.isAbnormal = false;
                enhancedResult.abnormalityType = "NORMAL";
            }
        }
    } else if (parameter.parameterType === "QUALITATIVE") {
        // Validate qualitative value
        const selectedValue = result.qualitativeValue || result.value;

        const validOption = parameter.qualitativeOptions.find(
            (opt) => opt.value === selectedValue
        );

        if (!validOption) {
            throw new ApiError(
                400,
                `Invalid value "${selectedValue}" for parameter: ${parameter.name}. ` +
                `Valid options: ${parameter.qualitativeOptions.map(o => o.value).join(", ")}`
            );
        }

        enhancedResult.qualitativeValue = selectedValue;
        enhancedResult.value = selectedValue; // Backward compatibility

        // Auto-flag based on isNormal
        enhancedResult.isAbnormal = !validOption.isNormal;
        enhancedResult.abnormalityType = validOption.isNormal ? "NORMAL" : "ABNORMAL";
    }

    enhancedResult.parameterType = parameter.parameterType;
    enhancedResult.parameterName = parameter.name;
    enhancedResult.unit = parameter.unit;

    return enhancedResult;
};

/**
 * Validate all results for a test
 * @param {String} testId - The test ID
 * @param {Array} results - Array of result objects
 * @param {String} patientGender - Patient's gender
 * @returns {Array} - Enhanced results with validation flags
 */
export const validateTestResults = async (testId, results, patientGender) => {
    const test = await LabTest.findById(testId).lean();

    if (!test) {
        throw new ApiError(404, "Test not found");
    }

    const enhancedResults = [];

    for (const result of results) {
        const parameter = test.parameters.find(
            (p) => p.name === result.parameterName
        );

        if (!parameter) {
            throw new ApiError(
                400,
                `Parameter "${result.parameterName}" not found in test: ${test.testName}`
            );
        }

        const enhancedResult = validateAndFlagResult(result, parameter, patientGender);
        enhancedResults.push(enhancedResult);
    }

    return enhancedResults;
};
