import Expense from "../models/expense.model.js";
import PathologyLab from "../models/pathologyLab.model.js";
import Doctor from "../models/doctor.model.js";
import { ApiError } from "../utils/ApiError.js";
import mongoose from "mongoose";

// 1. Create Expense
export const createExpenseService = async (data, labId) => {
  if (data.amount <= 0) throw new ApiError(400, "Invalid amount");

  // We already have labId from the controller

  let finalAmount = data.amount;

  // If quantity is provided (e.g. for LAB_MATERIALS), calculate Total = Rate * Quantity
  if (data.quantity && data.quantity > 0) {
    finalAmount = data.amount * data.quantity;
  }

  const expense = await Expense.create({
    ...data,
    amount: finalAmount, // Store the calculated total
    lab: labId,
  });

  return expense;
};

// 1.5 Batch Create Expenses (Optimized for Bulk Insert)
export const createBatchExpensesService = async (expenses, labId) => {
  if (!expenses || expenses.length === 0) {
    return [];
  }

  // Pre-process items to calculate amounts and attach labId
  const expensesToInsert = expenses.map(item => {
    let finalAmount = item.amount;
    if (item.quantity && item.quantity > 0) {
      finalAmount = item.amount * item.quantity;
    }

    // Ensure date is a valid Date object
    let dateValue = item.date;
    if (typeof dateValue === 'string') {
      dateValue = new Date(dateValue);
    } else if (!dateValue) {
      dateValue = new Date();
    }

    return {
      ...item,
      amount: finalAmount,
      date: dateValue,
      lab: labId
    };
  });

  try {
    // insertMany is significantly faster than looped create
    // Note: Transactions removed as they require MongoDB replica sets
    const createdExpenses = await Expense.insertMany(expensesToInsert);
    return createdExpenses;
  } catch (error) {
    console.error('insertMany failed:', error.message, error.writeErrors?.[0]?.err);
    throw error;
  }
};

// 2. Update Expense
export const updateExpenseService = async (expenseId, updates) => {
  const existing = await Expense.findById(expenseId);
  if (!existing) {
    throw new ApiError(404, "Expense not found");
  }

  // Treat updates.amount as NEW RATE if quantity exists
  const r = updates.amount !== undefined ? updates.amount : (existing.quantity > 0 ? (existing.amount / existing.quantity) : existing.amount);
  const q = updates.quantity !== undefined ? updates.quantity : existing.quantity;

  if (q > 0) {
    updates.amount = r * q; // Store total = rate * qty
  }

  const expense = await Expense.findByIdAndUpdate(expenseId, updates, {
    new: true,
  });

  return expense;
};


// 3. List Expenses (with optional filters)
export const listExpensesService = async (adminId, query) => {
  const lab = await PathologyLab.findOne({ owner: adminId });
  if (!lab) {
    return {
      data: [],
      pagination: {
        totalRecords: 0,
        totalPages: 0,
        currentPage: 1,
        limit: 10,
      },
    };
  }

  const filter = { lab: lab._id };

  // Date Range Filter
  if (query.month) {
    // query.month format: "YYYY-MM"
    const [year, month] = query.month.split("-");
    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999);

    filter.date = { $gte: startDate, $lte: endDate };
  } else if (query.startDate && query.endDate) {
    const startOfDay = new Date(query.startDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(query.endDate);
    endOfDay.setHours(23, 59, 59, 999);

    filter.date = { $gte: startOfDay, $lte: endOfDay };
  } else if (query.date) {
    const startOfDay = new Date(query.date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(query.date);
    endOfDay.setHours(23, 59, 59, 999);

    filter.date = { $gte: startOfDay, $lte: endOfDay };
  }

  // Category Filter
  if (query.category) {
    filter.category = query.category;
  } else if (query.excludeCategory) {
    filter.category = { $ne: query.excludeCategory };
  }

  // Search Pattern (Title, Category, Supplier)
  if (query.search) {
    filter.$text = { $search: query.search };
  }

  // Doctor Filter
  if (query.doctor) {
    filter.doctor = query.doctor;
  }


  // 🔹 Pagination Logic
  const page = parseInt(query.page, 10) || 1;
  const limit = parseInt(query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  // 🔹 Count total records
  const totalRecords = await Expense.countDocuments(filter);

  // 🔹 Fetch paginated data
  const expenses = await Expense.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("lab", "labName")
    .populate("doctor", "name");

  return {
    data: expenses,
    pagination: {
      totalRecords,
      totalPages: Math.ceil(totalRecords / limit),
      currentPage: page,
      limit,
    },
  };
};

// 4. Delete Expense
export const deleteExpenseService = async (expenseId) => {
  const expense = await Expense.findByIdAndDelete(expenseId);
  if (!expense) {
    throw new ApiError(404, "Expense not found");
  }
  return expense;
};

// 6. Get Expense Report (Monthly/Yearly)
export const getExpenseReportService = async (labId, type, year, month, timezone) => {
  const labObjectId = new mongoose.Types.ObjectId(labId);

  const matchStage = {
    lab: labObjectId,
  };

  const targetYear = parseInt(year);
  const targetMonth = parseInt(month) - 1; // JS months are 0-indexed

  // Enforce 'Asia/Kolkata' timezone as per user request (Clients are exclusively from India)
  // This ensures correct reporting regardless of Server Location (e.g. Malaysia) or Client System Time.
  const reportTimezone = "Asia/Kolkata";

  // Calculate Loose Range (Server Time +/- 2 days) to fully cover the target period in any timezone
  // This allows us to use the index for the bulk of filtering, then refine with accurate timezone logic
  let looseStart, looseEnd;

  if (type === "monthly") {
    looseStart = new Date(targetYear, targetMonth, 1);
    looseStart.setDate(looseStart.getDate() - 2); // Buffer

    looseEnd = new Date(targetYear, targetMonth + 1, 1);
    looseEnd.setDate(looseEnd.getDate() + 2); // Buffer
  } else if (type === "yearly") {
    looseStart = new Date(targetYear, 0, 1);
    looseStart.setDate(looseStart.getDate() - 2);

    looseEnd = new Date(targetYear + 1, 0, 1);
    looseEnd.setDate(looseEnd.getDate() + 2);
  } else {
    throw new ApiError(400, "Invalid report type");
  }

  // 1. Index-Optimized Match (Broad Filter)
  matchStage.date = { $gte: looseStart, $lte: looseEnd };

  // 2. Strict Timezone Match (Precise Filter)
  // MongoDB $month is 1-12, our targetMonth is 0-11
  const strictMatchStage = {
    $expr: {
      $and: [
        { $eq: [{ $year: { date: "$date", timezone: reportTimezone } }, targetYear] }
      ]
    }
  };

  if (type === "monthly") {
    // Add month check for monthly reports
    strictMatchStage.$expr.$and.push(
      { $eq: [{ $month: { date: "$date", timezone: reportTimezone } }, targetMonth + 1] }
    );
  }

  const pipeline = [
    { $match: matchStage },       // Fast index scan
    { $match: strictMatchStage }, // Accurate timezone filtering
    {
      $lookup: {
        from: "doctors",
        localField: "doctor",
        foreignField: "_id",
        as: "doctorDetails",
      },
    },
    {
      $addFields: {
        doctorName: { $arrayElemAt: ["$doctorDetails.name", 0] },
      },
    },
    {
      $group: {
        _id: {
          category: "$category",
          // For monthly: group by Day; For yearly: group by Month
          // Use dynamic timezone for accurate local day/month grouping
          timeUnit:
            type === "monthly"
              ? { $dayOfMonth: { date: "$date", timezone: reportTimezone } }
              : { $month: { date: "$date", timezone: reportTimezone } },
        },
        totalAmount: { $sum: "$amount" },
        count: { $sum: 1 },
        items: {
          $push: {
            _id: "$_id",
            title: "$title",
            amount: "$amount",
            date: "$date",
            quantity: "$quantity",
            unit: "$unit",
            supplier: "$supplier",
            doctorName: "$doctorName",
            category: "$category"
          },
        }, // Collect detailed items
      },
    },
    {
      $group: {
        _id: "$_id.timeUnit", // Group by Day or Month
        categories: {
          // Renamed from 'expenses' to 'categories' to clarify it contains category-wise breakdown
          $push: {
            category: "$_id.category",
            totalAmount: "$totalAmount",
            count: "$count",
            items: "$items", // Include the details
          },
        },
        totalForPeriod: { $sum: "$totalAmount" },
      },
    },
    {
      $addFields: {
        totalForPeriod: { $round: ["$totalForPeriod", 2] },
      },
    },
    { $sort: { _id: 1 } }, // Sort by Day/Month
  ];

  const report = await Expense.aggregate(pipeline);

  // Calculate Grand Total
  const grandTotal = report.reduce(
    (sum, item) => sum + (item.totalForPeriod || 0),
    0
  );

  return {
    breakdown: report,
    grandTotal,
  };
};

// 5. Get Expense by ID
export const getExpenseByIdService = async (expenseId) => {
  const expense = await Expense.findById(expenseId)
    .populate("lab", "labName")
    .populate("doctor", "name");
  if (!expense) {
    throw new ApiError(404, "Expense not found");
  }
  return expense;
};

// 7. Get Expense Stats (Monthly & Yearly Total)
export const getExpenseStatsService = async (labId) => {
  const labObjectId = new mongoose.Types.ObjectId(labId);

  const now = new Date();
  // Start of Current Month
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Start of Current Year
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  const pipeline = [
    {
      $match: {
        lab: labObjectId,
      },
    },
    {
      $facet: {
        monthly: [
          { $match: { date: { $gte: startOfMonth } } },
          { $group: { _id: null, total: { $sum: "$amount" } } },
          { $addFields: { total: { $round: ["$total", 2] } } },
        ],
        yearly: [
          { $match: { date: { $gte: startOfYear } } },
          { $group: { _id: null, total: { $sum: "$amount" } } },
          { $addFields: { total: { $round: ["$total", 2] } } },
        ],
        allTime: [
          { $group: { _id: null, total: { $sum: "$amount" } } },
          { $addFields: { total: { $round: ["$total", 2] } } },
        ],
      },

    },
  ];

  const results = await Expense.aggregate(pipeline);

  const monthlyTotal = results[0]?.monthly[0]?.total || 0;
  const yearlyTotal = results[0]?.yearly[0]?.total || 0;
  const allTimeTotal = results[0]?.allTime[0]?.total || 0;

  return { monthlyTotal, yearlyTotal, allTimeTotal };
};
