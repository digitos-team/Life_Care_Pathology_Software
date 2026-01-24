import Specialization from "../models/specialization.model.js";
import { ApiError } from "../utils/ApiError.js";

/**
 * Create a new specialization
 */
export const createSpecializationService = async (name, description, labId) => {
    // Check if specialization already exists for this lab
    const existing = await Specialization.findOne({ name, labId, isActive: true });
    if (existing) {
        throw new ApiError(400, "Specialization with this name already exists");
    }

    const specialization = await Specialization.create({
        name,
        description,
        labId,
    });

    return specialization;
};

/**
 * Get all specializations for a lab
 */
export const getAllSpecializationsService = async (labId, options = {}) => {
    const page = Math.max(1, parseInt(options.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(options.limit) || 50));
    const skip = (page - 1) * limit;

    const query = { labId, isActive: true };

    // Search by name if provided
    if (options.search) {
        query.name = { $regex: options.search, $options: "i" };
    }

    const [specializations, totalCount] = await Promise.all([
        Specialization.find(query).skip(skip).limit(limit).sort({ name: 1 }).lean(),
        Specialization.countDocuments(query),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return {
        specializations,
        pagination: {
            currentPage: page,
            totalPages,
            totalRecords: totalCount,
            recordsPerPage: limit,
        },
    };
};

/**
 * Get specialization by ID
 */
export const getSpecializationByIdService = async (id, labId) => {
    const specialization = await Specialization.findOne({
        _id: id,
        labId,
        isActive: true,
    }).lean();

    if (!specialization) {
        throw new ApiError(404, "Specialization not found");
    }

    return specialization;
};

/**
 * Update specialization
 */
export const updateSpecializationService = async (id, updates, labId) => {
    // Check if name is being updated and if it conflicts
    if (updates.name) {
        const existing = await Specialization.findOne({
            name: updates.name,
            labId,
            isActive: true,
            _id: { $ne: id },
        });

        if (existing) {
            throw new ApiError(400, "Specialization with this name already exists");
        }
    }

    const specialization = await Specialization.findOneAndUpdate(
        { _id: id, labId, isActive: true },
        updates,
        { new: true }
    );

    if (!specialization) {
        throw new ApiError(404, "Specialization not found");
    }

    return specialization;
};

/**
 * Delete specialization (soft delete)
 */
export const deleteSpecializationService = async (id, labId) => {
    const specialization = await Specialization.findOneAndUpdate(
        { _id: id, labId, isActive: true },
        { isActive: false },
        { new: true }
    );

    if (!specialization) {
        throw new ApiError(404, "Specialization not found");
    }

    return specialization;
};
