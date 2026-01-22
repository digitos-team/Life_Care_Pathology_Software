import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import * as discountService from "../services/discount.service.js";

export const createDiscountController = asyncHandler(async (req, res) => {
    const labId = req.user.labId;
    const discount = await discountService.createDiscount(req.body, labId);
    res.status(201).json(new ApiResponse(201, discount, "Discount created successfully"));
});

export const getLabDiscountsController = asyncHandler(async (req, res) => {
    const labId = req.user.labId;
    const activeOnly = req.query.activeOnly === "true";
    const discounts = await discountService.getLabDiscounts(labId, activeOnly);
    res.json(new ApiResponse(200, discounts, "Discounts fetched successfully"));
});

export const toggleDiscountStatusController = asyncHandler(async (req, res) => {
    const labId = req.user.labId;
    const { id } = req.params;
    const { isActive } = req.body;
    const discount = await discountService.updateDiscountStatus(id, labId, isActive);
    res.json(new ApiResponse(200, discount, `Discount ${isActive ? "activated" : "deactivated"} successfully`));
});

export const deleteDiscountController = asyncHandler(async (req, res) => {
    const labId = req.user.labId;
    const { id } = req.params;
    await discountService.deleteDiscount(id, labId);
    res.json(new ApiResponse(200, {}, "Discount deleted successfully"));
});
