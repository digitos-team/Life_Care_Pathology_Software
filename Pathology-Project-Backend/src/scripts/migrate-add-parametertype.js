/**
 * Migration Script: Add parameterType to existing tests
 * 
 * This script updates all existing test parameters to have parameterType: "QUANTITATIVE"
 * for backward compatibility with the new qualitative parameter feature.
 * 
 * Run this script ONCE before deploying the qualitative parameter feature.
 */

import mongoose from "mongoose";
import LabTest from "../models/labtest.model.js";
import { DB_Name } from "../constant.js";

const migrateTestParameters = async () => {
    try {
        console.log("🔄 Starting test parameter migration...");

        // Connect to MongoDB
        await mongoose.connect(`mongodb://localhost:27017/${DB_Name}?replicaSet=rs0`);
        console.log("✅ Connected to MongoDB");

        // Update all existing tests to have parameterType: "QUANTITATIVE"
        console.log("\n📋 Migrating LabTest parameters...");

        // Use updateMany with arrayFilters to update nested arrays
        const result = await LabTest.updateMany(
            { "parameters.parameterType": { $exists: false } },
            {
                $set: {
                    "parameters.$[elem].parameterType": "QUANTITATIVE"
                }
            },
            {
                arrayFilters: [{ "elem.parameterType": { $exists: false } }],
                multi: true
            }
        );

        console.log(`✅ Updated ${result.modifiedCount} tests with parameterType`);

        // Verify migration
        console.log("\n🔍 Verifying migration...");

        const testsWithoutType = await LabTest.countDocuments({
            "parameters.parameterType": { $exists: false }
        });

        if (testsWithoutType === 0) {
            console.log("✅ Migration completed successfully!");
            console.log("   - All test parameters have parameterType field");
        } else {
            console.log(`⚠️  Warning: ${testsWithoutType} tests still missing parameterType`);
        }

        process.exit(0);
    } catch (error) {
        console.error("❌ Migration failed:", error);
        process.exit(1);
    }
};

// Run migration
migrateTestParameters();
