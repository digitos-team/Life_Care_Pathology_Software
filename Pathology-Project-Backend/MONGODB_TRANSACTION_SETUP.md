# MongoDB Transaction Setup Guide

## ⚠️ IMPORTANT: Transactions Require MongoDB Replica Set

The payment system now uses **MongoDB transactions** for data integrity. Transactions require MongoDB to run in **replica set mode**.

---

## 🔧 Quick Setup for Local Development

### Option 1: Convert Standalone MongoDB to Replica Set (Easiest)

1. **Stop MongoDB** (if running):
   ```powershell
   net stop MongoDB
   ```

2. **Edit MongoDB config file** (`C:\Program Files\MongoDB\Server\<version>\bin\mongod.cfg`):
   ```yaml
   replication:
     replSetName: "rs0"
   ```

3. **Restart MongoDB**:
   ```powershell
   net start MongoDB
   ```

4. **Initialize Replica Set**:
   Open MongoDB shell:
   ```powershell
   mongosh
   ```
   
   Then run:
   ```javascript
   rs.initiate({
     _id: "rs0",
     members: [{ _id: 0, host: "localhost:27017" }]
   })
   ```

5. **Verify**:
   ```javascript
   rs.status()
   ```

6. **Update your connection string** in `src/config/connection.js`:
   ```javascript
   const connectionInstance = await mongoose.connect(
     "mongodb://localhost:27017/" + DB_Name + "?replicaSet=rs0"
   );
   ```

---

### Option 2: Docker (Alternative)

If you use Docker, you can run MongoDB with replica set:

```bash
docker run -d --name mongodb-replica \
  -p 27017:27017 \
  mongo:latest \
  --replSet rs0
  
docker exec -it mongodb-replica mongosh --eval "rs.initiate()"
```

---

## ✅ What's Now Protected by Transactions:

### Payment Recording (`payment.service.js`)
All these operations happen **atomically** (all or nothing):

1. ✅ Create Payment record
2. ✅ Update Bill status to "PAID"
3. ✅ Create Commission expense (if doctor exists)
4. ✅ Create Revenue record

**Benefits:**
- **No partial payments** - either everything succeeds or nothing changes
- **Data consistency** - financial records always match
- **Rollback on failure** - automatic cleanup if any step fails
- **Duplicate prevention** - transactionId uniqueness enforced

---

## 🔍 Testing the Transaction

After setup, test the payment flow:

```javascript
// This will either:
// ✅ Complete all 4 operations successfully
// OR
// ❌ Rollback everything and throw an error

POST /api/payments/record
{
  "billId": "...",
  "amount": 1000,
  "paymentMethod": "CASH",
  "transactionId": "TXN123456", // Optional but recommended
  "discountId": "..." // Optional
}
```

---

## 🚨 Fallback Mode (If Replica Set Not Available)

If you cannot set up a replica set right now, the code will:

1. ❌ **Fail with error**: "Transaction numbers are only allowed on a replica set member or mongos"
2. You'll need to temporarily disable transactions by reverting the payment service

To temporarily disable (NOT RECOMMENDED for production):
- Remove transaction code from `payment.service.js`
- Use the old version without `session.startTransaction()`

---

## 📊 Performance Impact

- **Minimal overhead** (~5-10ms per transaction)
- **Worth it** for data integrity in financial operations
- **100-150 patients/day** = easily handled

---

## Need Help?

If you encounter issues setting up replica set, let me know and I can:
1. Help with specific MongoDB config
2. Provide alternative solutions
3. Create a fallback version without transactions
