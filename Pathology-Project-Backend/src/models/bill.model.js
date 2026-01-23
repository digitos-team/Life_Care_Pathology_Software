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
            testId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "LabTest",
            },
            commissionAmount: {
                type: Number,
                default: 0,
            },
            commissionPercentage: {
                type: Number,
                default: 0,
            },
            commissionType: {
                type: String,
                enum: ["specialized", "generalized", "none"],
                default: "none",
            },
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
    // Commission Tracking
    referringDoctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Doctor",
        default: null,
    },
    commissionType: {
        type: String,
        enum: ["specialized", "generalized", "none"],
        default: "none",
    },
    commissionPercentage: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
    },
    commissionAmount: {
        type: Number,
        default: 0,
        min: 0,
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
