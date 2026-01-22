import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {
  createDoctorService,
  updateDoctorService,
  getAllDoctorsService,
  getDoctorCommissionReportService,
  getDoctorByIdService,
  deleteDoctorService,
} from "../services/doctor.services.js";
import Doctor from "../models/doctor.model.js";
import { ApiError } from "../utils/ApiError.js";
// 1. Add Doctor
export const addDoctorController = asyncHandler(async (req, res) => {
  const doctorData = req.body;
  const labId = req.user.labId;
  const existingDoctor = await Doctor.findOne({ email: doctorData.email });

  if (existingDoctor) {
    throw new ApiError(400, "Doctor with this email already exists");
  }

  const doctor = await createDoctorService(doctorData, labId);

  res
    .status(201)
    .json(new ApiResponse(201, doctor, "Doctor added successfully"));
});

// 2. Update Doctor
export const updateDoctorController = asyncHandler(async (req, res) => {
  const { doctorId } = req.params;
  const updates = req.body;

  const doctor = await updateDoctorService(doctorId, updates);

  res.json(new ApiResponse(200, doctor, "Doctor updated successfully"));
});

// 3. List All Doctors
export const getAllDoctorsController = asyncHandler(async (req, res) => {
  const labId = req.user.labId;
  const { page, limit } = req.query;

  const result = await getAllDoctorsService(labId, { page, limit });

  // Check if empty?
  if (!result.doctors || result.doctors.length === 0) {
    return res.json(
      new ApiResponse(
        200,
        { doctors: [], pagination: result.pagination },
        "No doctors found for this lab"
      )
    );
  }

  res.json(
    new ApiResponse(
      200,
      {
        doctors: result.doctors,
        pagination: result.pagination,
      },
      "Doctors fetched successfully"
    )
  );
});

// 4. Commission Reports (Daily, Monthly, Yearly)
export const getDoctorCommissionReportController = asyncHandler(
  async (req, res) => {
    const { doctorId } = req.params;
    const { type } = req.query; // 'daily', 'monthly', 'yearly'

    const report = await getDoctorCommissionReportService(doctorId, type);

    res.json(
      new ApiResponse(
        200,
        report,
        `${type} commission report fetched successfully`
      )
    );
  }
);

// 5. Delete Doctor
export const deleteDoctorController = asyncHandler(async (req, res) => {
  const { doctorId } = req.params;

  await deleteDoctorService(doctorId);

  res.json(new ApiResponse(200, {}, "Doctor deleted successfully"));
});
// 6. Get Doctor By ID
export const getDoctorByIdController = asyncHandler(async (req, res) => {
  const { doctorId } = req.params;
  const labId = req.user.labId;

  const doctor = await getDoctorByIdService(doctorId, labId);

  res.json(new ApiResponse(200, doctor, "Doctor details fetched successfully"));
});