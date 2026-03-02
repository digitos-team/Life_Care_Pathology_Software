import { Router } from "express";


import { authMiddleware } from "../middleware/user.middleware.js";
import { createDepartment, deleteDepartment, getDepartmentById, getDepartments, updateDepartment, searchDepartment } from "../controllers/department.controller.js";
const router = Router();


router.use(authMiddleware);

router.post("/add-department", createDepartment);
router.get("/getdepartments", getDepartments);
router.get("/search", searchDepartment);

router.get("/getdepartment/:id", getDepartmentById);
router.put("/update-department/:id", updateDepartment);
router.delete("/delete-department/:id", deleteDepartment);

export default router;
