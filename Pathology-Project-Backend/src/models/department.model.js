import mongoose from "mongoose";

const departmentSchema = new mongoose.Schema(
    {
        labId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "PathologyLab",
            required: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

// Compound index to ensure unique department names within a lab
departmentSchema.index({ labId: 1, name: 1 }, { unique: true });

export default mongoose.model("Department", departmentSchema);
