import TestPackage from "../models/testpackage.model.js";
import LabTest from "../models/labtest.model.js";
import { ApiError } from "../utils/ApiError.js";
import mongoose from "mongoose";

/**
 * Create a new test package
 */
export const createTestPackageService = async (packageData) => {
    const { labId, packageName, includedTests } = packageData;

    // Validate that all tests exist and belong to the same lab
    const testIds = includedTests.map((t) => t.testId);
    const tests = await LabTest.find({
        _id: { $in: testIds },
        labId: labId,
        isActive: true,
    });

    if (tests.length !== testIds.length) {
        throw new ApiError(400, "One or more tests not found or inactive");
    }

    // Calculate individual price sum
    const individualPriceSum = tests.reduce((sum, test) => sum + test.price, 0);

    // Create package
    const testPackage = await TestPackage.create({
        ...packageData,
        individualPriceSum,
    });

    return testPackage;
};

/**
 * Get all test packages for a lab
 */
export const getTestPackagesService = async (labId, filters = {}, page = 1, limit = 10) => {
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;
    limit = limit > 10 ? 10 : limit;
    const skip = (page - 1) * limit;

    const { isActive, departmentId, search } = filters;

    const query = { labId };

    // Default to showing only active packages (hide soft-deleted ones)
    if (isActive !== undefined) {
        query.isActive = isActive;
    } else {
        query.isActive = true;
    }

    if (departmentId) {
        query.departmentId = departmentId;
    }

    if (search) {
        query.$or = [
            { packageName: { $regex: search, $options: "i" } },
            { packageCode: { $regex: search, $options: "i" } },
        ];
    }

    const totalRecords = await TestPackage.countDocuments(query);
    const packages = await TestPackage.find(query)
        .populate("includedTests.testId", "testName price")
        .populate("departmentId", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    const totalPages = Math.ceil(totalRecords / limit);

    return {
        data: packages,
        totalRecords,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
    };
};

/**
 * Get test package by ID
 */
export const getTestPackageByIdService = async (packageId, labId) => {
    const testPackage = await TestPackage.findOne({
        _id: packageId,
        labId: labId,
    })
        .populate("includedTests.testId", "testName price parameters")
        .populate("departmentId", "name");

    if (!testPackage) {
        throw new ApiError(404, "Test package not found");
    }

    return testPackage;
};

/**
 * Update test package
 */
export const updateTestPackageService = async (packageId, labId, updateData) => {
    const testPackage = await TestPackage.findOne({
        _id: packageId,
        labId: labId,
    });

    if (!testPackage) {
        throw new ApiError(404, "Test package not found");
    }

    // If includedTests is being updated, recalculate individualPriceSum
    if (updateData.includedTests) {
        const testIds = updateData.includedTests.map((t) => t.testId);
        const tests = await LabTest.find({
            _id: { $in: testIds },
            labId: labId,
            isActive: true,
        });

        if (tests.length !== testIds.length) {
            throw new ApiError(400, "One or more tests not found or inactive");
        }

        updateData.individualPriceSum = tests.reduce(
            (sum, test) => sum + test.price,
            0
        );
    }

    Object.assign(testPackage, updateData);
    await testPackage.save();

    return testPackage;
};

/**
 * Delete (soft delete) test package
 */
export const deleteTestPackageService = async (packageId, labId) => {
    const testPackage = await TestPackage.findOne({
        _id: packageId,
        labId: labId,
    });

    if (!testPackage) {
        throw new ApiError(404, "Test package not found");
    }

    testPackage.isActive = false;
    await testPackage.save();

    return { message: "Test package deleted successfully" };
};

/**
 * Get package with expanded test details (for billing)
 */
export const getPackageForBillingService = async (packageId, labId) => {
    const testPackage = await TestPackage.findOne({
        _id: packageId,
        labId: labId,
        isActive: true,
    }).populate("includedTests.testId");

    if (!testPackage) {
        throw new ApiError(404, "Test package not found or inactive");
    }

    return testPackage;
};
