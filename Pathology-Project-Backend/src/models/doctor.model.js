import mongoose from "mongoose";

const doctorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    mobile: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      unique: true,
      lowercase: true,
    },
    specialization: {
      type: String,
      trim: true,
    },
    degree: {
      type: String, // e.g., MBBS, MD
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },

    // Commission Configuration
    commissionPercentage: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      max: 100,
    },

    // Link to the Lab
    lab: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PathologyLab",
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Doctor", doctorSchema);
