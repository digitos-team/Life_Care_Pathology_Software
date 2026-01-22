// user.controller.js
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import * as userService from "../services/user.service.js";
import * as authService from "../services/auth.service.js";
import {

  validateCreateReceptionistRequest,
  validateLoginRequest
} from "../validations/user.validation.js";
import { ApiError } from "../utils/ApiError.js";


export const registerUserController = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;
  const loggedInUser = req.user;

  let finalRole = role;
  let createdBy = null;

  if (role === "RECEPTIONIST") {
    // 🔒 Authentication check for RECEPTIONIST
    if (!loggedInUser) {
      throw new ApiError(401, "Authentication required to create receptionist");
    }
    if (loggedInUser.role !== "ADMIN") {
      throw new ApiError(403, "Only admin can create receptionist");
    }
    validateCreateReceptionistRequest(req.body);
    createdBy = loggedInUser.userId;
    finalRole = "RECEPTIONIST";
  } else if (role === "ADMIN") {
    // Allow public ADMIN registration (e.g., for initial setup)
    // You might want to add a check here if an ADMIN already exists to prevent multiple admins if that's the requirement
    finalRole = "ADMIN";
  } else {
    throw new ApiError(400, "Invalid role specified");
  }

  const user = await userService.registerUserService({
    ...req.body,
    role: finalRole,
    createdBy,
  });

  res
    .status(201)
    .json(new ApiResponse(201, user, "Receptionist created successfully"));
});

export const loginController = asyncHandler(async (req, res) => {
  validateLoginRequest(req.body);
  const { email, password } = req.body;
  const result = await authService.loginUser(email, password);

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax" // Helpful for some cross-origin setups
  };

  res
    .status(200)
    .cookie("accessToken", result.token, options)
    .json(new ApiResponse(200, result, "Login successful"));
});

export const updateUserController = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const updated = await userService.updateUserService(userId, req.body);
  res.json(new ApiResponse(200, updated, "User profile updated"));
});

export const getLabDetailsController = asyncHandler(async (req, res) => {
  const adminId = req.user.role === 'ADMIN' ? req.user.userId : req.user.createdBy;
  const lab = await userService.getLabDetailsService(adminId);
  res.json(new ApiResponse(200, lab, "Lab details fetched successfully"));
});

export const createOrupdateLabDetailsController = asyncHandler(async (req, res) => {
  const adminId = req.user.userId;
  const updatedLab = await userService.createOrupdateLabDetailsService(adminId, req.body);
  res.json(new ApiResponse(200, updatedLab, "Lab details updated successfully"));
});

export const deleteReceptionistController = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  // Optional: Verify role is RECEPTIONIST before deleting to be safe
  // const user = await userService.getUserById(userId); // Assuming this service exists or we just rely on delete
  // if (user && user.role !== 'RECEPTIONIST') ... 

  await userService.deleteUserService(userId);

  res.json(new ApiResponse(200, {}, "Receptionist deleted successfully"));
});

export const getReceptionistsController = asyncHandler(async (req, res) => {
  const adminId = req.user.userId;
  const receptionists = await userService.getReceptionistsService(adminId);
  res.json(new ApiResponse(200, receptionists, "Receptionists fetched successfully"));
});

export const updateReceptionistController = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  // Optional: Verify role is RECEPTIONIST before updating
  // const user = await userService.getUserById(userId);
  // if (user && user.role !== 'RECEPTIONIST') ...

  const updatedUser = await userService.updateUserService(userId, req.body);
  res.json(new ApiResponse(200, updatedUser, "Receptionist updated successfully"));
});
