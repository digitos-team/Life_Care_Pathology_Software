import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },

  password: {
    type: String,
    required: true,
    select: false // VERY IMPORTANT
  },

  role: {
    type: String,
    enum: ['ADMIN', 'RECEPTIONIST'],
    required: true
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
    // Admin who created this user (null for first admin)
  },

  phone: String,
  address: String,
  bankDetails: {
    bankName: String,
    accountNumber: String,
    ifscCode: String,
    accountHolderName: String
  }

}, { timestamps: true });

export default mongoose.model("User", userSchema);