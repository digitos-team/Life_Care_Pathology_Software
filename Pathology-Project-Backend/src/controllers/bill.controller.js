import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import * as billService from "../services/bill.service.js";
import PathologyLab from "../models/pathologyLab.model.js";
import PDFDocument from "pdfkit";
import * as pdfGenerator from "../utils/pdfGenerator.js";

// Get bill by ID
export const getBillController = asyncHandler(async (req, res) => {
  const { billId } = req.params;
  const bill = await billService.getBillById(billId);
  res.status(200).json(new ApiResponse(200, bill, "Bill fetched successfully"));
});

// Get patient bills
export const getPatientBillsController = asyncHandler(async (req, res) => {
  const { patientId } = req.params;
  const labId = req.user.labId;
  const bills = await billService.getPatientBills(patientId, labId);
  res
    .status(200)
    .json(new ApiResponse(200, bills, "Patient bills fetched successfully"));
});

// Get all lab bills (with pagination and search)
export const getLabBillsController = asyncHandler(async (req, res) => {
  const labId = req.user.labId;
  const { limit, page, search } = req.query;

  const data = await billService.getLabBills(
    labId,
    limit ? parseInt(limit) : 12,
    search || "",
    page ? parseInt(page) : 1
  );

  res
    .status(200)
    .json(new ApiResponse(200, data, "Lab bills fetched successfully"));
});

// Get Billing Report
export const getBillingReportController = asyncHandler(async (req, res) => {
  const { type, year, month } = req.query;
  const labId = req.user.labId;

  if (!type || !year) {
    throw new ApiError(400, "Type and Year are required");
  }

  const report = await billService.getBillingReportService(
    labId,
    type,
    year,
    month
  );
  res
    .status(200)
    .json(new ApiResponse(200, report, "Billing report fetched successfully"));
});

// Download Individual Bill PDF
export const downloadBillPDFController = asyncHandler(async (req, res) => {
  const { billId } = req.params;
  const labId = req.user.labId;

  const bill = await billService.getBillById(billId);
  const lab = await PathologyLab.findById(labId);

  if (!lab) throw new ApiError(404, "Lab not found");

  const doc = new PDFDocument({ margin: 30, size: "A4" });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=Bill_${bill.billNumber}.pdf`
  );

  doc.pipe(res);
  pdfGenerator.generateBillPDF(doc, bill, lab);
  doc.end();
});

// Download Billing Report (PDF/CSV)
export const downloadBillingReportController = asyncHandler(
  async (req, res) => {
    const { type, year, month, format = "pdf" } = req.query;
    const labId = req.user.labId;

    if (!type || !year) {
      throw new ApiError(400, "Type and Year are required");
    }

    const reportData = await billService.getBillingReportService(
      labId,
      type,
      year,
      month
    );

    if (format === "csv") {
      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=Billing_Report_${year}_${type}.csv`
      );
      // Simple CSV generation
      let csv = "Date/Period,Bill Count,Total Revenue\n";
      reportData.forEach((row) => {
        csv += `${row._id},${row.billCount},${row.totalRevenue}\n`;
      });
      return res.send(csv);
    }

    const doc = new PDFDocument({ margin: 30 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Billing_Report_${year}_${type}.pdf`
    );

    doc.pipe(res);
    pdfGenerator.generateBillingReportPDF(doc, reportData, type, year, month);
    doc.end();
  }
);

// Delete Bill
// Delete Bill (Cleanup - Bill Only)
export const deleteBillOnlyController = asyncHandler(async (req, res) => {
  const { billId } = req.params;
  const labId = req.user.labId;

  await billService.deleteBillOnly(billId, labId);

  res
    .status(200)
    .json(new ApiResponse(200, null, "Bill deleted successfully (Cleanup)"));
});

// Delete Bill (Cascade - Full Delete)
export const deleteBillController = asyncHandler(async (req, res) => {
  const { billId } = req.params;
  const labId = req.user.labId;

  await billService.deleteBillWithCascade(billId, labId);

  res
    .status(200)
    .json(new ApiResponse(200, null, "Bill and associated data deleted successfully"));
});
