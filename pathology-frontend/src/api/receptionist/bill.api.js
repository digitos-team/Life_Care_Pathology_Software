import axiosClient from '../axiosClient';

// Get all bills for the lab
export const getLabBills = async () => {
    try {
        const response = await axiosClient.get('/bills');
        return response.data.data;
    } catch (error) {
        console.error('Error fetching lab bills:', error);
        throw error;
    }
};

// Get bills for a specific patient
export const getPatientBills = async (patientId) => {
    try {
        const response = await axiosClient.get(`/bills/patient/${patientId}`);
        return response.data.data;
    } catch (error) {
        console.error('Error fetching patient bills:', error);
        throw error;
    }
};

// Get bill by ID
export const getBillById = async (billId) => {
    try {
        const response = await axiosClient.get(`/bills/${billId}`);
        return response.data.data;
    } catch (error) {
        console.error('Error fetching bill:', error);
        throw error;
    }
};

// Download Bill PDF
export const downloadBillPDF = async (billId) => {
    try {
        const response = await axiosClient.get(`/bills/${billId}/download`, {
            responseType: 'blob', // Important for file download
        });

        // Create a blob URL and trigger download
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Bill_${billId}.pdf`); // Filename might be overridden by content-disposition
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);

        return true;
    } catch (error) {
        console.error('Error downloading bill PDF:', error);
        throw error;
    }
};

// Get Billing Report (Daily/Monthly)
export const getBillingReport = async (type, year, month) => {
    try {
        const params = { type, year };
        if (month) params.month = month;

        const response = await axiosClient.get('/bills/report', { params });
        return response.data.data;
    } catch (error) {
        console.error('Error fetching billing report:', error);
        throw error;
    }
};

// Download Billing Report (PDF/CSV)
export const downloadBillingReport = async (type, year, month, format = 'pdf') => {
    try {
        const params = { type, year, format };
        if (month) params.month = month;

        const response = await axiosClient.get('/bills/report/download', {
            params,
            responseType: 'blob',
        });

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Billing_Report_${year}_${type}.${format}`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);

        return true;
    } catch (error) {
        console.error('Error downloading billing report:', error);
        throw error;
    }
};

export const deleteBill = async (billId) => {
    try {
        const response = await axiosClient.delete(`/bills/${billId}/cleanup`);
        return response.data;
    } catch (error) {
        console.error('Error deleting bill:', error);
        throw error;
    }
};

