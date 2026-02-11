import mongoose from 'mongoose';
import { DB_Name } from '../constant.js';

const verifyReplicaSet = async () => {
    try {
        console.log('🔍 Checking MongoDB Replica Set Configuration...\n');

        // Try connecting
        await mongoose.connect(`mongodb://localhost:27017/${DB_Name}?replicaSet=rs0`);
        console.log('✅ Connected to MongoDB\n');

        // Check server status
        const admin = mongoose.connection.db.admin();
        const serverStatus = await admin.serverStatus();

        console.log('📊 Server Information:');
        console.log(`   MongoDB Version: ${serverStatus.version}`);
        console.log(`   Replica Set: ${serverStatus.repl?.setName || 'NOT CONFIGURED ❌'}`);
        console.log(`   Is Primary: ${serverStatus.repl?.isWritablePrimary || serverStatus.repl?.ismaster || false}`);

        if (!serverStatus.repl || !serverStatus.repl.setName) {
            console.log('\n❌ REPLICA SET NOT CONFIGURED!');
            console.log('\n📝 To fix this:');
            console.log('   1. Stop MongoDB: net stop MongoDB');
            console.log('   2. Edit mongod.cfg and add:');
            console.log('      replication:');
            console.log('        replSetName: rs0');
            console.log('   3. Start MongoDB: net start MongoDB');
            console.log('   4. Initialize: mongosh --eval "rs.initiate()"');
            process.exit(1);
        }

        // Test transaction support
        console.log('\n🧪 Testing Transaction Support...');
        const session = await mongoose.startSession();

        try {
            await session.startTransaction();
            console.log('✅ Transaction started successfully');

            await session.commitTransaction();
            console.log('✅ Transaction committed successfully');

            console.log('\n🎉 SUCCESS! MongoDB is properly configured for transactions.');
        } catch (error) {
            console.log('❌ Transaction test failed:', error.message);
            throw error;
        } finally {
            session.endSession();
        }

        await mongoose.disconnect();
        process.exit(0);

    } catch (error) {
        console.error('\n❌ Error:', error.message);

        if (error.message.includes('Transaction numbers')) {
            console.log('\n💡 This error means:');
            console.log('   - MongoDB is running but NOT in replica set mode');
            console.log('   - Follow the setup steps in MONGODB_REPLICA_SETUP.md');
        } else if (error.message.includes('ECONNREFUSED')) {
            console.log('\n💡 MongoDB is not running. Start it with:');
            console.log('   net start MongoDB');
        }

        process.exit(1);
    }
};

verifyReplicaSet();
