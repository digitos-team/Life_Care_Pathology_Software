import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import * as paymentService from "../services/payment.service.js";

// Record payment (triggers bill status update, commission, revenue)
export const recordPaymentController = asyncHandler(async (req, res) => {
    const { billId, amount, paymentMethod, transactionId, discountId } = req.body;
    const labId = req.user.labId;

    if (!billId || !paymentMethod) {
        throw new ApiError(400, "Bill ID and payment method are required");
    }

    const result = await paymentService.recordPayment({
        billId,
        amount,
        paymentMethod,
        transactionId,
        labId,
        discountId,
    });

    res.status(201).json(new ApiResponse(201, result, "Payment recorded successfully"));
});

// Get payments for bill
export const getBillPaymentsController = asyncHandler(async (req, res) => {
    const { billId } = req.params;
    const payments = await paymentService.getPaymentsByBill(billId);
    res.status(200).json(new ApiResponse(200, payments, "Payments fetched successfully"));
});

// Get all lab payments
export const getLabPaymentsController = asyncHandler(async (req, res) => {
    const labId = req.user.labId;
    const query = req.query;

    const result = await paymentService.getLabPaymentsService(
        labId,
        query
    );

    res.status(200).json(
        new ApiResponse(200, result, "Lab payments fetched successfully")
    );
});
