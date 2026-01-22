import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
    {
        billId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Bill",
            required: true,
        },
        amount: {
            type: Number,
            required: true,
        },
        paymentMethod: {
            type: String,
            enum: ["CASH", "CARD", "UPI", "ONLINE"],
            required: true,
        },
        transactionId: {
            type: String,
        },
        labId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "PathologyLab",
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

paymentSchema.index({ labId: 1, createdAt: -1 });
const Payment = mongoose.model("Payment", paymentSchema);
export default Payment;
