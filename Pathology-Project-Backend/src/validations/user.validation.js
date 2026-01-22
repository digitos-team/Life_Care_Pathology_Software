import { ApiError } from "../utils/ApiError.js";

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateLoginRequest = (data) => {
  const { email, password } = data;

  if (!email /*|| !password*/) {
    throw new ApiError(400, "Email is required");
  }

  if (!validateEmail(email)) {
    throw new ApiError(400, "Invalid email format");
  }

  /*
  if (password.length < 6) {
    throw new ApiError(400, "Password must be at least 6 characters");
  }
  */
};

export const validateCreateAdminRequest = (data) => {
  const { name, email, password } = data;

  if (!name || !email /*|| !password*/) {
    throw new ApiError(400, "Name and email are required");
  }

  if (name.length < 2) {
    throw new ApiError(400, "Name must be at least 2 characters");
  }

  if (!validateEmail(email)) {
    throw new ApiError(400, "Invalid email format");
  }

  
  if (password.length < 8) {
    throw new ApiError(400, "Password must be at least 8 characters");
  }
  
};

export const validateCreateReceptionistRequest = (data) => {
  const { name, email, password } = data;

  if (!name || !email /*|| !password*/) {
    throw new ApiError(400, "Name and email are required");
  }

  if (name.length < 2) {
    throw new ApiError(400, "Name must be at least 2 characters");
  }

  if (!validateEmail(email)) {
    throw new ApiError(400, "Invalid email format");
  }

  /*
  if (password.length < 6) {
    throw new ApiError(400, "Password must be at least 6 characters");
  }
  */
};
