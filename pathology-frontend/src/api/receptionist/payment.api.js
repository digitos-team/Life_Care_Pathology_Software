import axiosClient from '../axiosClient';

// Record a new payment
export const recordPayment = async (paymentData) => {
    try {
        const response = await axiosClient.post('/payments/record', paymentData);
        return response.data.data;
    } catch (error) {
        console.error('Error recording payment:', error);
        throw error;
    }
};

// Get payments for a specific bill
export const getBillPayments = async (billId) => {
    try {
        const response = await axiosClient.get(`/payments/bill/${billId}`);
        return response.data.data;
    } catch (error) {
        console.error('Error fetching bill payments:', error);
        throw error;
    }
};

// Get all payments for the lab
export const getLabPayments = async (params) => {
    try {
        const response = await axiosClient.get('/payments', { params });
        return response.data.data;
    } catch (error) {
        console.error('Error fetching lab payments:', error);
        throw error;
    }
};

