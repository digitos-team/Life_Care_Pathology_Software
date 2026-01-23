import express from "express";
import {
    createSpecialization,
    getAllSpecializations,
    getSpecializationById,
    updateSpecialization,
    deleteSpecialization,
} from "../controllers/specialization.controller.js";
import { authMiddleware } from "../middleware/user.middleware.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/", createSpecialization);
router.get("/", getAllSpecializations);
router.get("/:id", getSpecializationById);
router.put("/:id", updateSpecialization);
router.delete("/:id", deleteSpecialization);

export default router;
