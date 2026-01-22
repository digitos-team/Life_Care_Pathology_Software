import mongoose from "mongoose";

const revenueSchema = new mongoose.Schema(
    {
        billId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Bill",
            required: true,
        },
        totalAmount: {
            type: Number,
            required: true,
        },
        commissionAmount: {
            type: Number,
            required: true,
        },
        netRevenue: {
            type: Number,
            required: true,
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
revenueSchema.index({ labId: 1, createdAt: -1 });
// TTL Index: Auto-delete records after 1 year (365 days)
revenueSchema.index({ createdAt: 1 }, { expireAfterSeconds: 31536000 });
const Revenue = mongoose.model("Revenue", revenueSchema);
export default Revenue;
