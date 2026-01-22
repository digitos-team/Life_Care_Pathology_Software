import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const authMiddleware = asyncHandler(async (req, res, next) => {
  const token =
    req.cookies?.accessToken || req.headers.authorization?.split(" ")[1];

  if (!token) {
    throw new ApiError(401, "Access token is missing");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    throw new ApiError(401, "Invalid or expired token");
  }
});

// Optional Auth Middleware - Does not throw error if no token
export const optionalAuthMiddleware = asyncHandler(async (req, res, next) => {
  const token =
    req.cookies?.accessToken || req.headers.authorization?.split(" ")[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
    } catch (error) {
      // Token invalid/expired - We ignore it and treat as unauthenticated
      // You could optionally log this
    }
  }
  next();
});

export const adminMiddleware = asyncHandler(async (req, res, next) => {
  if (req.user?.role !== "ADMIN") {
    throw new ApiError(403, "Only admins can perform this action");
  }
  next();
});

export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      throw new ApiError(
        403,
        `Role ${req.user?.role} is not allowed to access this resource`
      );
    }
    next();
  };
};
