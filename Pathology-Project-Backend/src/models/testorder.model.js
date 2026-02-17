// NEW MODEL: testOrder.model.js or visit.model.js
import mongoose from "mongoose";

const testItemSchema = new mongoose.Schema(
  {
    itemType: {
      type: String,
      enum: ["INDIVIDUAL_TEST", "PACKAGE"],
      required: true,
      default: "INDIVIDUAL_TEST",
    },

    // For individual tests
    testId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LabTest",
    },

    // For packages
    packageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TestPackage",
    },

    // Tests within package (expanded from package definition)
    packageTests: [
      {
        testId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "LabTest",
        },
        testName: String,
        status: {
          type: String,
          enum: ["PENDING", "COMPLETED"],
          default: "PENDING",
        },
        results: [
          {
            parameterName: String,

            // Parameter type
            parameterType: {
              type: String,
              enum: ["QUANTITATIVE", "QUALITATIVE"],
              default: "QUANTITATIVE",
            },

            // For QUANTITATIVE: numeric value
            numericValue: Number,

            // For QUALITATIVE: selected option
            qualitativeValue: String,

            // Legacy field (for backward compatibility)
            value: String,

            unit: String,

            // For QUANTITATIVE parameters
            referenceRange: {
              min: Number,
              max: Number,
            },

            // Validation flags
            isAbnormal: {
              type: Boolean,
              default: false,
            },
            abnormalityType: {
              type: String,
              enum: ["NORMAL", "HIGH", "LOW", "ABNORMAL"],
              default: "NORMAL",
            },
          },
        ],
        reportFileUrl: String,
        enteredBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        enteredAt: Date,
      },
    ],

    testName: String,
    price: Number,
    status: {
      type: String,
      enum: ["PENDING", "COMPLETED"],
      default: "PENDING",
    },

    // For individual tests only
    results: [
      {
        parameterName: String,

        // Parameter type (copied from test definition)
        parameterType: {
          type: String,
          enum: ["QUANTITATIVE", "QUALITATIVE"],
          default: "QUANTITATIVE",
        },

        // For QUANTITATIVE: numeric value
        numericValue: Number,

        // For QUALITATIVE: selected option
        qualitativeValue: String,

        // Legacy field (for backward compatibility)
        value: String,

        unit: String,
        resultType: {
          type: String,
          enum: ["NUMERIC", "UNISEX_NUMERIC", "COMPARISON", "QUALITATIVE"],
          default: "NUMERIC",
        },
        referenceRange: {
          min: Number,
          max: Number,
          displayText: String, // e.g. "70 - 110", "< 140", "Negative"
        },

        // Validation flags
        isAbnormal: {
          type: Boolean,
          default: false,
        },
        abnormalityType: {
          type: String,
          enum: ["NORMAL", "HIGH", "LOW", "ABNORMAL"],
          default: "NORMAL",
        },
      },
    ],
    reportFileUrl: String,
    enteredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    enteredAt: Date,
  },
  { _id: true }
); // Keep _id for individual test tracking

const testOrderSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
      index: true,
    },

    reportId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    labId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PathologyLab",
      required: true,
    },

    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      // Make optional to support external reports
    },
    doctorName: String, // For external doctors

    orderDate: {
      type: Date,
      required: true,
      default: Date.now,
    },

    tests: [testItemSchema], // Array of tests in this order

    overallStatus: {
      type: String,
      enum: ["PENDING", "PARTIAL", "COMPLETED"],
      default: "PENDING",
    },
    isHistorical: {
      type: Boolean,
      default: false,
    },

    totalAmount: {
      type: Number,
      required: true,
    },

    discountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Discount",
    },
    discountAmount: {
      type: Number,
      default: 0,
    },

    billId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bill",
    },
    isDownloaded: {
      type: Boolean,
      default: false,
    },
    isEmailed: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// TTL Index: Auto-delete records after 1 year (365 days)
// 365 * 24 * 60 * 60 = 31536000 seconds
testOrderSchema.index({ createdAt: 1 }, { expireAfterSeconds: 31536000 });

export default mongoose.model("TestOrder", testOrderSchema);
