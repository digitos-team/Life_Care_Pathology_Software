import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";

export const errorHandler = (err, req, res, next) => {
  let error = err;

  // Handle ApiError instances
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json(
      new ApiResponse(
        err.statusCode,
        null,
        err.message,
        err.errors
      )
    );
  }

  // Handle MongoDB validation errors
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors)
      .map(e => e.message);
    return res.status(400).json(
      new ApiResponse(400, null, "Validation Error", messages)
    );
  }

  // Handle MongoDB duplicate key errors
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json(
      new ApiResponse(400, null, `${field} already exists`)
    );
  }

  // Handle JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json(
      new ApiResponse(401, null, "Invalid token")
    );
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json(
      new ApiResponse(401, null, "Token expired")
    );
  }

  // Default error response
  console.error("Error:", err);
  res.status(error.statusCode || 500).json(
    new ApiResponse(
      error.statusCode || 500,
      null,
      error.message || "Internal Server Error"
    )
  );
};
