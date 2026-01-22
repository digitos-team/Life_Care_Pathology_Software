import mongoose from "mongoose";

const billSchema = new mongoose.Schema({
    billNumber: {
        type: String,
        required: true,
        unique: true,
    },
    // invoiceId removed
    paymentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Payment",
        // required: true // Now optional
    },
    testOrderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "TestOrder",
    },
    items: [
        {
            name: String,
            price: Number,
        },
    ],
    status: {
        type: String,
        enum: ["PENDING", "PAID", "CANCELLED"],
        default: "PENDING",
    },
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Patient",
        required: true,
    },
    totalAmount: {
        type: Number,
        required: true,
    },
    discountId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Discount",
    },
    discountAmount: {
        type: Number,
        default: 0,
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

// TTL Index: Auto-delete records after 1 year (365 days)
billSchema.index({ createdAt: 1 }, { expireAfterSeconds: 31536000 });

const Bill = mongoose.model("Bill", billSchema);
export default Bill;
