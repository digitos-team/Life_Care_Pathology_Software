import express from "express";
import {
    createDiscountController,
    getLabDiscountsController,
    toggleDiscountStatusController,
    deleteDiscountController,
} from "../controllers/discount.controller.js";
import { authMiddleware, adminMiddleware } from "../middleware/user.middleware.js";

const router = express.Router();

router.use(authMiddleware);

// Admin only routes
router.post("/add", adminMiddleware, createDiscountController);
router.patch("/:id/toggle", adminMiddleware, toggleDiscountStatusController);
router.delete("/:id", adminMiddleware, deleteDiscountController);

// Authenticated routes
router.get("/getdiscounts", getLabDiscountsController);

export default router;
