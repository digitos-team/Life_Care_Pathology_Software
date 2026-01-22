import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import PDFDocument from "pdfkit";
import { ApiError } from "../utils/ApiError.js";
import { generateExpenseReportPDF } from "../utils/pdfGenerator.js";
import PathologyLab from "../models/pathologyLab.model.js";
import {
  createExpenseService,
  updateExpenseService,
  listExpensesService,
  deleteExpenseService,
  getExpenseByIdService,
  getExpenseReportService,
  getExpenseStatsService,
  createBatchExpensesService,
} from "../services/expense.services.js";

/* -------------------- 1. Add Expense -------------------- */
export const addExpenseController = asyncHandler(async (req, res) => {
  const labId = req.user.labId;
  if (!labId) {
    throw new ApiError(400, "Lab ID is missing from your session. Please re-login.");
  }

  const expenseData = req.body;

  if (req.file) {
    expenseData.receiptUrl = `temp/${req.file.filename}`;
  }

  const expense = await createExpenseService(expenseData, labId);

  res.status(201).json(
    new ApiResponse(201, expense, "Expense added successfully")
  );
});

/* -------------------- 1.5 Batch Add Expenses -------------------- */
export const addBatchExpensesController = asyncHandler(async (req, res) => {
  const labId = req.user.labId;
  let { expenses } = req.body;

  if (!labId) {
    throw new ApiError(400, "Lab ID is missing from session.");
  }

  // Parse expenses if it's a string (FormData sends arrays as strings)
  if (typeof expenses === 'string') {
    try {
      expenses = JSON.parse(expenses);
    } catch (error) {
      console.error('Failed to parse expenses JSON:', error.message);
      throw new ApiError(400, "Invalid expenses data format.");
    }
  }

  if (!expenses || !Array.isArray(expenses) || expenses.length === 0) {
    console.error('Invalid expenses array:', { expenses, type: typeof expenses, isArray: Array.isArray(expenses) });
    throw new ApiError(400, "Invalid or empty expenses list.");
  }

  // Handle Common Receipt
  let receiptUrl = null;
  if (req.file) {
    receiptUrl = `temp/${req.file.filename}`;
  }

  // Attach receiptUrl to all items if present
  if (receiptUrl) {
    expenses = expenses.map(exp => ({ ...exp, receiptUrl }));
  }

  try {
    const createdExpenses = await createBatchExpensesService(expenses, labId);

    res.status(201).json(
      new ApiResponse(
        201,
        createdExpenses,
        `${createdExpenses.length} expenses added successfully`
      )
    );
  } catch (error) {
    console.error('Batch expense creation error:', error);
    throw new ApiError(500, error.message || 'Failed to create batch expenses');
  }
});

/* -------------------- 2. Update Expense -------------------- */
export const updateExpenseController = asyncHandler(async (req, res) => {
  const { expenseId } = req.params;
  const updates = req.body;

  if (req.file) {
    updates.receiptUrl = `temp/${req.file.filename}`;
  }

  const expense = await updateExpenseService(expenseId, updates);

  res.json(
    new ApiResponse(200, expense, "Expense updated successfully")
  );
});

/* -------------------- 3. List Expenses -------------------- */
export const listExpensesController = asyncHandler(async (req, res) => {
  const adminId = req.user.userId;
  const query = req.query;

  const expenses = await listExpensesService(adminId, query);

  res.json(
    new ApiResponse(200, expenses, "Expenses fetched successfully")
  );
});

/* -------------------- 4. Delete Expense -------------------- */
export const deleteExpenseController = asyncHandler(async (req, res) => {
  const { expenseId } = req.params;

  await deleteExpenseService(expenseId);

  res.json(
    new ApiResponse(200, {}, "Expense deleted successfully")
  );
});

/* -------------------- 5. Get Expense By ID -------------------- */
export const getExpenseByIdController = asyncHandler(async (req, res) => {
  const { expenseId } = req.params;

  const expense = await getExpenseByIdService(expenseId);

  res.json(
    new ApiResponse(200, expense, "Expense details fetched successfully")
  );
});

/* -------------------- 6. Get Expense Report -------------------- */
export const getExpenseReportController = asyncHandler(async (req, res) => {
  const labId = req.user.labId;
  const { type, year, month } = req.query;

  if (!labId) {
    throw new ApiError(400, "Lab ID is missing from your session. Please re-login.");
  }
  if (!type || !year) {
    throw new ApiError(400, "Type and Year are required");
  }
  if (type === "monthly" && !month) {
    throw new ApiError(400, "Month is required for monthly reports");
  }

  const report = await getExpenseReportService(labId, type, year, month);

  res.json(
    new ApiResponse(200, report, "Expense report fetched successfully")
  );
});

/* -------------------- 7. Download Expense Report (PDF) -------------------- */
export const downloadExpenseReportController = asyncHandler(async (req, res) => {
  const adminId = req.user.userId;
  const { type, year, month } = req.query;

  // Find the lab by owner to ensure we use the correct ID (consistent with listExpensesService)
  const lab = await PathologyLab.findOne({ owner: adminId });

  if (!lab) {
    throw new ApiError(404, "Lab not found for this user.");
  }

  if (!type || !year) {
    throw new ApiError(400, "Type and Year are required");
  }

  const reportData = await getExpenseReportService(
    lab._id,
    type,
    year,
    month
  );

  const doc = new PDFDocument({ margin: 30 });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=Expense_Report_${year}_${type}.pdf`
  );

  doc.pipe(res);
  generateExpenseReportPDF(doc, reportData.breakdown, type, year, month);
  doc.end();
});

/* -------------------- 8. Get Expense Stats -------------------- */
export const getExpenseStatsController = asyncHandler(async (req, res) => {
  const labId = req.user.labId;

  if (!labId) {
    throw new ApiError(400, "Lab ID is missing from your session. Please re-login.");
  }

  const stats = await getExpenseStatsService(labId);

  res.json(
    new ApiResponse(200, stats, "Expense stats fetched successfully")
  );
});
