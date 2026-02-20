import express from "express";
import {
    getDoctorMonthlyCommissionController,
    getDoctorCommissionReportController,
    downloadDoctorCommissionReportController,
    downloadDoctorCommissionCSVController,
    getAllCommissionsController,
    getAllDoctorsCommissionSummary
} from "../controllers/commission.controller.js";
import { authMiddleware } from "../middleware/user.middleware.js";

const router = express.Router();

router.use(authMiddleware);

// Get Commission Summary for all doctors
router.get("/summary", getAllDoctorsCommissionSummary);

// Get ALL commissions (Global report)
router.get("/all", getAllCommissionsController);

// Get doctor's monthly commission
router.get("/doctor/:doctorId/monthly", getDoctorMonthlyCommissionController);

// Get doctor's commission report (JSON)
router.get("/doctor/:doctorId/report", getDoctorCommissionReportController);

// Download Doctor Commission PDF
router.get("/doctor/:doctorId/report/pdf", downloadDoctorCommissionReportController);

// Download Doctor Commission CSV
router.get("/doctor/:doctorId/report/csv", downloadDoctorCommissionCSVController);

export default router;
