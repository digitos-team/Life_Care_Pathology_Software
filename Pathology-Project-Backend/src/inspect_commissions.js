import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const expenseSchema = new mongoose.Schema({
    title: String,
    category: String,
    description: String,
    bill: mongoose.Schema.Types.ObjectId,
    doctor: mongoose.Schema.Types.ObjectId
});

const Expense = mongoose.model('Expense', expenseSchema);

async function inspect() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const commissions = await Expense.find({ category: 'COMMISSION' }).limit(5).lean();
        console.log('Sample Commissions:', JSON.stringify(commissions, null, 2));

        const countMissing = await Expense.countDocuments({ category: 'COMMISSION', bill: { $exists: false } });
        console.log('Commissions missing bill field:', countMissing);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

inspect();
