import express from "express";
import {
  addDoctorController,
  updateDoctorController,
  getAllDoctorsController,
  getDoctorCommissionReportController,
  getDoctorByIdController,
  deleteDoctorController,
} from "../controllers/doctor.controller.js";
import {
  authMiddleware,
  adminMiddleware,
} from "../middleware/user.middleware.js";

const router = express.Router();

// // All routes are protected for Admin
// router.use(authMiddleware, adminMiddleware);

// router.post("/add", addDoctorController);
// router.put("/update/:doctorId", updateDoctorController);
// router.get("/all", getAllDoctorsController);
// router.get("/:doctorId", getDoctorByIdController);
// router.get("/reports/:doctorId", getDoctorCommissionReportController);
// router.delete("/:doctorId", deleteDoctorController);

// export default router;
// All routes are protected for Admin
// router.use(authMiddleware, adminMiddleware);

router.post("/add", authMiddleware, adminMiddleware, addDoctorController);
router.put("/update/:doctorId", authMiddleware, adminMiddleware, updateDoctorController);
router.get("/all", authMiddleware, getAllDoctorsController);
router.get("/reports/:doctorId", authMiddleware, adminMiddleware, getDoctorCommissionReportController);
router.get("/:doctorId", authMiddleware, getDoctorByIdController);
router.delete("/:doctorId", authMiddleware, adminMiddleware, deleteDoctorController);

export default router;