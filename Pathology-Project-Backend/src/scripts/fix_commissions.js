import mongoose from 'mongoose';

const DB_URI = "mongodb://localhost:27017/Pathology_Lab";

const schema = new mongoose.Schema({
    category: String,
    description: String,
    bill: mongoose.Schema.Types.ObjectId
}, { strict: false });

const Expense = mongoose.model('Expense', schema);

async function fix() {
    try {
        await mongoose.connect(DB_URI);
        console.log('Connected to MongoDB');

        const commissions = await Expense.find({
            category: 'COMMISSION',
            bill: { $exists: false }
        });

        console.log(`Found ${commissions.length} commission records missing the bill reference.`);

        let fixedCount = 0;
        for (const doc of commissions) {
            // Description format: "Commission for Bill 65a..." or "Commission for Bill [object Object]"?
            // Let's look for hex IDs
            const match = doc.description?.match(/([0-9a-fA-F]{24})/);
            if (match && match[0]) {
                const billId = match[0];
                doc.bill = new mongoose.Types.ObjectId(billId);
                await doc.save();
                fixedCount++;
            }
        }

        console.log(`Successfully fixed ${fixedCount} records.`);
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

fix();
