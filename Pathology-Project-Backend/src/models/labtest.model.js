import mongoose from "mongoose";

const referenceRangeSchema = new mongoose.Schema(
  {
    gender: {
      type: String,
      enum: ["Male", "Female"],
      default: "Male",
    },
    min: {
      type: Number,
      required: true,
    },
    max: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

const parameterSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    unit: {
      type: String,
      required: true,
      trim: true,
    },

    referenceRanges: {
      type: [referenceRangeSchema],
      required: true,
      validate: {
        validator: function (v) {
          return Array.isArray(v) && v.length > 0;
        },
        message: "At least one reference range is required",
      },
    },
  },
  { _id: false }
);

const labTestSchema = new mongoose.Schema(
  {
    labId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PathologyLab",
      required: true,
    },

    testName: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      required: true,
      enum: [
        "Blood",
        "Urine",
        "Biochemistry",
        "Hormone",
        "Immunology",
        "Microbiology",
        "Other",
      ],
    },

    parameters: {
      type: [parameterSchema],
      required: true,
      validate: {
        validator: function (v) {
          return Array.isArray(v) && v.length > 0;
        },
        message: "At least one parameter is required",
      },
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const LabTest = mongoose.model("LabTest", labTestSchema);
export default LabTest;
