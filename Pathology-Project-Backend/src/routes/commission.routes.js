import express from "express";
import {
    getDoctorMonthlyCommissionController,
    getDoctorCommissionReportController,
    downloadDoctorCommissionReportController,
    getAllCommissionsController
} from "../controllers/commission.controller.js";
import { authMiddleware } from "../middleware/user.middleware.js";

const router = express.Router();

router.use(authMiddleware);

// Get ALL commissions (Global report)
router.get("/all", getAllCommissionsController);

// Get doctor's monthly commission
router.get("/doctor/:doctorId/monthly", getDoctorMonthlyCommissionController);

// Get doctor's commission report (JSON)
router.get("/doctor/:doctorId/report", getDoctorCommissionReportController);

// Download Doctor Commission PDF
router.get("/doctor/:doctorId/report/pdf", downloadDoctorCommissionReportController);

export default router;
