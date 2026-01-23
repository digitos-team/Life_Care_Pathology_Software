/**
 * MongoDB Transaction Readiness Check
 * 
 * Run this script to verify if your MongoDB is configured for transactions
 * 
 * Usage: node scripts/check-transaction-support.js
 */

import mongoose from 'mongoose';
import { DB_Name } from '../constant.js';

const checkTransactionSupport = async () => {
    try {
        console.log('🔍 Checking MongoDB Transaction Support...\n');

        // Connect to MongoDB
        console.log('📡 Connecting to MongoDB...');
        await mongoose.connect(`mongodb://localhost:27017/${DB_Name}?replicaSet=rs0`);
        console.log('✅ Connected to MongoDB\n');

        // Check if replica set is configured
        const admin = mongoose.connection.db.admin();
        const serverStatus = await admin.serverStatus();

        console.log('📊 MongoDB Configuration:');
        console.log(`   Version: ${serverStatus.version}`);
        console.log(`   Replica Set: ${serverStatus.repl?.setName || 'NOT CONFIGURED ❌'}`);
        console.log(`   Is Primary: ${serverStatus.repl?.isWritablePrimary || 'N/A'}`);
        console.log('');

        if (!serverStatus.repl?.setName) {
            console.log('❌ REPLICA SET NOT CONFIGURED!');
            console.log('\n📝 To enable transactions, you need to:');
            console.log('   1. Edit mongod.cfg and add:');
            console.log('      replication:');
            console.log('        replSetName: "rs0"');
            console.log('   2. Restart MongoDB');
            console.log('   3. Initialize replica set: rs.initiate()');
            console.log('\n📖 See MONGODB_TRANSACTION_SETUP.md for detailed instructions\n');
            process.exit(1);
        }

        // Try to start a transaction
        console.log('🧪 Testing transaction support...');
        const session = await mongoose.startSession();

        try {
            await session.startTransaction();
            console.log('✅ Transaction started successfully!');

            await session.commitTransaction();
            console.log('✅ Transaction committed successfully!');

            console.log('\n🎉 SUCCESS! MongoDB is ready for transactions!\n');
            console.log('✅ Payment system will work with transactional safety');
            console.log('✅ All database operations are protected');
            console.log('✅ Automatic rollback on errors\n');

        } catch (txError) {
            console.log('❌ Transaction test failed:', txError.message);
            console.log('\n📖 See MONGODB_TRANSACTION_SETUP.md for setup instructions\n');
            process.exit(1);
        } finally {
            session.endSession();
        }

        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.log('\n💡 Possible issues:');
        console.log('   - MongoDB is not running');
        console.log('   - Connection string is incorrect');
        console.log('   - Replica set not initialized');
        console.log('\n📖 See MONGODB_TRANSACTION_SETUP.md for help\n');
        process.exit(1);
    }
};

checkTransactionSupport();
