import Payment from "../models/payment.model.js";
import Bill from "../models/bill.model.js";
import { ApiError } from "../utils/ApiError.js";
import * as commissionService from "./commission.service.js";
import * as revenueService from "./revenue.service.js";

// Record payment and trigger downstream processes
export const recordPayment = async ({ billId, amount, paymentMethod, transactionId, labId, discountId }) => {
    // Validate bill
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

    // Handle Discount
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

    // Create payment record
    const payment = await Payment.create({
        billId,
        amount: finalAmount, // Store the actual amount paid
        paymentMethod,
        transactionId,
        labId,
    });

    // Update bill status
    bill.status = "PAID";
    bill.paymentId = payment._id;
    await bill.save();

    // Calculate and record commission (if doctor exists)
    let commission = null;
    if (bill.testOrderId?.doctor) {
        commission = await commissionService.calculateAndRecordCommission({
            doctorId: bill.testOrderId.doctor._id,
            doctorCommissionPercent: bill.testOrderId.doctor.commissionPercentage || 0,
            totalAmount: finalAmount, // Commission on discounted amount
            billId: bill._id,
            labId,
        });
    }

    // Record revenue
    const revenue = await revenueService.recordRevenue({
        billId: bill._id,
        totalAmount: finalAmount, // Revenue is discounted amount
        commissionAmount: commission?.amount || 0,
        labId,
    });

    return {
        payment,
        bill,
        commission,
        revenue,
    };
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
