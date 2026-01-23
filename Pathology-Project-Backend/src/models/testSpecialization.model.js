import mongoose from "mongoose";

const testSpecializationSchema = new mongoose.Schema(
    {
        testId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "LabTest",
            required: true,
        },
        specializationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Specialization",
            required: true,
        },
    },
    { timestamps: true }
);

// Compound unique index - prevent duplicate assignments
testSpecializationSchema.index(
    { testId: 1, specializationId: 1 },
    { unique: true }
);

// Index for quick lookups
testSpecializationSchema.index({ testId: 1 });
testSpecializationSchema.index({ specializationId: 1 });

export default mongoose.model("TestSpecialization", testSpecializationSchema);
