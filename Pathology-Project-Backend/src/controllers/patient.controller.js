import * as patientService from "../services/patient.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// Register Patient
export const createPatient = asyncHandler(async (req, res) => {
  console.log("[CONTROLLER] createPatient", req.body);
  const labId = req.user.labId;
  if (!labId) {
    throw new ApiError(
      400,
      "Lab ID is missing from your session. Please re-login."
    );
  }
  const patient = await patientService.createPatient(
    req.body,
    req.user.userId,
    labId
  );
  res
    .status(201)
    .json(new ApiResponse(201, patient, "Patient registered successfully"));
});
//   const patient = await patientService.createPatient(req.body, req.user.userId);

//   res
//     .status(201)
//     .json(new ApiResponse(201, patient, "Patient registered successfully"));
// });

// Get All Patients Added Pagination
export const getPatients = asyncHandler(async (req, res) => {
  const labId = req.user.labId;
  if (!labId) {
    throw new ApiError(
      400,
      "Lab ID is missing from your session. Please re-login."
    );
  }

  // Extract pagination and filter parameters from query string
  const options = {
    page: req.query.page,
    limit: req.query.limit,
    search: req.query.search,
    gender: req.query.gender,
    sortBy: req.query.sortBy,
    sortOrder: req.query.sortOrder,
    ageMin: req.query.ageMin,
    ageMax: req.query.ageMax,
    startDate: req.query.startDate,
    endDate: req.query.endDate,
  };

  const result = await patientService.getPatientsByLab(labId, options);

  res.status(200).json(
    new ApiResponse(
      200,
      {
        patients: result.patients,
        pagination: result.pagination,
      },
      "Patients fetched successfully"
    )
  );
});

// Get Patient Profile
export const getPatientById = asyncHandler(async (req, res) => {
  const labId = req.user.labId;
  if (!labId) {
    throw new ApiError(
      400,
      "Lab ID is missing from your session. Please re-login."
    );
  }
  const patient = await patientService.getPatientById(req.params.id, labId);
  if (!patient) throw new ApiError(404, "Patient not found");
  res
    .status(200)
    .json(
      new ApiResponse(200, patient, "Patient details fetched successfully")
    );
});

// Update Patient
export const updatePatient = asyncHandler(async (req, res) => {
  const labId = req.user.labId;
  if (!labId) {
    throw new ApiError(
      400,
      "Lab ID is missing from your session. Please re-login."
    );
  }
  const patient = await patientService.updatePatient(
    req.params.id,
    labId,
    req.body
  );
  if (!patient) throw new ApiError(404, "Patient not found");
  res
    .status(200)
    .json(new ApiResponse(200, patient, "Patient updated successfully"));
});

// Delete Patient
export const deletePatient = asyncHandler(async (req, res) => {
  const labId = req.user.labId;
  if (!labId) {
    throw new ApiError(
      400,
      "Lab ID is missing from your session. Please re-login."
    );
  }
  const patient = await patientService.deletePatient(req.params.id, labId);
  if (!patient) throw new ApiError(404, "Patient not found");
  res
    .status(200)
    .json(new ApiResponse(200, null, "Patient deleted successfully"));
});

// Search Patient
export const searchPatient = asyncHandler(async (req, res) => {
  const labId = req.user.labId;
  if (!labId) {
    throw new ApiError(
      400,
      "Lab ID is missing from your session. Please re-login."
    );
  }
  const patients = await patientService.searchPatient(labId, req.query);
  res.status(200).json(new ApiResponse(200, patients, "Patients found"));
});

// Get Today's Patients
export const getTodayPatients = asyncHandler(async (req, res) => {
  const labId = req.user.labId;
  if (!labId) {
    throw new ApiError(
      400,
      "Lab ID is missing from your session. Please re-login."
    );
  }
  const patients = await patientService.getTodayPatients(labId);
  res
    .status(200)
    .json(
      new ApiResponse(200, patients, "Today's patients fetched successfully")
    );
});

//get daily patient
export const getDailyPatient = asyncHandler(async (req, res) => {
  const { year, month } = req.query;

  if (!year || !month) {
    return res
      .status(400)
      .json(new ApiResponse(400, null, "Year and month are required"));
  }

  const labId = req.user.labId;

  const data = await patientService.dailypatient(
    labId,
    Number(year),
    Number(month)
  );

  res
    .status(200)
    .json(new ApiResponse(200, data, "Daily patient fetched successfully"));
});

// Get Total Patients Count
export const getTotalPatientCountController = asyncHandler(async (req, res) => {
  const labId = req.user.labId;
  if (!labId) {
    throw new ApiError(400, "Lab ID is missing from your session");
  }
  const count = await patientService.getTotalPatientCount(labId);
  res
    .status(200)
    .json(new ApiResponse(200, { totalPatients: count }, "Total patient count fetched successfully"));
});
