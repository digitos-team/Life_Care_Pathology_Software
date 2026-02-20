import {
    createTestPackageService,
    getTestPackagesService,
    getTestPackageByIdService,
    updateTestPackageService,
    deleteTestPackageService,
} from "../services/testpackage.service.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * @desc    Create a new test package
 * @route   POST /api/test-packages
 * @access  Private (Admin/Lab Manager)
 */
export const createTestPackage = asyncHandler(async (req, res) => {
    const { labId } = req.user;
    const packageData = { ...req.body, labId };

    const testPackage = await createTestPackageService(packageData);

    res.status(201).json(
        new ApiResponse(201, testPackage, "Test package created successfully")
    );
});

/**
 * @desc    Get all test packages for a lab
 * @route   GET /api/test-packages
 * @access  Private
 */
export const getTestPackages = asyncHandler(async (req, res) => {
    const { labId } = req.user;
    const { isActive, departmentId, search, page, limit } = req.query;

    const filters = {
        isActive: isActive !== undefined ? isActive === "true" : undefined,
        departmentId,
        search,
    };

    const packages = await getTestPackagesService(labId, filters, page, limit);

    res.status(200).json(
        new ApiResponse(200, packages, "Test packages retrieved successfully")
    );
});

/**
 * @desc    Get test package by ID
 * @route   GET /api/test-packages/:id
 * @access  Private
 */
export const getTestPackageById = asyncHandler(async (req, res) => {
    const { labId } = req.user;
    const { id } = req.params;

    const testPackage = await getTestPackageByIdService(id, labId);

    res.status(200).json(
        new ApiResponse(200, testPackage, "Test package retrieved successfully")
    );
});

/**
 * @desc    Update test package
 * @route   PUT /api/test-packages/:id
 * @access  Private (Admin/Lab Manager)
 */
export const updateTestPackage = asyncHandler(async (req, res) => {
    const { labId } = req.user;
    const { id } = req.params;

    const testPackage = await updateTestPackageService(id, labId, req.body);

    res.status(200).json(
        new ApiResponse(200, testPackage, "Test package updated successfully")
    );
});

/**
 * @desc    Delete test package (soft delete)
 * @route   DELETE /api/test-packages/:id
 * @access  Private (Admin/Lab Manager)
 */
export const deleteTestPackage = asyncHandler(async (req, res) => {
    const { labId } = req.user;
    const { id } = req.params;

    const result = await deleteTestPackageService(id, labId);

    res.status(200).json(new ApiResponse(200, result, result.message));
});
