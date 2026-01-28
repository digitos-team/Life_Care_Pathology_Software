import Payment from "../models/payment.model.js";
import Bill from "../models/bill.model.js";
import { ApiError } from "../utils/ApiError.js";
import * as commissionService from "./commission.service.js";
import * as revenueService from "./revenue.service.js";
import mongoose from "mongoose";

// Record payment with MongoDB transaction for data integrity
export const recordPayment = async ({ billId, amount, paymentMethod, transactionId, labId, discountId }) => {
    // 🔍 STEP 1: Duplicate Payment Prevention
    if (transactionId) {
        const existingPayment = await Payment.findOne({
            billId,
            transactionId
        });
        if (existingPayment) {
            throw new ApiError(409, "Payment with this transaction ID already exists for this bill");
        }
    }

    // 🔍 STEP 2: Validate bill before starting transaction
    const bill = await Bill.findById(billId)
        .populate("patientId")
        .populate({
            path: 'testOrderId',
            populate: { path: 'doctor' }
        });

    if (!bill) {
        throw new ApiError(404, "Bill not found");
    }

    if (bill.status === "PAID") {
        throw new ApiError(400, "Bill already paid");
    }

    if (bill.status === "CANCELLED") {
        throw new ApiError(400, "Cannot pay cancelled bill");
    }

    // 🔍 STEP 3: Calculate discount outside transaction
    let discountAmount = 0;
    if (discountId) {
        const Discount = (await import("../models/discount.model.js")).default;
        const discount = await Discount.findOne({ _id: discountId, labId, isActive: true });

        if (discount) {
            if (discount.type === "PERCENT") {
                discountAmount = (bill.totalAmount * discount.value) / 100;
            } else {
                discountAmount = discount.value;
            }

            bill.discountId = discountId;
            bill.discountAmount = discountAmount;
        }
    }

    const finalAmount = bill.totalAmount - discountAmount;

    // 🔒 STEP 4: Start MongoDB Transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // ✅ Create payment record
        const [payment] = await Payment.create([{
            billId,
            amount: finalAmount,
            paymentMethod,
            transactionId,
            labId,
        }], { session });

        // ✅ Update bill status
        bill.status = "PAID";
        bill.paymentId = payment._id;
        await bill.save({ session });

        // ✅ Record commission expense (if bill has commission)
        let commission = null;
        if (bill.commissionAmount > 0 && bill.referringDoctorId) {
            commission = await commissionService.recordCommissionExpense({
                billId: bill._id,
                doctorId: bill.referringDoctorId,
                amount: bill.commissionAmount,
                labId
            }, session);
        }

        // ✅ Record revenue
        // Note: bill.totalAmount is NET amount (after discount)
        // Calculate GROSS by adding back the discount
        const grossAmount = (bill.totalAmount || 0) + (bill.discountAmount || 0);

        const revenue = await revenueService.recordRevenue({
            billId: bill._id,
            totalAmount: grossAmount, // Store GROSS for display
            discountAmount: bill.discountAmount || 0,
            commissionAmount: commission?.amount || 0,
            netRevenue: (bill.totalAmount || 0) - (commission?.amount || 0), // NET after discount and commission
            labId,
        }, session);

        // 🎉 Commit transaction - All or nothing!
        await session.commitTransaction();

        return {
            payment,
            bill,
            commission,
            revenue,
        };

    } catch (error) {
        // 🔄 Rollback transaction on any error
        await session.abortTransaction();

        // Log the error for debugging
        console.error("Payment transaction failed:", error);

        throw new ApiError(
            500,
            `Payment processing failed: ${error.message}. No changes were made.`
        );
    } finally {
        // 🔓 Always end session
        session.endSession();
    }
};

// Get payments for a bill
export const getPaymentsByBill = async (billId) => {
    return await Payment.find({ billId }).sort({ createdAt: -1 });
};

// Get all payments for a lab
export const getLabPaymentsService = async (labId, query) => {
    // 🔹 Pagination
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    // 🔹 Filter
    const filter = { labId };

    // 🔹 Total count
    const totalRecords = await Payment.countDocuments(filter);

    // 🔹 Paginated data
    const payments = await Payment.find(filter)
        .populate("billId")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    return {
        data: payments,
        pagination: {
            totalRecords,
            totalPages: Math.ceil(totalRecords / limit),
            currentPage: page,
            limit,
        },
    };
};
