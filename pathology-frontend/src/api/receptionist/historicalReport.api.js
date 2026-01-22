import axiosClient from '../axiosClient';

export const uploadHistoricalReport = async (data) => {
    try {
        const response = await axiosClient.post('/tests/add-report', data);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

