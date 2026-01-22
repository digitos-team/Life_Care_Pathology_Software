import express from "express";
import {
  createPatient,
  getPatients,
  getPatientById,
  updatePatient,
  deletePatient,
  searchPatient,
  getTodayPatients,
  getDailyPatient,
  getTotalPatientCountController,
} from "../controllers/patient.controller.js";

import {
  authMiddleware,
  adminMiddleware,
} from "../middleware/user.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { createPatient as createPatientSchema, updatePatient as updatePatientSchema } from "../validations/patient.validation.js";

const router = express.Router();

// All routes protected
router.use(authMiddleware);

// Register patient
router.post("/add", authMiddleware, validate(createPatientSchema), createPatient);

// Get all patients (lab-wise)
router.get("/getallpatient", getPatients);

// Search patient
router.get("/search", searchPatient);

// Patien   t profile
router.get("/getpatientbyid/:id", getPatientById);

// Update patient
router.put("/updatepatient/:id", validate(updatePatientSchema), updatePatient);

// Delete patient
router.delete("/deletepatient/:id", deletePatient);

// Today's patients
router.get("/today", getTodayPatients);

// Total patient count
router.get("/count", getTotalPatientCountController);

router.get("/daily", getDailyPatient);
export default router;
