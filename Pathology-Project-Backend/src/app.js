import express from "express";
import cors from "cors";
import userRoutes from "./routes/user.routes.js";
// import adminRoutes from "./routes/admin.routes.js";
import doctorRoutes from "./routes/doctor.routes.js";
import labtestRoutes from "./routes/labtest.routes.js";
import expenseRoutes from "./routes/expense.routes.js";
import testReportRoutes from "./routes/testReport.routes.js";
import patientRoute from "./routes/patient.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import billRoutes from "./routes/bill.routes.js";
import revenueRoutes from "./routes/revenue.routes.js";
import commissionRoutes from "./routes/commission.routes.js";
import discountRoutes from "./routes/discount.routes.js";
import specializationRoutes from "./routes/specialization.routes.js";
import departmentRoutes from "./routes/department.routes.js";

import { errorHandler } from "./middleware/errorHandler.middleware.js";
import cookieParser from "cookie-parser";
import path from "path";
export const app = express();


// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});


// CORS configuration
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:3000",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true,
  })
);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static("public")); // Serve files from public directory
app.use("/uploads", express.static("uploads")); // Serve uploaded files (reports)
app.use(cookieParser());
// Routes
app.use("/api/user", userRoutes);
// app.use("/api/admin", adminRoutes);
app.use("/api/doctor", doctorRoutes);
app.use("/api/labtest", labtestRoutes);
app.use("/api/expense", expenseRoutes);
app.use("/api/tests", testReportRoutes);
app.use("/api/patient", patientRoute);
app.use("/api/payments", paymentRoutes);
app.use("/api/bills", billRoutes);
app.use("/api/revenue", revenueRoutes);
app.use("/api/commission", commissionRoutes);
app.use("/api/discounts", discountRoutes);
app.use("/api/specializations", specializationRoutes);
app.use("/api/departments", departmentRoutes);
// Health check
app.get("/", (req, res) => {
  res.json({ message: "Pathology Lab API is running" });
});

// Error handling middleware (must be last)
app.use(errorHandler);
