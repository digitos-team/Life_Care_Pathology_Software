
import mongoose from "mongoose";

const patientSchema = new mongoose.Schema(
  {
    labId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PathologyLab",
      required: true,
      index: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    patientId: {
      type: String,
      required: true,
      trim: true,
      index: true, // Single field index
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      index: true, // Single field index
    },

    phone: {
      type: String,
      trim: true,
      index: true, // Single field index
    },

    age: {
      type: Number,
      required: true,
      min: 0,
    },

    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      required: true,
    },

    address: {
      street: String,
      city: String,
      state: String,
      pincode: String,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true, // Single field index
    },
    reportStatus: {
      type: String,
      enum: ["pending", "generated", "sent", "failed"],
      default: "pending",
    },

    email: {
      type: String,
      trim: true,
      index: true, // Single field index
    },

    reportPdfPath: { type: String },
    emailSentAt: { type: Date },
    lastTestResultAt: { type: Date }, // Tracks when last test result was submitted for sorting
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);
// Virtual for test history
patientSchema.virtual("testHistory", {
  ref: "TestOrder",
  localField: "_id",
  foreignField: "patientId",
});
// ============================================
// COMPOUND INDEXES FOR OPTIMIZATION
// ============================================

// Most important: labId + isActive + createdAt (Your main query)
patientSchema.index({ labId: 1, isActive: 1, createdAt: -1 });

// For sorting by different fields
patientSchema.index({ labId: 1, isActive: 1, patientId: 1 });

// For phone lookups within a lab
patientSchema.index({ labId: 1, phone: 1 });

// For gender-based filtering
patientSchema.index({ labId: 1, gender: 1, createdAt: -1 });

// For sorting by last test result submission (Report Section)
patientSchema.index({ labId: 1, isActive: 1, lastTestResultAt: -1 });

// Text index for full-text search (name and phone)
patientSchema.index({ fullName: "text", phone: "text" });

// Virtual for test history
patientSchema.virtual("testHistory", {
  ref: "TestOrder",
  localField: "_id",
  foreignField: "patientId",
});

// Prevent duplicates: Same Lab + Name + Phone + Age must be unique
patientSchema.index({ labId: 1, fullName: 1, phone: 1, age: 1 }, { unique: true });

export default mongoose.model("Patient", patientSchema);
