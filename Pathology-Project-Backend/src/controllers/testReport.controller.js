import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import * as testOrderService from "../services/testReport.service.js";
import { sendReportEmail } from "../services/email.service.js";
import Patient from "../models/patient.model.js";
import PDFDocument from "pdfkit";
import { generateTestReportPDF } from "../utils/pdfGenerator.js";
import { generatePDFFromTemplate } from "../utils/puppeteerGenerator.js";
import { generateHeaderTemplate, generateFooterTemplate } from "../utils/pdfTemplateHelper.js";
import PathologyLab from "../models/pathologyLab.model.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOGO_PATH = path.join(__dirname, "..", "assets", "logo.jpeg");

/**
 * Helper to convert image to base64 for HTML templates
 */
const getBase64Image = (filePath) => {
  try {
    const bitmap = fs.readFileSync(filePath);
    const extension = path.extname(filePath).replace(".", "");
    return `data:image/${extension};base64,${bitmap.toString("base64")}`;
  } catch (err) {
    console.error("Error reading logo for PDF:", err);
    return null;
  }
};
import TestOrder from "../models/testorder.model.js";

/**
 * 1. Create Test Order (assign multiple tests)
 */
export const createTestOrderController = asyncHandler(async (req, res) => {
  console.log('createTestOrderController - Request body:', JSON.stringify(req.body, null, 2));

  const { patientId, testIds = [], packageIds = [], doctorId, discountId } = req.body || {};

  console.log('createTestOrderController - Extracted values:', {
    patientId,
    testIdsCount: testIds.length,
    packageIdsCount: packageIds.length,
    doctorId,
    discountId
  });

  const labId = req.user.labId;
  if (!labId) {
    throw new ApiError(
      400,
      "Lab ID is missing from your session. Please re-login."
    );
  }

  // Validation is now handled by Joi schema
  const data = await testOrderService.createTestOrder({
    patientId,
    testIds,
    packageIds,
    doctorId,
    labId,
    discountId,
  });

  res
    .status(201)
    .json(new ApiResponse(201, data, "Test order created successfully"));
});

/**
 * 2. Add historical report
 */
export const addHistoricalReportController = asyncHandler(async (req, res) => {
  const { patientId, testName, reportFileUrl, doctorName, testDate, testId } =
    req.body;
  const labId = req.user.labId;
  if (!labId) {
    throw new ApiError(
      400,
      "Lab ID is missing from your session. Please re-login."
    );
  }

  if (!patientId || !testName || !reportFileUrl) {
    throw new ApiError(
      400,
      "patientId, testName and reportFileUrl are required"
    );
  }

  const report = await testOrderService.addHistoricalReport({
    patientId,
    testName,
    doctorName,
    testDate,
    reportFileUrl,
    labId,
    testId,
  });

  res.status(201).json(new ApiResponse(201, report, "Historical report added"));
});

/**
 * 3. Submit result for ONE test inside an order
 */
export const submitTestResultController = asyncHandler(async (req, res) => {
  const { orderId, testItemId } = req.params;
  const { results, reportFileUrl } = req.body || {};

  if (!orderId || !testItemId) {
    throw new ApiError(400, "orderId and testItemId are required");
  }

  const order = await testOrderService.submitTestResults(orderId, testItemId, {
    results,
    reportFileUrl,
  });

  res.status(200).json(new ApiResponse(200, order, "Test result submitted"));
});

/**
 * 4. Get pending orders
 */
export const getPendingOrdersController = asyncHandler(async (req, res) => {
  const labId = req.user.labId;
  if (!labId) {
    throw new ApiError(
      400,
      "Lab ID is missing from your session. Please re-login."
    );
  }

  const orders = await testOrderService.getPendingOrders(labId);

  res.status(200).json(new ApiResponse(200, orders, "Pending orders fetched"));
});

/**
 * 5. Get patient history (orders + reports)
 */
export const getPatientTestHistoryController = asyncHandler(
  async (req, res) => {
    const { patientId } = req.params;
    const labId = req.user.labId;
    if (!labId) {
      throw new ApiError(
        400,
        "Lab ID is missing from your session. Please re-login."
      );
    }

    if (!patientId) {
      throw new ApiError(400, "patientId is required");
    }

    const data = await testOrderService.getPatientTestHistory(patientId, labId);

    res
      .status(200)
      .json(new ApiResponse(200, data, "Patient test history fetched"));
  }
);

/**
 * 5b. Get patient orders
 */
export const getPatientOrdersController = asyncHandler(async (req, res) => {
  const { patientId } = req.params;
  const labId = req.user.labId;
  if (!labId) {
    throw new ApiError(
      400,
      "Lab ID is missing from your session. Please re-login."
    );
  }

  const orders = await testOrderService.getPatientOrders(patientId, labId);
  res.json(new ApiResponse(200, orders, "Patient orders fetched"));
});

/**
 * 5c. Get patient completed reports
 */
export const getPatientReportsController = asyncHandler(async (req, res) => {
  const { patientId } = req.params;
  const labId = req.user.labId;
  if (!labId) {
    throw new ApiError(
      400,
      "Lab ID is missing from your session. Please re-login."
    );
  }

  const reports = await testOrderService.getPatientReports(patientId, labId);
  res.json(new ApiResponse(200, reports, "Patient reports fetched"));
});

/**
 * 5d. Get all completed reports for lab
 */
export const getAllReportsController = asyncHandler(async (req, res) => {
  const labId = req.user.labId;
  const { search, page = 1, limit = 50 } = req.query;
  const data = await testOrderService.getAllReportsForLab(labId, parseInt(limit), search, parseInt(page));
  res.json(new ApiResponse(200, data, "All lab reports fetched with pagination"));
});

/**
 * 6. Bulk submit results via bill
 */
export const submitBulkResultsController = asyncHandler(async (req, res) => {
  const { billId } = req.params;
  const { results, reportFileUrl } = req.body || {};

  if (!billId) {
    throw new ApiError(400, "billId is required");
  }

  const order = await testOrderService.submitBulkResultsByBill(billId, {
    results,
    reportFileUrl,
  });

  res.status(200).json(new ApiResponse(200, order, "Bulk results submitted"));
});

/**
 * 7. Finalize order → generate reports
 */
export const finalizeTestOrderController = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  const reports = await testOrderService.finalizeTestOrder(orderId);

  res
    .status(200)
    .json(
      new ApiResponse(200, reports, "Order finalized and reports generated")
    );
});

/**
 * 8. Download Test Report PDF
 */
export const downloadTestReportPDFController = asyncHandler(
  async (req, res) => {
    const { orderId } = req.params;

    const order = await testOrderService.getTestOrderById(orderId);
    if (!order) {
      throw new ApiError(404, "Test Order not found");
    }

    // Mark as downloaded BEFORE starting the stream to avoid stream errors
    await testOrderService.markAsDownloaded(orderId);

    const lab = await PathologyLab.findById(order.labId);
    if (!lab) {
      throw new ApiError(404, "Lab details not found");
    }

    const filename = `Report-${order.patientId.fullName.replace(
      /[^a-zA-Z0-9]/g,
      "_"
    )}-${Date.now()}.pdf`;

    const reportsDir = path.join(process.cwd(), "uploads", "reports");
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const filePath = path.join(reportsDir, filename);
    const reportPdfPath = `/uploads/reports/${filename}`;

    // Get Logo as Base64 for the template
    const logoBase64 = getBase64Image(LOGO_PATH);

    const ISO_MARK_PATH = path.join(process.cwd(), "public", "images", "iso_mark.jpg");
    const FOOTER_STAMP_PATH = path.join(process.cwd(), "public", "images", "footer_stamp.jpg");
    const HEADER_IMG_PATH = path.join(process.cwd(), "public", "images", "header_img.jpg");
    const FOOTER_IMG_PATH = path.join(process.cwd(), "public", "images", "footer_img.jpg");

    const isoMarkBase64 = getBase64Image(ISO_MARK_PATH);
    const footerStampBase64 = getBase64Image(FOOTER_STAMP_PATH);
    const headerImgBase64 = getBase64Image(HEADER_IMG_PATH);
    const footerImgBase64 = getBase64Image(FOOTER_IMG_PATH);

    // Build the footer template for Puppeteer's displayHeaderFooter
    const footerTemplate = generateFooterTemplate({
      footerStamp: footerStampBase64,
      isoMark: isoMarkBase64,
      footerImg: footerImgBase64
    });

    // Generate PDF using Puppeteer with displayHeaderFooter
    const pdfBuffer = await generatePDFFromTemplate("report", {
      order,
      lab,
      logo: logoBase64,
      headerImg: headerImgBase64,
    }, {
      headerTemplate: '<div></div>',
      footerTemplate: footerTemplate,
      marginTop: '10mm',
      marginBottom: '290px',
    });

    // Save to file
    fs.writeFileSync(filePath, pdfBuffer);

    // Update patient status
    await Patient.findByIdAndUpdate(order.patientId._id, {
      reportPdfPath: reportPdfPath,
      reportStatus: "generated",
    });

    console.log("Report generated & saved:", reportPdfPath);

    // Send to response
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(pdfBuffer);
  }
);
// Sends Report to patient Via Email
export const generateAndSendReportViaEmail = asyncHandler(async (req, res) => {
  let order;

  try {
    const { orderId } = req.params;

    // 🔹 STEP 1 — FETCH ORDER & PATIENT
    order = await TestOrder.findById(orderId).populate("patientId");

    if (!order) {
      return res.status(404).json({ message: "Test order not found" });
    }

    const patient = order.patientId;
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    if (!patient.email) {
      return res.status(400).json({ message: "Patient email missing" });
    }

    // Use order's report path if it exists, otherwise fallback to patient's (legacy)
    const pdfPath = order.reportPdfPath
      ? path.join(process.cwd(), order.reportPdfPath)
      : patient.reportPdfPath
        ? path.join(process.cwd(), patient.reportPdfPath)
        : null;

    if (!pdfPath) {
      return res.status(400).json({ message: "Report PDF not generated yet" });
    }

    // 🔹 STEP 2 — SEND EMAIL
    const sendsEmail = await sendReportEmail({
      to: patient.email,
      pdfPath: pdfPath,
      patientName: patient.fullName,
    });

    // 🔹 STEP 3 — UPDATE STATUS
    order.isEmailed = true;
    await order.save();

    // Legacy support for patient status
    patient.reportStatus = "sent";
    patient.emailSentAt = new Date();
    await patient.save();

    return res
      .status(200)
      .json(new ApiResponse(200, sendsEmail, "Report sent successfully"));
  } catch (error) {
    console.error(error);
    throw new ApiError(500, "Failed to send report");
  }
});

/**
 * 9. Delete Test Order
 */
export const deleteTestOrderController = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const labId = req.user.labId;

  if (!orderId) {
    throw new ApiError(400, "orderId is required");
  }

  const result = await testOrderService.deleteTestOrder(orderId, labId);

  res.status(200).json(new ApiResponse(200, result, result.message));
});

/**
 * 10. Get Daily Test Stats
 */
export const getDailyStatsController = asyncHandler(async (req, res) => {
  const labId = req.user.labId;
  const stats = await testOrderService.getDailyStats(labId);
  res.status(200).json(new ApiResponse(200, stats, "Daily stats fetched"));
});

/**
 * 11. Unfinalize Report (Undo for Correction)
 */
export const unfinalizeReportController = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const labId = req.user.labId;

  if (!orderId) {
    throw new ApiError(400, "orderId is required");
  }

  const result = await testOrderService.unfinalizeReport(orderId, labId);

  res.status(200).json(new ApiResponse(200, result, "Report unlocked for revision. It will now appear in Pending Orders."));
});
