import mongoose from "mongoose";
const labSchema = new mongoose.Schema(
  {
    labName: { type: String, required: true },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    address: String,
    contact: String,

    licenseNumber: String,
    gstNumber: String,
    panNumber: String,

    email: String,
    // website: String,
    // operatingHours: String,

    bankDetails: {
      bankName: String,
      accountNumber: String,
      ifscCode: String,
      accountName: String,
    },

    paymentTerms: {
      type: String,
      default: "Check, Credit Card, or Bank Transfer",
    },
  },
  { timestamps: true }
);

export default mongoose.model("PathologyLab", labSchema);
