import express from "express";
import {
  createTestOrderController as assignTestController,
  submitTestResultController,
  getPendingOrdersController as getPendingTestsController,
  getPatientTestHistoryController,
  getPatientOrdersController,
  getPatientReportsController as getPatientCompletedReportsController,
  addHistoricalReportController,
  submitBulkResultsController,
  finalizeTestOrderController,
  generateAndSendReportViaEmail,
  deleteTestOrderController,
  downloadTestReportPDFController,
  getPatientReportsController,
  getAllReportsController,
  getDailyStatsController,
  unfinalizeReportController,
} from "../controllers/testReport.controller.js";
import {
  authMiddleware,
  adminMiddleware,
} from "../middleware/user.middleware.js";
import { upload } from "../middleware/multer.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { createTestOrder } from "../validations/testOrder.validation.js";

const router = express.Router();

// Protected Routes
router.use(authMiddleware);

// Assign Test (Receptionist/Admin)
router.post("/createtestorder", validate(createTestOrder), assignTestController);

// Get Daily Stats (Dashboard)
router.get("/stats/daily", getDailyStatsController);

// Add Historical/External Report (Receptionist/Admin)
router.post(
  "/add-report",
  upload.single("reportFileUrl"),
  addHistoricalReportController
);

// Submit Results (Technician/Admin)
router.put("/result/:orderId/:testItemId", submitTestResultController);

// Bulk Submit Results via Bill (Technician/Admin)
router.put("/bill/:billId/submit", submitBulkResultsController);

// Get Pending Tests (Technician Dashboard)
router.get("/pending", getPendingTestsController);

// Finalize Test Order (Technician/Admin)
router.get("/finalize/:orderId", finalizeTestOrderController);

// Sent Report Via Email
router.get("/send-report/:orderId", generateAndSendReportViaEmail);

// Get Patient Active Orders
router.get("/patient/:patientId/orders", getPatientOrdersController);

// Get Patient Completed Reports
router.get("/patient/:patientId/reports", getPatientCompletedReportsController);

// Get Patient History (Combined)
router.get("/patient/:patientId", getPatientTestHistoryController);

// Get All Completed Reports (Global for lab)
router.get("/reports/all", getAllReportsController);

// Download Test Report PDF
router.get("/:orderId/download", downloadTestReportPDFController);

// Delete Test Order
router.delete("/:orderId", deleteTestOrderController);

// Unfinalize Report (Undo for Correction)
router.post("/unfinalize/:orderId", unfinalizeReportController);

export default router;
