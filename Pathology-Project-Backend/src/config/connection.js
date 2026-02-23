import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(process.env.MONGODB_URI);
    console.log(
      `✅ Database Connected | Host: ${connectionInstance.connection.host} | DB: ${connectionInstance.connection.name}`
    );
  } catch (err) {
    console.error("Database Connection Failed:", err.message);
    process.exit(1);
  }
};

