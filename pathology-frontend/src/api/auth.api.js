import axiosClient from './axiosClient';

/**
 * Normalizes the user data from the backend response to match frontend expectations.
 * @param {Object} data - The data object from ApiResponse
 * @returns {Object} Normalized user data
 */
const normalizeUserData = (data) => {
    const { user, token, lab } = data;

    // Normalize role: ADMIN -> Admin, OPERATOR -> Operator
    const normalizedRole = user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase();

    return {
        ...user,
        role: normalizedRole,
        token,
        labId: lab?._id,
        labInfo: lab
    };
};

export const loginUser = async (email, password) => {
    try {
        const response = await axiosClient.post('/user/login', { email, password });

        // The backend returns { data: { token, user, lab }, message, success, errors }
        if (response.data && response.data.success) {
            return {
                success: true,
                data: response.data.data // Contains { token, user, lab }
            };
        } else {
            return {
                success: false,
                message: response.data?.message || 'Login failed'
            };
        }
    } catch (error) {
        console.error('Login API error:', error);
        // Extract message from axios error if available
        const message = error.response?.data?.message || error.message || 'An unexpected error occurred during login';
        return {
            success: false,
            message: message
        };
    }
};

export const logoutUser = async () => {
    try {
        return await axiosClient.post('/user/logout');
    } catch (error) {
        console.error("Logout API Error:", error);
        // Even if API fails, we should clear local state in Context/UI
    }
};

