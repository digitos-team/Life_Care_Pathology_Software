import express from "express";
import {
    recordPaymentController,
    getBillPaymentsController,
    getLabPaymentsController,
} from "../controllers/payment.controller.js";
import { authMiddleware } from "../middleware/user.middleware.js";

const router = express.Router();

router.use(authMiddleware);

// Record payment
router.post("/record", recordPaymentController);

// Get payments for bill
router.get("/bill/:billId", getBillPaymentsController);

// Get all lab payments
router.get("/", getLabPaymentsController);

export default router;
