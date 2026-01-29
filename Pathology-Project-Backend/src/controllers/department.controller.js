import Department from "../models/department.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// @desc    Create a new department
// @route   POST /api/v1/departments
// @access  Private (Admin)
export const createDepartment = asyncHandler(async (req, res) => {
    const { name, description } = req.body;

    if (!name) {
        throw new ApiError(400, "Department name is required");
    }

    const existingDepartment = await Department.findOne({
        labId: req.user.labId,
        name: { $regex: new RegExp(`^${name}$`, "i") }, // Case-insensitive check
    });

    if (existingDepartment) {
        throw new ApiError(400, "Department with this name already exists");
    }

    const department = await Department.create({
        labId: req.user.labId,
        name,
        description,
    });

    return res
        .status(201)
        .json(new ApiResponse(201, department, "Department created successfully"));
});

// @desc    Get all departments for the logged-in lab
// @route   GET /api/v1/departments
// @access  Private
export const getDepartments = asyncHandler(async (req, res) => {
    const departments = await Department.find({ labId: req.user.labId }).sort({
        name: 1,
    });

    return res
        .status(200)
        .json(
            new ApiResponse(200, departments, "Departments fetched successfully")
        );
});

// @desc    Get single department
// @route   GET /api/v1/departments/:id
// @access  Private
export const getDepartmentById = asyncHandler(async (req, res) => {
    const department = await Department.findOne({
        _id: req.params.id,
        labId: req.user.labId,
    });

    if (!department) {
        throw new ApiError(404, "Department not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, department, "Department fetched successfully"));
});

// @desc    Update department
// @route   PUT /api/v1/departments/:id
// @access  Private (Admin)
export const updateDepartment = asyncHandler(async (req, res) => {
    const { name, description, isActive } = req.body;

    const department = await Department.findOne({
        _id: req.params.id,
        labId: req.user.labId,
    });

    if (!department) {
        throw new ApiError(404, "Department not found");
    }

    if (name && name !== department.name) {
        const existingDepartment = await Department.findOne({
            labId: req.user.labId,
            name: { $regex: new RegExp(`^${name}$`, "i") },
        });

        if (existingDepartment) {
            throw new ApiError(400, "Department with this name already exists");
        }
    }

    department.name = name || department.name;
    department.description =
        description !== undefined ? description : department.description;
    department.isActive = isActive !== undefined ? isActive : department.isActive;

    await department.save();

    return res
        .status(200)
        .json(new ApiResponse(200, department, "Department updated successfully"));
});

// @desc    Delete department
// @route   DELETE /api/v1/departments/:id
// @access  Private (Admin)
export const deleteDepartment = asyncHandler(async (req, res) => {
    const department = await Department.findOneAndDelete({
        _id: req.params.id,
        labId: req.user.labId,
    });

    if (!department) {
        throw new ApiError(404, "Department not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Department deleted successfully"));
});
// @desc    Search departments
// @route   GET /api/v1/departments/search
// @access  Private
export const searchDepartment = asyncHandler(async (req, res) => {
    const { query } = req.query;

    if (!query) {
        throw new ApiError(400, "Search query is required");
    }

    const departments = await Department.find({
        labId: req.user.labId,
        name: { $regex: query, $options: "i" },
    }).sort({ name: 1 });

    return res
        .status(200)
        .json(new ApiResponse(200, departments, "Departments searched successfully"));
});
