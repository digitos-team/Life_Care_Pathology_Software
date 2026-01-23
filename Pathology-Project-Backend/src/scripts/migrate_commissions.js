import mongoose from "mongoose";
import dotenv from "dotenv";
import Doctor from "../models/doctor.model.js";
import Bill from "../models/bill.model.js";
import Specialization from "../models/specialization.model.js";
import PathologyLab from "../models/pathologyLab.model.js";

dotenv.config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("MongoDB connected");
    } catch (error) {
        console.error("MongoDB connection failed", error);
        process.exit(1);
    }
};

const migrate = async () => {
    await connectDB();

    console.log("--- Starting Migration ---");

    // 1. Migrate Doctors
    console.log("Migrating Doctors...");
    // Rename 'commissionPercentage' to 'generalizedCommissionPercentage' using native collection
    const resultRename = await Doctor.collection.updateMany(
        { commissionPercentage: { $exists: true } },
        { $rename: { "commissionPercentage": "generalizedCommissionPercentage" } }
    );
    console.log(`Renamed fields for ${resultRename.modifiedCount} doctors.`);

    // Set specializedCommissionPercentage = generalizedCommissionPercentage
    const doctors = await Doctor.find({});
    let docUpdatedCount = 0;
    for (const doc of doctors) {
        let updated = false;
        // Check manually if updated needed (schema default is 0)
        // If generalized is set but specialized is 0 (default), assume copy.
        if (doc.generalizedCommissionPercentage > 0 && doc.specializedCommissionPercentage === 0) {
            doc.specializedCommissionPercentage = doc.generalizedCommissionPercentage;
            updated = true;
        }
        if (updated) {
            await doc.save();
            docUpdatedCount++;
        }
    }
    console.log(`Updated commission rates for ${docUpdatedCount} doctors.`);

    // 2. Default Specializations
    console.log("Creating Default Specializations...");
    const labs = await PathologyLab.find({});
    const defaultSpecs = ["Hematology", "Cardiology", "General Medicine", "Neurology", "Orthopedics", "Radiology", "Endocrinology", "Gastroenterology"];

    let specCreatedCount = 0;
    for (const lab of labs) {
        for (const name of defaultSpecs) {
            const exists = await Specialization.findOne({ labId: lab._id, name });
            if (!exists) {
                await Specialization.create({ labId: lab._id, name });
                specCreatedCount++;
            }
        }
    }
    console.log(`Created ${specCreatedCount} default specializations.`);

    // 3. Bills
    console.log("Updating Bills...");
    const resultBills = await Bill.updateMany(
        { commissionType: { $exists: false } },
        { $set: { commissionType: "none", commissionAmount: 0, commissionPercentage: 0 } }
    );
    console.log(`Updated ${resultBills.modifiedCount} bills.`);

    console.log("--- Migration Complete ---");
    process.exit();
};

migrate();
