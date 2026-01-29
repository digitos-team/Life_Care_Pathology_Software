import axiosClient from '../axiosClient';

// Create a test order
export const createTestOrder = async (orderData) => {
    try {
        const response = await axiosClient.post('tests/createtestorder', orderData);
        const apiResponse = response.data;
        if (apiResponse && apiResponse.success !== false) {
            return apiResponse.data || apiResponse;
        } else {
            throw new Error(apiResponse?.message || 'Failed to create test order');
        }
    } catch (error) {
        console.error('Error creating test order:', error);
        throw error;
    }
};

// Get all doctors for selection
export const getDoctors = async () => {
    try {
        const response = await axiosClient.get('/doctor/all');
        // Return response.data which contains { doctors: [], pagination: {} }
        return response.data;
    } catch (error) {
        console.error('Error fetching doctors:', error);
        throw error;
    }
};

// Get all pending test orders
export const getPendingOrders = async () => {
    try {
        const response = await axiosClient.get('/tests/pending');
        const apiResponse = response.data;
        if (apiResponse && apiResponse.success !== false) {
            return apiResponse.data || [];
        } else {
            throw new Error(apiResponse?.message || 'Failed to fetch pending orders');
        }
    } catch (error) {
        console.error('Error fetching pending orders:', error);
        throw error;
    }
};

// Submit test result
export const submitTestResult = async (orderId, testItemId, resultData) => {
    try {
        const response = await axiosClient.put(`tests/result/${orderId}/${testItemId}`, resultData);
        const apiResponse = response.data;
        if (apiResponse && apiResponse.success !== false) {
            return apiResponse.data || apiResponse;
        } else {
            throw new Error(apiResponse?.message || 'Failed to submit test result');
        }
    } catch (error) {
        console.error('Error submitting test result:', error);
        throw error;
    }
};

// Get patient test history
export const getPatientTestHistory = async (patientId) => {
    try {
        const response = await axiosClient.get(`/tests/patient/${patientId}`);
        const apiResponse = response.data;
        if (apiResponse && apiResponse.success !== false) {
            return apiResponse.data || { orders: [], reports: [] };
        } else {
            throw new Error(apiResponse?.message || 'Failed to fetch patient history');
        }
    } catch (error) {
        console.error('Error fetching patient history:', error);
        throw error;
    }
};

// Finalize test order (Generate Report)
export const finalizeTestOrder = async (orderId) => {
    try {
        const response = await axiosClient.get(`/tests/finalize/${orderId}`);
        const apiResponse = response.data;
        if (apiResponse && apiResponse.success !== false) {
            return apiResponse.data || apiResponse;
        } else {
            throw new Error(apiResponse?.message || 'Failed to finalize order');
        }
    } catch (error) {
        console.error('Error finalizing order:', error);
        throw error;
    }
};

// Download test report PDF
export const downloadTestReport = async (orderId) => {
    try {
        const response = await axiosClient.get(`/tests/${orderId}/download`, {
            responseType: 'blob' // Important for file download
        });
        return response.data;
    } catch (error) {
        console.error('Error downloading report:', error);
        throw error;
    }
};

// Get Patient Reports (Completed)
export const getPatientReports = async (patientId) => {
    try {
        const response = await axiosClient.get(`/tests/patient/${patientId}/reports`);
        const apiResponse = response.data;
        if (apiResponse && apiResponse.success !== false) {
            return apiResponse.data || [];
        } else {
            throw new Error(apiResponse?.message || 'Failed to fetch patient reports');
        }
    } catch (error) {
        console.error('Error fetching patient reports:', error);
        throw error;
    }
};

// Get All Reports (Global for lab)
export const getAllReports = async (search = '', page = 1, limit = 12) => {
    try {
        const queryParams = new URLSearchParams({
            search,
            page: page.toString(),
            limit: limit.toString()
        }).toString();

        const response = await axiosClient.get(`/tests/reports/all?${queryParams}`);
        const apiResponse = response.data;
        if (apiResponse && apiResponse.success !== false) {
            return apiResponse.data || { reports: [], total: 0, pages: 0, currentPage: 1 };
        } else {
            throw new Error(apiResponse?.message || 'Failed to fetch all reports');
        }
    } catch (error) {
        console.error('Error fetching all reports:', error);
        throw error;
    }
};

// Submit bulk results by bill
export const submitBulkResultsByBill = async (billId, resultData) => {
    try {
        const response = await axiosClient.put(`tests/bill/${billId}/submit`, resultData);
        const apiResponse = response.data;
        if (apiResponse && apiResponse.success !== false) {
            return apiResponse.data || apiResponse;
        } else {
            throw new Error(apiResponse?.message || 'Failed to submit bulk results');
        }
    } catch (error) {
        console.error('Error submitting bulk results:', error);
        throw error;
    }
};

// Send Report Via Email
export const sendReportEmail = async (orderId) => {
    try {
        const response = await axiosClient.get(`/tests/send-report/${orderId}`);
        const apiResponse = response.data;
        if (apiResponse && apiResponse.success !== false) {
            return apiResponse.data || apiResponse;
        } else {
            throw new Error(apiResponse?.message || 'Failed to send report email');
        }
    } catch (error) {
        console.error('Error sending report email:', error);
        throw error;
    }
};

// Delete test order
export const deleteTestOrder = async (orderId) => {
    try {
        const response = await axiosClient.delete(`/tests/${orderId}`);
        const apiResponse = response.data;
        if (apiResponse && apiResponse.success !== false) {
            return apiResponse.data || apiResponse;
        } else {
            throw new Error(apiResponse?.message || 'Failed to delete order');
        }
    } catch (error) {
        console.error('Error deleting order:', error);
        throw error;
    }
};

// Get Daily Stats
export const getDailyStats = async () => {
    try {
        const response = await axiosClient.get('/tests/stats/daily');
        const apiResponse = response.data;
        if (apiResponse && apiResponse.success !== false) {
            return apiResponse.data || apiResponse;
        } else {
            throw new Error(apiResponse?.message || 'Failed to fetch daily stats');
        }
    } catch (error) {
        console.error('Error fetching daily stats:', error);
        throw error;
    }
};

// Unfinalize Report (Undo for Correction)
export const unfinalizeReport = async (orderId) => {
    try {
        const response = await axiosClient.post(`/tests/unfinalize/${orderId}`);
        const apiResponse = response.data;
        if (apiResponse && apiResponse.success !== false) {
            return apiResponse.data;
        } else {
            throw new Error(apiResponse?.message || 'Failed to unlock report');
        }
    } catch (error) {
        console.error('Error unlocking report:', error);
        throw error;
    }
};
