// user.service.js
import bcrypt from 'bcryptjs';
import User from '../models/user.model.js';
import PathologyLab from '../models/pathologyLab.model.js';
import { ApiError } from '../utils/ApiError.js';

export const registerUserService = async ({ name, email, password, role, createdBy, ...rest }) => {
  const existing = await User.findOne({ email });
  if (existing) throw new ApiError(400, 'User with this email already exists');

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    role,
    createdBy,
    ...rest
  });

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role
  };
};


export const updateUserService = async (userId, { name, email, password, phone, address, bankDetails }) => {
  const updateData = {};
  if (name) updateData.name = name;
  if (email) updateData.email = email;
  if (phone) updateData.phone = phone;
  if (address) updateData.address = address;
  if (bankDetails) updateData.bankDetails = bankDetails;

  if (password) {
    updateData.password = await bcrypt.hash(password, 10);
  }

  const user = await User.findByIdAndUpdate(userId, updateData, { new: true }).select('-password');
  if (!user) throw new ApiError(404, 'User not found');

  return user;
};

export const getLabDetailsService = async (adminId) => {
  const lab = await PathologyLab.findOne({ owner: adminId });
  return lab;
};

export const createOrupdateLabDetailsService = async (adminId, updateData) => {
  const updateOps = { ...updateData, owner: adminId };

  const lab = await PathologyLab.findOneAndUpdate(
    { owner: adminId },
    updateOps,
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  return lab;
};

export const deleteUserService = async (userId) => {
  const user = await User.findByIdAndDelete(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  return user;
};

export const getReceptionistsService = async (adminId) => {
  const receptionists = await User.find({
    role: "RECEPTIONIST",
    createdBy: adminId
  }).select("-password");
  return receptionists;
};
