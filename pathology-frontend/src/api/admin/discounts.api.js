import axiosClient from '../axiosClient';

// Get all discounts for the lab
export const getDiscounts = async (activeOnly = false) => {
    try {
        const response = await axiosClient.get('/discounts/getdiscounts', {
            params: { activeOnly }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching discounts:', error);
        throw error;
    }
};

// Create a new discount
export const createDiscount = async (discountData) => {
    try {
        const response = await axiosClient.post('/discounts/add', discountData);
        return response.data;
    } catch (error) {
        console.error('Error creating discount:', error);
        throw error;
    }
};

// Toggle discount active status
export const toggleDiscountStatus = async (discountId, isActive) => {
    try {
        const response = await axiosClient.patch(`/discounts/${discountId}/toggle`, {
            isActive
        });
        return response.data;
    } catch (error) {
        console.error('Error toggling discount status:', error);
        throw error;
    }
};

// Delete a discount
export const deleteDiscount = async (discountId) => {
    try {
        const response = await axiosClient.delete(`/discounts/${discountId}`);
        return response.data;
    } catch (error) {
        console.error('Error deleting discount:', error);
        throw error;
    }
};

