import axiosClient from '../axiosClient';

// Get all lab tests
export const getAllLabTests = async () => {
    try {
        const response = await axiosClient.get('/labtest/gettests');
        // Backend returns { statusCode, data: [...], message, success }
        const apiResponse = response.data;
        if (apiResponse && apiResponse.success) {
            return apiResponse.data || [];
        } else {
            throw new Error(apiResponse?.message || 'Failed to fetch lab tests');
        }
    } catch (error) {
        console.error('Error fetching lab tests:', error);
        throw error;
    }
};

// Get lab test by ID
export const getLabTestById = async (id) => {
    try {
        const response = await axiosClient.get(`/labtest/gettestbyid/${id}`);
        const apiResponse = response.data;
        if (apiResponse && apiResponse.success) {
            return apiResponse.data;
        } else {
            throw new Error(apiResponse?.message || 'Failed to fetch lab test');
        }
    } catch (error) {
        console.error('Error fetching lab test:', error);
        throw error;
    }
};

