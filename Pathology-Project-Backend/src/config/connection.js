import mongoose from "mongoose";
import { DB_Name } from "../constant.js";

export const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      "mongodb://localhost:27017/" + DB_Name
    );
    console.log(
      `Database Connected To ${DB_Name} hosted by ${connectionInstance.connection.host}`
    );
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
};
