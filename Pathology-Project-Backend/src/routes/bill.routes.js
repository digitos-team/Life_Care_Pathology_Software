import express from "express";
import {
  getBillController,
  getPatientBillsController,
  getLabBillsController,
  getBillingReportController,
  downloadBillPDFController,
  downloadBillingReportController,
  deleteBillController,
  deleteBillOnlyController
} from "../controllers/bill.controller.js";
import { authMiddleware } from "../middleware/user.middleware.js";

const router = express.Router();

router.use(authMiddleware);

// Get billing report
router.get("/report", getBillingReportController);

// Download Billing Report (PDF/CSV)
router.get("/report/download", downloadBillingReportController);

// Get bill by ID
router.get("/:billId", getBillController);

// Download Individual Bill PDF
router.get("/:billId/download", downloadBillPDFController);

// Get patient bills
router.get("/patient/:patientId", getPatientBillsController);

// Get all lab bills
router.get("/", getLabBillsController);

// Delete bill
router.delete("/:billId", deleteBillController);

// Delete Bill Only (Cleanup)
router.delete("/:billId/cleanup", deleteBillOnlyController);

export default router;
