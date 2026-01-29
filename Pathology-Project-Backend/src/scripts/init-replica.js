import mongoose from 'mongoose';
import { DB_Name } from '../constant.js';

const initReplicaSet = async () => {
    try {
        console.log('📡 Connecting to MongoDB to initialize Replica Set...');

        // Connect WITH directConnection to perform administrative tasks on uninitialized replica set
        await mongoose.connect(`mongodb://127.0.0.1:27017/${DB_Name}`, {
            directConnection: true
        });

        const admin = mongoose.connection.db.admin();
        const info = await admin.serverStatus();

        if (info.repl && info.repl.setName) {
            if (info.repl.setName === 'rs0') {
                console.log('✅ Replica Set "rs0" is ALREADY initialized.');
            } else {
                console.log(`⚠️ MongoDB is part of a different replica set: "${info.repl.setName}". Please check config.`);
            }
        } else {
            console.log('⚙️ Initializing Replica Set "rs0"...');
            try {
                // Command to initiate replica set
                const result = await admin.command({
                    replSetInitiate: {
                        _id: "rs0",
                        members: [{ _id: 0, host: "localhost:27017" }]
                    }
                });
                console.log('✅ Replica Set Initialized Successfully!', result);
            } catch (err) {
                if (err.message.includes("already initialized")) {
                    console.log('✅ Replica Set was already initialized.');
                } else {
                    throw err;
                }
            }
        }

        console.log('\n🎉 SUCCESS: MongoDB is ready for transactions!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error);
        console.log('\n💡 Tip: Did you run the PowerShell script to update mongod.cfg and restart the service?');
        process.exit(1);
    }
};

initReplicaSet();
