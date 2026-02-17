import mongoose from "mongoose";
export const categoryEnum = ["PATHOLOGY", "RADIOLOGY"];
export const resultTypeEnum = ["NUMERIC", "UNISEX_NUMERIC", "COMPARISON", "QUALITATIVE"];

// For NUMERIC: gender-specific min-max ranges
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
      trim: true,
      default: "",
    },

    // Drives input widget + validation behavior
    resultType: {
      type: String,
      enum: resultTypeEnum,
      default: "NUMERIC",
    },

    // For NUMERIC: gender-specific ranges (e.g. Hemoglobin Male 13-17, Female 12-16)
    referenceRanges: {
      type: [referenceRangeSchema],
      default: undefined,
    },

    // For UNISEX_NUMERIC: single range for both genders (e.g. HbA1c 4.0-5.6)
    unisexRange: {
      min: { type: Number },
      max: { type: Number },
    },

    // For COMPARISON: supports unisex or gender-specific
    // e.g. Triglycerides: [{ comparator: '<', value: 150 }]
    // e.g. HDL:           [{ gender: 'Male', comparator: '>', value: 40 }, { gender: 'Female', comparator: '>', value: 50 }]
    comparisonRanges: [
      {
        gender: {
          type: String,
          enum: ["Male", "Female"],
        },
        comparator: {
          type: String,
          enum: ["<", "<=", ">", ">="],
        },
        value: { type: Number },
      },
    ],

    // For QUALITATIVE: e.g. Urine Protein → Present / Absent
    qualitativeOptions: {
      options: [{ type: String }],
      normalValue: { type: String },
    },

    unit: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: false }
);

// Validation: Ensure qualitative parameters have options
parameterSchema.pre("validate", function (next) {
  if (this.resultType === "QUALITATIVE") {
    if (!this.qualitativeOptions || !this.qualitativeOptions.options || this.qualitativeOptions.options.length === 0) {
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
