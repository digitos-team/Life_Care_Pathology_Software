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
        start.setHours(0, 0, 0, 0);
        end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
    } else if (type === 'monthly' && year && month) {
        start = new Date(year, month - 1, 1);
        start.setHours(0, 0, 0, 0);
        end = new Date(year, month, 0, 23, 59, 59, 999);
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
    const labId = req.user.labId;

    const report = await commissionService.getDoctorCommissionReportService(doctorId, labId, startDate, endDate);
    res.status(200).json(new ApiResponse(200, report, "Commission report fetched successfully"));
});

export const getAllDoctorsCommissionSummary = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;
    const labId = req.user.labId;

    const summary = await commissionService.getAllDoctorsCommissionSummaryService(
        labId,
        startDate,
        endDate
    );

    return res
        .status(200)
        .json(
            new ApiResponse(200, summary, "Commission summary retrieved successfully")
        );
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

// Download Doctor Commission CSV
export const downloadDoctorCommissionCSVController = asyncHandler(async (req, res) => {
    const { doctorId } = req.params;
    const { startDate, endDate } = req.query;

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
        throw new ApiError(404, "Doctor not found");
    }

    const reportData = await commissionService.getDetailedDoctorCommission(doctorId, startDate, endDate);

    // Helper to escape CSV fields
    const escapeCSV = (val) => {
        const str = String(val ?? "");
        if (str.includes(",") || str.includes('"') || str.includes("\n")) {
            return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    };

    // Calculate summary stats
    let totalBill = 0;
    let totalComm = 0;
    reportData.forEach((item) => {
        totalBill += item.totalBillAmount || 0;
        totalComm += item.commissionAmount || 0;
    });
    const totalBills = reportData.length;
    const avgCommission = totalBills > 0 ? (totalComm / totalBills) : 0;

    const periodStart = startDate
        ? new Date(startDate).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })
        : "N/A";
    const periodEnd = endDate
        ? new Date(endDate).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })
        : "N/A";

    // Build CSV rows
    const rows = [];

    // ═══ REPORT HEADER ═══
    rows.push("LIFE CARE DIAGNOSTIC");
    rows.push("DOCTOR COMMISSION REPORT");
    rows.push("");

    // ═══ REPORT METADATA ═══
    rows.push(`Doctor Name:,${escapeCSV(doctor.name)}`);
    rows.push(`Specialization:,${escapeCSV(doctor.specialization || "General")}`);

    if (startDate && endDate) {
        rows.push(`Report Period:,${periodStart} to ${periodEnd}`);
    } else {
        rows.push("Report Period:,All Time");
    }
    rows.push(`Report Generated:,${new Date().toLocaleString("en-IN", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true })}`);
    rows.push(`Total Records:,${totalBills}`);
    rows.push("");

    // ═══ SUMMARY SECTION ═══
    rows.push("=== SUMMARY ===");
    rows.push(`Total Bills:,${totalBills}`);
    rows.push(`Total Business (Rs.):,${totalBill.toFixed(2)}`);
    rows.push(`Total Commission (Rs.):,${totalComm.toFixed(2)}`);
    rows.push(`Avg Commission per Bill (Rs.):,${avgCommission.toFixed(2)}`);
    if (totalBill > 0) {
        rows.push(`Commission Rate (%):,${((totalComm / totalBill) * 100).toFixed(2)}%`);
    }
    rows.push("");

    // ═══ DATA TABLE ═══
    rows.push("=== DETAILED BREAKDOWN ===");
    rows.push("S.No.,Date,Patient Name,Tests Performed,Bill Amount (Rs.),Commission Amount (Rs.),Commission %");

    reportData.forEach((item, idx) => {
        const date = new Date(item.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
        const patient = item.patientName || "N/A";
        const tests = item.testOrder || "N/A";
        const billAmt = (item.totalBillAmount || 0);
        const commAmt = (item.commissionAmount || 0);
        const commPct = billAmt > 0 ? ((commAmt / billAmt) * 100).toFixed(1) + "%" : "0%";

        rows.push([
            idx + 1,
            escapeCSV(date),
            escapeCSV(patient),
            escapeCSV(tests),
            billAmt.toFixed(2),
            commAmt.toFixed(2),
            commPct
        ].join(","));
    });

    // ═══ TOTALS ROW ═══
    rows.push("");
    rows.push(`,,,TOTAL:,${totalBill.toFixed(2)},${totalComm.toFixed(2)},`);
    rows.push("");

    // ═══ FOOTER ═══
    rows.push("--- End of Report ---");
    rows.push(`This report is system-generated by Life Care Diagnostic.`);

    const csvContent = "\uFEFF" + rows.join("\r\n"); // BOM + CRLF for Excel

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
        "Content-Disposition",
        `attachment; filename=Commission_Report_${doctor.name.replace(/ /g, "_")}_${startDate && endDate ? `${startDate}_to_${endDate}` : "All_Time"}.csv`
    );

    res.send(csvContent);
});
