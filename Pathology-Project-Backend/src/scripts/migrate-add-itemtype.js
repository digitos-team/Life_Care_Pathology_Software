/**
 * Migration Script: Add itemType field to existing bills
 * 
 * This script updates all existing bill items to have itemType: "INDIVIDUAL_TEST"
 * for backward compatibility with the new package support feature.
 * 
 * Run this script ONCE before deploying the package feature.
 */

import mongoose from "mongoose";
import Bill from "../models/bill.model.js";
import TestOrder from "../models/testorder.model.js";
import { DB_Name } from "../constant.js";

const migrateBillsAndOrders = async () => {
    try {
        console.log("🔄 Starting migration...");

        // Connect to MongoDB
        await mongoose.connect(`mongodb://localhost:27017/${DB_Name}?replicaSet=rs0`);
        console.log("✅ Connected to MongoDB");

        // Migrate Bills
        console.log("\n📋 Migrating Bills...");
        const billsResult = await Bill.updateMany(
            { "items.itemType": { $exists: false } },
            {
                $set: {
                    "items.$[].itemType": "INDIVIDUAL_TEST"
                }
            }
        );
        console.log(`✅ Updated ${billsResult.modifiedCount} bills`);

        // Migrate TestOrders
        console.log("\n📋 Migrating TestOrders...");
        const ordersResult = await TestOrder.updateMany(
            { "tests.itemType": { $exists: false } },
            {
                $set: {
                    "tests.$[].itemType": "INDIVIDUAL_TEST"
                }
            }
        );
        console.log(`✅ Updated ${ordersResult.modifiedCount} test orders`);

        // Verify migration
        console.log("\n🔍 Verifying migration...");

        const billsWithoutItemType = await Bill.countDocuments({
            "items.itemType": { $exists: false }
        });

        const ordersWithoutItemType = await TestOrder.countDocuments({
            "tests.itemType": { $exists: false }
        });

        if (billsWithoutItemType === 0 && ordersWithoutItemType === 0) {
            console.log("✅ Migration completed successfully!");
            console.log("   - All bills have itemType field");
            console.log("   - All test orders have itemType field");
        } else {
            console.log("⚠️  Warning: Some documents still missing itemType:");
            console.log(`   - Bills: ${billsWithoutItemType}`);
            console.log(`   - Test Orders: ${ordersWithoutItemType}`);
        }

        process.exit(0);
    } catch (error) {
        console.error("❌ Migration failed:", error);
        process.exit(1);
    }
};

// Run migration
migrateBillsAndOrders();
