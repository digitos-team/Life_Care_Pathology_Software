import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import testService from "../services/labtest.services.js";
import labSchema from "../models/pathologyLab.model.js";


// 1. Create new Test (Admin only)
export const createTest = asyncHandler(async (req, res) => {
    const labId = req.user.labId;
    console.log("CREATING TEST - Incoming Parameters:", JSON.stringify(req.body.parameters, null, 2));

    const test = await testService.createTest({
        ...req.body,
        labId: labId
    });

    res.status(201).json(
        new ApiResponse(201, test, "Test created successfully")
    );
});

// 2. Get all active tests
export const getAllTests = asyncHandler(async (req, res) => {
    const labId = req.user.labId;
    const tests = await testService.getAllTests(labId);

    res.status(200).json(
        new ApiResponse(200, tests, "Tests fetched successfully")
    );
});

// 3. Get test by ID
export const getTestById = asyncHandler(async (req, res) => {
    const labId = req.user.labId;
    const test = await testService.getTestById(
        req.params.id,
        labId
    );

    if (!test) {
        throw new ApiError(404, "Test not found");
    }

    res.status(200).json(
        new ApiResponse(200, test, "Test fetched successfully")
    );
});

// 4. Update test
export const updateTest = asyncHandler(async (req, res) => {
    const labId = req.user.labId;
    const updatedTest = await testService.updateTest(
        req.params.id,
        req.body,
        labId
    );

    if (!updatedTest) {
        throw new ApiError(404, "Test not found");
    }

    res.status(200).json(
        new ApiResponse(200, updatedTest, "Test updated successfully")
    );
});

// 5. Delete test
export const deleteTest = asyncHandler(async (req, res) => {
    const labId = req.user.labId;
    const deletedTest = await testService.deleteTest(
        req.params.id,
        labId
    );

    if (!deletedTest) {
        throw new ApiError(404, "Test not found");
    }

    res.status(200).json(
        new ApiResponse(200, null, "Test deleted successfully")
    );
});