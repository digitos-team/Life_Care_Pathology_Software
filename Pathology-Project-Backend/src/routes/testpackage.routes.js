import express from "express";
import {
    createTestPackage,
    getTestPackages,
    getTestPackageById,
    updateTestPackage,
    deleteTestPackage,
} from "../controllers/testpackage.controller.js";
import { authMiddleware } from "../middleware/user.middleware.js";

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// CRUD routes
router.post("/", createTestPackage);
router.get("/", getTestPackages);
router.get("/:id", getTestPackageById);
router.put("/:id", updateTestPackage);
router.delete("/:id", deleteTestPackage);

export default router;
