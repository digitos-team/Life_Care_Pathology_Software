import express from "express";
import {
    getRevenueStatsController,
    getRevenueAnalyticsController,
    deleteRevenueController
} from "../controllers/revenue.controller.js";
import { authMiddleware, adminMiddleware } from "../middleware/user.middleware.js";

const router = express.Router();

router.use(authMiddleware);
router.use(adminMiddleware); // Only admin can view revenue

// Get revenue stats
router.get("/stats", getRevenueStatsController);

// Get unified revenue analytics (includes monthly & daily)
router.get("/analytics", getRevenueAnalyticsController);

// Delete revenue record
router.delete("/:revenueId", deleteRevenueController);

export default router;
