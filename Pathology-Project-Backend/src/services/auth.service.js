import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import Lab from "../models/pathologyLab.model.js";
import { ApiError } from "../utils/ApiError.js";

export const loginUser = async (email, password) => {
  const user = await User.findOne({ email }).select("+password");
  if (!user) throw new ApiError(401, "Invalid credentials");

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new ApiError(401, "Invalid credentials");

  let lab;
  if (user.role === "ADMIN") {
    lab = await Lab.findOne({ owner: user._id });
  } else {
    lab = await Lab.findOne({ owner: user.createdBy });
  }

  // Generate JWT token
  const token = jwt.sign(
    { userId: user._id, role: user.role, labId: lab?._id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRY || "7d" }
  );

  return {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    lab,
  };
};
