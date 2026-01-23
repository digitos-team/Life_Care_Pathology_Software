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

// Indexes for performance and data integrity
paymentSchema.index({ labId: 1, createdAt: -1 }); // Lab payments sorted by date
paymentSchema.index({ billId: 1 }); // Quick bill payment lookup

// Prevent duplicate transactionId per bill (sparse allows null values)
paymentSchema.index(
    { billId: 1, transactionId: 1 },
    { unique: true, sparse: true, partialFilterExpression: { transactionId: { $exists: true } } }
);

const Payment = mongoose.model("Payment", paymentSchema);
export default Payment;
