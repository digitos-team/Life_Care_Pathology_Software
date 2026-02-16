import mongoose from "mongoose";

const testPackageSchema = new mongoose.Schema(
    {
        labId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "PathologyLab",
            required: true,
            index: true,
        },
        packageName: {
            type: String,
            required: true,
            trim: true,
        },
        packageCode: {
            type: String,
            trim: true,
            uppercase: true,
        },
        description: {
            type: String,
            trim: true,
        },

        // Tests included in this package
        includedTests: [
            {
                testId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "LabTest",
                    required: true,
                },
                isOptional: {
                    type: Boolean,
                    default: false,
                },
            },
        ],

        // Pricing
        packagePrice: {
            type: Number,
            required: true,
            min: 0,
        },
        individualPriceSum: {
            type: Number,
            min: 0,
        },

        departmentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Department",
        },

        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

// Compound unique index - each lab can have unique package names
testPackageSchema.index({ labId: 1, packageName: 1 }, { unique: true });

// Performance indexes
testPackageSchema.index({ labId: 1, isActive: 1 });
testPackageSchema.index({ departmentId: 1 });

// Validation: At least one test must be included
testPackageSchema.path("includedTests").validate(function (value) {
    return Array.isArray(value) && value.length > 0;
}, "At least one test must be included in the package");

export default mongoose.model("TestPackage", testPackageSchema);
