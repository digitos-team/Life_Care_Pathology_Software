// src/routes/test.routes.js

import { Router } from "express";
import { adminMiddleware, authMiddleware } from "../middleware/user.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import * as testValidation from "../validations/labtest.validation.js";
import * as testController from "../controllers/labtest.controller.js";



const router = Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * @route   POST /api/tests
 * @desc    Create new test
 * @access  Admin
 */
router.post(
    "/createtest",
    adminMiddleware,
    validate(testValidation.createTest),
    testController.createTest
);

/**
 * @route   GET /api/tests
 * @desc    Get all active tests
 * @access  Admin, Operator
 */
router.get(
    "/gettests",
    testController.getAllTests
);

/**
 * @route   GET /api/tests/:id
 * @desc    Get test by ID
 * @access  Admin, Operator
 */
router.get(
    "/gettestbyid/:id",
    testController.getTestById
);

/**
 * @route   PUT /api/tests/:id
 * @desc    Update test
 * @access  Admin
 */
router.put(
    "/updatetest/:id",
    adminMiddleware,
    validate(testValidation.updateTest),
    testController.updateTest
);

/**
 * @route   DELETE /api/tests/:id
 * @desc    Soft delete test
 * @access  Admin
 */
router.delete(
    "/:id",
    adminMiddleware,
    testController.deleteTest
);

export default router;