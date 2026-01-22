import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import * as commissionService from "../services/commission.service.js";
import { generateDoctorCommissionReportPDF } from "../utils/pdfGenerator.js";
import PDFDocument from "pdfkit";
import Doctor from "../models/doctor.model.js";

// Get doctor's monthly commission
export const getDoctorMonthlyCommissionController = asyncHandler(async (req, res) => {
    const { doctorId } = req.params;
    const { year, month } = req.query;

    const commission = await commissionService.getDoctorMonthlyCommission(
        doctorId,
        year || new Date().getFullYear(),
        month || new Date().getMonth() + 1
    );

    res.status(200).json(new ApiResponse(200, commission, "Monthly commission fetched successfully"));
});

// Get doctor's commission report
// Get ALL commissions with filtering (Daily/Monthly)
// Get ALL commissions with filtering (Daily/Monthly)
export const getAllCommissionsController = asyncHandler(async (req, res) => {
    const labId = req.user.labId;
    const { type, year, month, date, startDate, endDate, page = 1, limit = 10 } = req.query;

    let start, end;

    if (startDate && endDate) {
        start = new Date(startDate);
        end = new Date(endDate);
    } else if (type === 'monthly' && year && month) {
        start = new Date(year, month - 1, 1);
        end = new Date(year, month, 0, 23, 59, 59);
    } else if (type === 'daily' && date) {
        start = new Date(date);
        start.setHours(0, 0, 0, 0);
        end = new Date(date);
        end.setHours(23, 59, 59, 999);
    }

    const result = await commissionService.getAllCommissionsService(labId, start, end, Number(page), Number(limit));

    res.status(200).json(new ApiResponse(200, result, "All commissions fetched successfully"));
});

export const getDoctorCommissionReportController = asyncHandler(async (req, res) => {
    const { doctorId } = req.params;
    const { startDate, endDate } = req.query;

    const report = await commissionService.getDoctorCommissionReport(doctorId, startDate, endDate);
    res.status(200).json(new ApiResponse(200, report, "Commission report fetched successfully"));
});

// Download Doctor Commission PDF
export const downloadDoctorCommissionReportController = asyncHandler(async (req, res) => {
    const { doctorId } = req.params;
    const { startDate, endDate } = req.query;

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
        throw new ApiError(404, "Doctor not found");
    }

    const reportData = await commissionService.getDetailedDoctorCommission(doctorId, startDate, endDate);

    const doc = new PDFDocument({ margin: 30, size: "A4" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
        "Content-Disposition",
        `attachment; filename=Commission_Report_${doctor.name.replace(/ /g, "_")}.pdf`
    );

    doc.pipe(res);

    generateDoctorCommissionReportPDF(doc, reportData, doctor.name, startDate, endDate);

    doc.end();
});
