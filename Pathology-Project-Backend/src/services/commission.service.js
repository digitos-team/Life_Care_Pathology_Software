import Doctor from "../models/doctor.model.js";
import DoctorSpecialization from "../models/doctorSpecialization.model.js";
import TestSpecialization from "../models/testSpecialization.model.js";
import Bill from "../models/bill.model.js";
import Patient from "../models/patient.model.js";
import Expense from "../models/expense.model.js";
import Revenue from "../models/revenue.model.js";
import { ApiError } from "../utils/ApiError.js";
import mongoose from "mongoose";

/**
 * Record a commission expense for a bill
 * @param {Object} data - { billId, doctorId, amount, labId }
 * @param {Object} session - mongoose session
 */
export const recordCommissionExpense = async ({ billId, doctorId, amount, labId }, session = null) => {
    const expenseData = {
        title: `Doctor Commission - Bill`,
        amount,
        category: "COMMISSION",
        doctor: doctorId,
        date: new Date(),
        description: `Commission for Bill ${billId}`,
        lab: labId,
        bill: billId,
    };

    const [expense] = session
        ? await Expense.create([expenseData], { session })
        : [await Expense.create(expenseData)];

    return expense;
};

/**
 * NEW: Calculate commission for a bill based on doctor and test specializations
 * @param {Object} billData - { testId, referringDoctorId, totalAmount }
 * @returns {Object} - { commissionType, commissionPercentage, commissionAmount }
 */
export const calculateCommissionForBill = async (billData) => {
    const { testId, referringDoctorId, totalAmount } = billData;

    // 1. If no referring doctor, return none
    if (!referringDoctorId) {
        return {
            commissionType: "none",
            commissionPercentage: 0,
            commissionAmount: 0,
        };
    }

    // 2. Get doctor's specializations
    const doctorSpecs = await DoctorSpecialization.find({
        doctorId: referringDoctorId,
    })
        .select("specializationId")
        .lean();

    const doctorSpecIds = doctorSpecs.map((ds) => ds.specializationId.toString());

    // 3. Get test's specializations
    const testSpecs = await TestSpecialization.find({
        testId: testId,
    })
        .select("specializationId")
        .lean();

    const testSpecIds = testSpecs.map((ts) => ts.specializationId.toString());

    // 4. Check if ANY doctor specialization matches ANY test specialization
    const hasMatch = doctorSpecIds.some((docSpecId) =>
        testSpecIds.includes(docSpecId)
    );

    // 5. Get doctor's commission rates
    const doctor = await Doctor.findById(referringDoctorId).lean();
    if (!doctor) {
        throw new ApiError(404, "Referring doctor not found");
    }

    // 6. Calculate commission based on match
    let commissionType, commissionPercentage;

    if (hasMatch) {
        // SPECIALIZED - doctor's specialty matches test specialty
        commissionType = "specialized";
        commissionPercentage = doctor.specializedCommissionPercentage || 0;
    } else {
        // GENERALIZED - no specialty match
        commissionType = "generalized";
        commissionPercentage = doctor.generalizedCommissionPercentage || 0;
    }

    const commissionAmount = (totalAmount * commissionPercentage) / 100;

    return {
        commissionType,
        commissionPercentage,
        commissionAmount: parseFloat(commissionAmount.toFixed(2)),
    };
};

/**
 * NEW: Generate commission report for a doctor
 * @param {String} doctorId
 * @param {String} labId
 * @param {Date} startDate
 * @param {Date} endDate
 * @returns {Object} - Report data with bills and totals
 */
export const getDoctorCommissionReportService = async (
    doctorId,
    labId,
    startDate,
    endDate
) => {
    if (!doctorId) {
        throw new ApiError(400, "Doctor ID is required");
    }

    // Parse dates
    const start = startDate ? new Date(startDate) : new Date(0);
    const end = endDate ? new Date(endDate) : new Date();

    // Set end date to end of day
    end.setHours(23, 59, 59, 999);

    // Aggregate bills with commission data
    const bills = await Bill.aggregate([
        {
            $match: {
                labId: new mongoose.Types.ObjectId(labId),
                referringDoctorId: new mongoose.Types.ObjectId(doctorId),
                commissionType: { $ne: "none" },
                createdAt: { $gte: start, $lte: end },
            },
        },
        {
            $lookup: {
                from: "patients",
                localField: "patientId",
                foreignField: "_id",
                as: "patient",
            },
        },
        {
            $unwind: {
                path: "$patient",
                preserveNullAndEmptyArrays: true,
            },
        },
        {
            $project: {
                billNumber: 1,
                patientName: "$patient.fullName",
                testNames: {
                    $map: {
                        input: "$items",
                        as: "item",
                        in: "$$item.name",
                    },
                },
                totalAmount: 1,
                commissionType: 1,
                commissionPercentage: 1,
                commissionAmount: 1,
                createdAt: 1,
            },
        },
        {
            $sort: { createdAt: -1 },
        },
    ]);

    // Calculate totals
    const totalCommission = bills.reduce(
        (sum, bill) => sum + (bill.commissionAmount || 0),
        0
    );
    const totalBills = bills.length;
    const specializedCount = bills.filter(
        (b) => b.commissionType === "specialized"
    ).length;
    const generalizedCount = bills.filter(
        (b) => b.commissionType === "generalized"
    ).length;

    // Get doctor details
    const doctor = await Doctor.findById(doctorId).lean();
    if (!doctor) {
        throw new ApiError(404, "Doctor not found");
    }

    // Get doctor's specializations
    const doctorSpecs = await DoctorSpecialization.find({ doctorId: doctorId })
        .populate("specializationId", "name")
        .lean();

    const specializationNames = doctorSpecs.map(
        (ds) => ds.specializationId?.name || "Unknown"
    );

    return {
        doctor: {
            id: doctor._id,
            name: doctor.name,
            specializations: specializationNames,
            specializedRate: doctor.specializedCommissionPercentage || 0,
            generalizedRate: doctor.generalizedCommissionPercentage || 0,
        },
        period: {
            startDate: start,
            endDate: end,
        },
        billDetails: bills.map((bill) => ({
            ...bill,
            testNames: bill.testNames.join(", "),
            date: bill.createdAt,
            billId: bill._id
        })),
        summary: {
            totalBills,
            totalCommission: parseFloat(totalCommission.toFixed(2)),
            specializedCount,
            generalizedCount,
        },
    };
};

/**
 * NEW: Get all doctors with commission summary
 * @param {String} labId
 * @param {Date} startDate
 * @param {Date} endDate
 * @returns {Array} - List of doctors with commission summary
 */
export const getAllDoctorsCommissionSummaryService = async (
    labId,
    startDate,
    endDate
) => {
    const start = startDate ? new Date(startDate) : new Date(0);
    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    const summary = await Bill.aggregate([
        {
            $match: {
                labId: new mongoose.Types.ObjectId(labId),
                referringDoctorId: { $ne: null },
                commissionType: { $ne: "none" },
                createdAt: { $gte: start, $lte: end },
            },
        },
        {
            $group: {
                _id: "$referringDoctorId",
                totalCommission: { $sum: "$commissionAmount" },
                billCount: { $sum: 1 },
                totalBusiness: { $sum: "$totalAmount" },
                specializedCount: {
                    $sum: {
                        $cond: [{ $eq: ["$commissionType", "specialized"] }, 1, 0],
                    },
                },
                generalizedCount: {
                    $sum: {
                        $cond: [{ $eq: ["$commissionType", "generalized"] }, 1, 0],
                    },
                },
            },
        },
        {
            $lookup: {
                from: "doctors",
                localField: "_id",
                foreignField: "_id",
                as: "doctor",
            },
        },
        {
            $unwind: "$doctor",
        },
        {
            $project: {
                doctorId: "$_id",
                doctorName: "$doctor.name",
                totalCommission: 1,
                billCount: 1,
                totalBusiness: 1,
                specializedCount: 1,
                generalizedCount: 1,
            },
        },
        {
            $sort: { totalCommission: -1 },
        },
    ]);

    return summary;
};

// ============================================
// OLD FUNCTIONS - KEPT FOR BACKWARD COMPATIBILITY
// ============================================

/**
 * OLD: Calculate commission and create expense entry
 * @deprecated Use calculateCommissionForBill instead
 */
export const calculateAndRecordCommission = async (
    { doctorId, doctorCommissionPercent, totalAmount, billId, labId },
    session = null
) => {
    // Calculate commission amount
    const commissionAmount = (totalAmount * doctorCommissionPercent) / 100;

    // Create expense entry for commission
    const createOptions = {
        title: `Doctor Commission - Bill`,
        amount: commissionAmount,
        category: "COMMISSION",
        doctor: doctorId,
        date: new Date(),
        description: `Commission for Bill ${billId}`,
        lab: labId,
        bill: billId,
    };

    // Support both transactional and non-transactional calls
    const [expense] = session
        ? await Expense.create([createOptions], { session })
        : [await Expense.create(createOptions)];

    return {
        amount: commissionAmount,
        percentage: doctorCommissionPercent,
        expenseId: expense._id,
    };
};

/**
 * OLD: Get doctor's total commission (monthly)
 * @deprecated
 */
export const getDoctorMonthlyCommission = async (doctorId, year, month) => {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const result = await Expense.aggregate([
        {
            $match: {
                doctor: doctorId,
                category: "COMMISSION",
                date: { $gte: startDate, $lte: endDate },
            },
        },
        {
            $group: {
                _id: null,
                totalCommission: { $sum: "$amount" },
                count: { $sum: 1 },
            },
        },
    ]);

    return result[0] || { totalCommission: 0, count: 0 };
};

/**
 * OLD: Get doctor's commission report (all time or filtered)
 * @deprecated
 */
export const getDoctorCommissionReport = async (doctorId, startDate, endDate) => {
    const filter = {
        doctor: doctorId,
        category: "COMMISSION",
    };

    if (startDate && endDate) {
        filter.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const commissions = await Expense.find(filter).sort({ date: -1 });

    const total = commissions.reduce((sum, exp) => sum + exp.amount, 0);

    return {
        commissions,
        totalCommission: total,
        count: commissions.length,
    };
};

/**
 * OLD: Get detailed doctor commission
 * @deprecated
 */
export const getDetailedDoctorCommission = async (doctorId, startDate, endDate) => {
    const docObjectId = new mongoose.Types.ObjectId(doctorId);

    const matchStage = {
        commissionAmount: { $gt: 0 },
    };

    if (startDate && endDate) {
        matchStage.createdAt = {
            $gte: new Date(new Date(startDate).setHours(0, 0, 0, 0)),
            $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)),
        };
    }

    const detailedCommissions = await Revenue.aggregate([
        { $match: matchStage },
        {
            $lookup: {
                from: "bills",
                localField: "billId",
                foreignField: "_id",
                as: "bill",
            },
        },
        { $unwind: "$bill" },
        {
            $lookup: {
                from: "testorders",
                localField: "bill.testOrderId",
                foreignField: "_id",
                as: "testOrder",
            },
        },
        { $unwind: "$testOrder" },
        {
            $match: { "testOrder.doctor": docObjectId },
        },
        {
            $lookup: {
                from: "patients",
                localField: "bill.patientId",
                foreignField: "_id",
                as: "patient",
            },
        },
        { $unwind: { path: "$patient", preserveNullAndEmptyArrays: true } },
        {
            $lookup: {
                from: "doctors",
                localField: "testOrder.doctor",
                foreignField: "_id",
                as: "doctorDetails",
            },
        },
        { $unwind: { path: "$doctorDetails", preserveNullAndEmptyArrays: true } },
        {
            $project: {
                date: "$createdAt",
                patientName: { $ifNull: ["$patient.fullName", "Unknown"] },
                billNumber: "$bill.billNumber",
                totalBillAmount: "$totalAmount",
                commissionAmount: "$commissionAmount",
                doctorName: "$doctorDetails.name",
                testOrder: {
                    $reduce: {
                        input: "$bill.items",
                        initialValue: "",
                        in: {
                            $cond: [
                                { $eq: ["$$value", ""] },
                                "$$this.name",
                                { $concat: ["$$value", ", ", "$$this.name"] },
                            ],
                        },
                    },
                },
            },
        },
        { $sort: { date: -1 } },
    ]);

    return detailedCommissions;
};

/**
 * OLD: Get ALL commissions (for Admin) with filters
 * @deprecated
 */
export const getAllCommissionsService = async (
    labId,
    startDate,
    endDate,
    page = 1,
    limit = 10
) => {
    const filter = {
        lab: labId,
        category: "COMMISSION",
    };

    if (startDate && endDate) {
        filter.date = {
            $gte: new Date(startDate),
            $lte: new Date(endDate),
        };
    }

    const skip = (page - 1) * limit;

    const [commissions, totalRecords] = await Promise.all([
        Expense.find(filter)
            .populate("doctor", "name specialization email phone")
            .sort({ date: -1 })
            .skip(skip)
            .limit(limit),
        Expense.countDocuments(filter),
    ]);

    return {
        data: commissions,
        pagination: {
            totalRecords,
            totalPages: Math.ceil(totalRecords / limit),
            currentPage: Number(page),
            limit: Number(limit),
        },
    };
};
