import mongoose from "mongoose";
export const categoryEnum = ["PATHOLOGY", "RADIOLOGY"];

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

    // Parameter type: QUANTITATIVE (numeric) or QUALITATIVE (predefined options)
    parameterType: {
      type: String,
      enum: ["QUANTITATIVE", "QUALITATIVE"],
      required: true,
      default: "QUANTITATIVE",
    },

    unit: {
      type: String,
      trim: true,
      // Required only for quantitative parameters
      required: function () {
        return this.parameterType === "QUANTITATIVE";
      },
    },

    // For QUANTITATIVE parameters (numeric values with min/max ranges)
    referenceRanges: {
      type: [referenceRangeSchema],
      validate: {
        validator: function (v) {
          // Required for quantitative, optional for qualitative
          if (this.parameterType === "QUANTITATIVE") {
            return Array.isArray(v) && v.length > 0;
          }
          return true;
        },
        message: "At least one reference range is required for quantitative parameters",
      },
    },

    // For QUALITATIVE parameters (predefined options like Positive/Negative)
    qualitativeOptions: [
      {
        value: {
          type: String,
          required: true,
          trim: true,
        },
        isNormal: {
          type: Boolean,
          default: true,
        },
        displayOrder: {
          type: Number,
          default: 0,
        },
      },
    ],
  },
  { _id: false }
);

// Validation: Ensure qualitative parameters have options
parameterSchema.pre("validate", function (next) {
  if (this.parameterType === "QUALITATIVE") {
    if (!this.qualitativeOptions || this.qualitativeOptions.length === 0) {
      return next(new Error("Qualitative parameters must have at least one option"));
    }
  }
  next();
});

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

    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
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
    category: {
      type: String,
      enum: categoryEnum,
      default: "PATHOLOGY",
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
