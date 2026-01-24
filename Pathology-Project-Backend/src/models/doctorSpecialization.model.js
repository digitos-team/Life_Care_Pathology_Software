import mongoose from "mongoose";

const doctorSpecializationSchema = new mongoose.Schema(
    {
        doctorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Doctor",
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
doctorSpecializationSchema.index(
    { doctorId: 1, specializationId: 1 },
    { unique: true }
);

// Index for quick lookups
doctorSpecializationSchema.index({ doctorId: 1 });
doctorSpecializationSchema.index({ specializationId: 1 });

export default mongoose.model("DoctorSpecialization", doctorSpecializationSchema);
