import axiosClient from '../axiosClient';

// Get all active tests
export const getLabTests = async (params = {}) => {
  try {
    const response = await axiosClient.get('/labtest/gettests', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching lab tests:', error);
    throw error;
  }
};

// Create a new lab test
export const createLabTest = async (testData) => {
  try {
    const response = await axiosClient.post('/labtest/createtest', testData);
    return response.data;
  } catch (error) {
    console.error('Error creating lab test:', error);
    throw error;
  }
};

// Update an existing lab test
export const updateLabTest = async (testId, testData) => {
  try {
    const response = await axiosClient.put(`/labtest/updatetest/${testId}`, testData);
    return response.data;
  } catch (error) {
    console.error('Error updating lab test:', error);
    throw error;
  }
};

// Delete a lab test
export const deleteLabTest = async (testId) => {
  try {
    const response = await axiosClient.delete(`/labtest/${testId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting lab test:', error);
    throw error;
  }
};

