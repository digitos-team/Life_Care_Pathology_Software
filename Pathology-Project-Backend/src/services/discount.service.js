import Discount from "../models/discount.model.js";
import { ApiError } from "../utils/ApiError.js";

export const createDiscount = async (data, labId) => {
    const discount = await Discount.create({
        ...data,
        labId,
    });
    return discount;
};

export const getLabDiscounts = async (labId, activeOnly = false) => {
    const query = { labId };
    if (activeOnly) query.isActive = true;
    return await Discount.find(query).sort({ isDefault: -1, createdAt: -1 });
};

export const getDiscountById = async (discountId, labId) => {
    const discount = await Discount.findOne({ _id: discountId, labId });
    if (!discount) throw new ApiError(404, "Discount not found");
    return discount;
};

export const updateDiscountStatus = async (discountId, labId, isActive) => {
    const discount = await Discount.findOneAndUpdate(
        { _id: discountId, labId },
        { isActive },
        { new: true }
    );
    if (!discount) throw new ApiError(404, "Discount not found");
    return discount;
};

export const deleteDiscount = async (discountId, labId) => {
    const discount = await Discount.findOneAndDelete({ _id: discountId, labId });
    if (!discount) throw new ApiError(404, "Discount not found");
    return discount;
};

export const getDefaultDiscount = async (labId) => {
    let discount = await Discount.findOne({ labId, isActive: true, isDefault: true });
    if (!discount) {
        // If no default, get the first active one
        discount = await Discount.findOne({ labId, isActive: true }).sort({ createdAt: -1 });
    }
    return discount;
};
