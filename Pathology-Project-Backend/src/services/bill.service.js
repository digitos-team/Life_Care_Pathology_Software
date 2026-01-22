import Bill from "../models/bill.model.js";
import Expense from "../models/expense.model.js";
import Revenue from "../models/revenue.model.js";
import TestOrder from "../models/testorder.model.js";
import { ApiError } from "../utils/ApiError.js";
import mongoose from "mongoose";

// Helper to generate Bill Number
const generateBillNumber = async () => {
  // Use aggregation to compute numeric part and get max without scanning all documents into app memory
  const res = await Bill.aggregate([
    { $match: { billNumber: { $exists: true, $ne: "" } } },
    {
      $project: {
        codeStr: "$billNumber",
        // Remove BILL prefix if present, else keep original
        numericPart: {
          $toInt: {
            $cond: [
              {
                $regexMatch: { input: "$billNumber", regex: /^BILL(\d+)$/ },
              },
              {
                $replaceOne: {
                  input: "$billNumber",
                  find: "BILL",
                  replacement: "",
                },
              },
              "0",
            ],
          },
        },
      },
    },
    { $group: { _id: null, maxNum: { $max: "$numericPart" } } },
  ]);

  const maxNumber = res[0]?.maxNum || 100; // default baseline
  const nextNumber = maxNumber + 1;
  return `BILL${nextNumber}`;
};

// Generate bill (Pending or Paid)
export const generateBill = async ({
  patientId,
  testOrderId,
  testReports,
  items,
  totalAmount,
  labId,
  paymentId,
  discountId = null,
  discountAmount = 0
}, session = null) => {
  // Auto-generate bill number
  const billNumber = await generateBillNumber();

  const billData = {
    billNumber,
    patientId,
    testOrderId,
    testReports,
    items,
    totalAmount,
    labId,
    paymentId,
    discountId,
    discountAmount,
    status: paymentId ? "PAID" : "PENDING",
  };

  const [bill] = await Bill.create([billData], { session });

  return bill;
};

// Get bill by ID
export const getBillById = async (billId) => {
  try {
    const bill = await Bill.findById(billId)
      .populate("paymentId")
      .populate("patientId", "fullName phone age gender patientId")
      .populate({
        path: "testOrderId",
        populate: { path: "doctor", select: "name" },
      });

    if (!bill) {
      throw new ApiError(404, "Bill not found");
    }

    // Fetch commission if it exists for this bill
    const commissionExpense = await Expense.findOne({
      bill: billId,
      category: "COMMISSION"
    }).select("amount");

    const billObj = bill.toObject();
    billObj.commissionAmount = commissionExpense ? commissionExpense.amount : 0;

    return billObj;
  } catch (error) {
    throw error;
  }
};

// Get bills for a patient
export const getPatientBills = async (patientId, labId) => {
  return await Bill.find({ patientId, labId }).sort({ createdAt: -1 });
};

// Get all bills for a lab
export const getLabBills = async (labId) => {
  return await Bill.find({ labId })
    .populate("patientId", "fullName phone")
    .sort({ createdAt: -1 });
};

// Get Billing Report (Daily/Monthly)
export const getBillingReportService = async (labId, type, year, month) => {
  const match = {
    labId: new mongoose.Types.ObjectId(labId),
  };

  const startDate = new Date(year, month ? month - 1 : 0, 1);
  const endDate = new Date(year, month ? month : 12, 0, 23, 59, 59);

  match.createdAt = { $gte: startDate, $lte: endDate };

  let groupFormat;
  if (type === "daily") {
    groupFormat = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
  } else {
    groupFormat = { $dateToString: { format: "%Y-%m", date: "$createdAt" } };
  }

  const report = await Bill.aggregate([
    { $match: match },
    {
      $lookup: {
        from: "patients",
        localField: "patientId",
        foreignField: "_id",
        as: "patientInfo",
      },
    },
    { $unwind: "$patientInfo" },
    {
      $group: {
        _id: groupFormat,
        totalAmount: { $sum: "$totalAmount" },
        paidAmount: {
          $sum: { $cond: [{ $eq: ["$status", "PAID"] }, "$totalAmount", 0] },
        },
        pendingAmount: {
          $sum: { $cond: [{ $eq: ["$status", "PENDING"] }, "$totalAmount", 0] },
        },
        billCount: { $sum: 1 },
        bills: {
          $push: {
            billNumber: "$billNumber",
            patientName: "$patientInfo.fullName",
            amount: "$totalAmount",
            status: "$status",
            date: "$createdAt",
          },
        },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return report;
};

/**
 * Delete a bill and its associated records (Revenue, Commission Expense)
 * Note: Transactions removed as they require MongoDB replica sets
 */
export const deleteBillWithCascade = async (billId, labId) => {
  try {
    const bill = await Bill.findOne({ _id: billId, labId });
    if (!bill) {
      throw new ApiError(404, "Bill not found or unauthorized");
    }

    // 1. Delete associated Revenue
    await Revenue.deleteOne({ billId: bill._id, labId });

    // 2. Delete associated Commission Expense (if any)
    await Expense.deleteOne({
      bill: bill._id,
      category: "COMMISSION",
      lab: labId
    });

    // 3. Update TestOrder (unlink the bill)
    if (bill.testOrderId) {
      await TestOrder.findByIdAndUpdate(
        bill.testOrderId,
        { $unset: { billId: "" } }
      );
    }

    // 4. Delete the Bill itself
    await Bill.deleteOne({ _id: bill._id });

    return { message: "Bill and associated data deleted successfully" };
  } catch (error) {
    throw error;
  }
};
export const deleteBillOnly = async (billId, labId) => {
  const bill = await Bill.findOne({ _id: billId, labId });
  if (!bill) {
    throw new ApiError(404, "Bill not found");
  }

  await Bill.deleteOne({ _id: billId });
  return { message: "Bill deleted only" };
};
