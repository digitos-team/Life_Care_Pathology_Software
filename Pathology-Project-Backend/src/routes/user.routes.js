import express from "express";
import {
    registerUserController,
    updateUserController,
    getLabDetailsController,
    createOrupdateLabDetailsController,
    loginController,
    deleteReceptionistController,
    getReceptionistsController,
    updateReceptionistController
} from "../controllers/user.controller.js";
import { authMiddleware, adminMiddleware, optionalAuthMiddleware, authorizeRoles } from "../middleware/user.middleware.js";


const router = express.Router();


router.post("/login", loginController);

// Unified Register Endpoint (Handles Public Admin & Protected Receptionist creation)
router.post("/register", optionalAuthMiddleware, registerUserController);



// Protected routes (Admin only)
// Protected routes (Admin & Receptionist can view, Admin can update)
router.get("/lab-details", authMiddleware, authorizeRoles('ADMIN', 'RECEPTIONIST'), getLabDetailsController);
router.put("/lab-details", authMiddleware, adminMiddleware, createOrupdateLabDetailsController);

// Unified User Registration (Admin creates other admins or receptionists)
// router.post("/register-user", authMiddleware, adminMiddleware, registerUserController);

// Profile updates
// Profile updates
router.put("/update-profile", authMiddleware, adminMiddleware, updateUserController);

// Update Receptionist
router.put("/update-receptionist/:userId", authMiddleware, adminMiddleware, updateReceptionistController);

// Delete Receptionist
router.delete("/delete-receptionist/:userId", authMiddleware, adminMiddleware, deleteReceptionistController);

// Get All Receptionists
router.get("/receptionists", authMiddleware, adminMiddleware, getReceptionistsController);



// Logout route
router.post("/logout", authMiddleware, (req, res) => {
    res.clearCookie("accessToken");
    res.json({
        success: true,
        message: "Logged out successfully"
    });
});

export default router;
