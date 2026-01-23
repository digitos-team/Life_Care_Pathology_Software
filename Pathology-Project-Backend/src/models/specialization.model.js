import mongoose from "mongoose";

const specializationSchema = new mongoose.Schema(
    {
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
        labId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "PathologyLab",
            required: true,
        },
    },
    { timestamps: true }
);

// Compound unique index - each lab can have unique specialization names
specializationSchema.index({ labId: 1, name: 1 }, { unique: true });

export default mongoose.model("Specialization", specializationSchema);
