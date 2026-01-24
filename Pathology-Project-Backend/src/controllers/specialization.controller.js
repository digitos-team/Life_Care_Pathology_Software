import {
    createSpecializationService,
    getAllSpecializationsService,
    getSpecializationByIdService,
    updateSpecializationService,
    deleteSpecializationService,
} from "../services/specialization.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export const createSpecialization = asyncHandler(async (req, res) => {
    const { name, description } = req.body;
    const labId = req.user.labId;

    const specialization = await createSpecializationService(
        name,
        description,
        labId
    );

    return res
        .status(201)
        .json(
            new ApiResponse(201, specialization, "Specialization created successfully")
        );
});

export const getAllSpecializations = asyncHandler(async (req, res) => {
    const labId = req.user.labId;
    const options = req.query;

    const result = await getAllSpecializationsService(labId, options);

    return res
        .status(200)
        .json(
            new ApiResponse(200, result, "Specializations retrieved successfully")
        );
});

export const getSpecializationById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const labId = req.user.labId;

    const specialization = await getSpecializationByIdService(id, labId);

    return res
        .status(200)
        .json(
            new ApiResponse(200, specialization, "Specialization retrieved successfully")
        );
});

export const updateSpecialization = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    const labId = req.user.labId;

    const specialization = await updateSpecializationService(id, updates, labId);

    return res
        .status(200)
        .json(
            new ApiResponse(200, specialization, "Specialization updated successfully")
        );
});

export const deleteSpecialization = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const labId = req.user.labId;

    await deleteSpecializationService(id, labId);

    return res
        .status(200)
        .json(
            new ApiResponse(200, null, "Specialization deleted successfully")
        );
});
