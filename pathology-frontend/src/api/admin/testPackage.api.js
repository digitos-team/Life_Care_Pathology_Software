import axiosClient from '../axiosClient';

// Get all test packages
export const getTestPackages = async (params = {}) => {
    try {
        const response = await axiosClient.get('/test-packages', { params });
        return response.data;
    } catch (error) {
        console.error('Error fetching test packages:', error);
        throw error;
    }
};

// Get test package by ID
export const getTestPackageById = async (packageId) => {
    try {
        const response = await axiosClient.get(`/test-packages/${packageId}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching test package:', error);
        throw error;
    }
};

// Create a new test package
export const createTestPackage = async (packageData) => {
    try {
        const response = await axiosClient.post('/test-packages', packageData);
        return response.data;
    } catch (error) {
        console.error('Error creating test package:', error);
        throw error;
    }
};

// Update an existing test package
export const updateTestPackage = async (packageId, packageData) => {
    try {
        const response = await axiosClient.put(`/test-packages/${packageId}`, packageData);
        return response.data;
    } catch (error) {
        console.error('Error updating test package:', error);
        throw error;
    }
};

// Delete a test package
export const deleteTestPackage = async (packageId) => {
    try {
        const response = await axiosClient.delete(`/test-packages/${packageId}`);
        return response.data;
    } catch (error) {
        console.error('Error deleting test package:', error);
        throw error;
    }
};
