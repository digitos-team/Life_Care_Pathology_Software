import axiosClient from '../axiosClient';

// Get all receptionists for the logged-in admin
export const getReceptionists = async () => {
  try {
    const response = await axiosClient.get('/user/receptionists');
    const apiResponse = response.data;
    if (apiResponse && apiResponse.success) {
      return {
        success: true,
        data: apiResponse.data || []
      };
    }
    return { success: false, data: [], message: apiResponse?.message };
  } catch (error) {
    console.error('Error fetching receptionists:', error);
    return { success: false, data: [], message: error.message };
  }
};

// Create a new receptionist
export const createReceptionist = async (receptionistData) => {
  try {
    const payload = {
      ...receptionistData,
      role: 'RECEPTIONIST'
    };
    const response = await axiosClient.post('/user/register', payload);
    const apiResponse = response.data;
    if (apiResponse && apiResponse.success) {
      return { success: true, data: apiResponse.data };
    }
    return { success: false, message: apiResponse?.message };
  } catch (error) {
    console.error('Error creating receptionist:', error);
    return { success: false, message: error.response?.data?.message || error.message };
  }
};

// Delete a receptionist
export const deleteReceptionist = async (receptionistId) => {
  try {
    const response = await axiosClient.delete(`/user/delete-receptionist/${receptionistId}`);
    const apiResponse = response.data;
    if (apiResponse && apiResponse.success) {
      return { success: true };
    }
    return { success: false, message: apiResponse?.message };
  } catch (error) {
    console.error('Error deleting receptionist:', error);
    return { success: false, message: error.response?.data?.message || error.message };
  }
};

// Update a receptionist
export const updateReceptionist = async (userId, updateData) => {
  try {
    const response = await axiosClient.put(`/user/update-receptionist/${userId}`, updateData);
    const apiResponse = response.data;
    if (apiResponse && apiResponse.success) {
      return { success: true, data: apiResponse.data };
    }
    return { success: false, message: apiResponse?.message };
  } catch (error) {
    console.error('Error updating receptionist:', error);
    return { success: false, message: error.response?.data?.message || error.message };
  }
};
