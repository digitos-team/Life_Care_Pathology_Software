import axiosClient from '../axiosClient';

export const getLabDetails = async () => {
    try {
        const response = await axiosClient.get('/user/lab-details');
        return response.data;
    } catch (error) {
        console.error('Error fetching lab details:', error);
        throw error;
    }
};

export const updateLabDetails = async (labData) => {
    try {
        const response = await axiosClient.put('/user/lab-details', labData);
        return response.data;
    } catch (error) {
        console.error('Error updating lab details:', error);
        throw error;
    }
};

