import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true
        },
        amount: {
            type: Number,
            required: true,
            min: 0
        },
        category: {
            type: String,
            required: true,
            enum: ['LAB_MATERIALS', 'SALARY', 'COMMISSION', 'UTILITY', 'RENT', 'MISCELLANEOUS'],
            default: 'MISCELLANEOUS'
        },
        description: {
            type: String,
            trim: true
        },
        // Fields specific to LAB_MATERIALS
        quantity: {
            type: Number,
            min: 0
        },
        unit: {
            type: String, // e.g., "Box", "Liters", "Pcs"
            trim: true
        },
        supplier: {
            type: String,
            trim: true
        },

        date: {
            type: Date,
            default: Date.now
        },

        // Link to the Lab
        lab: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "PathologyLab",
            required: true
        },

        // Optional: Link to Doctor if this is a commission expense (Reserved for future)
        doctor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Doctor",
            required: false
        },

        // Receipt Image/PDF URL (Local path)
        receiptUrl: {
            type: String,
            trim: true
        },

        // Link to Bill (for commissions)
        bill: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Bill",
            required: false
        }
    },
    { timestamps: true }
);
expenseSchema.index({ lab: 1, date: -1 });
expenseSchema.index({ lab: 1, category: 1 });
expenseSchema.index({ title: "text", category: "text", supplier: "text" });
// TTL Index: Auto-delete records after 1 year (365 days)
expenseSchema.index({ createdAt: 1 }, { expireAfterSeconds: 31536000 });
export default mongoose.model("Expense", expenseSchema);
