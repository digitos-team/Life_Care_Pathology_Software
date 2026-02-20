import axiosClient from "../axiosClient";

export const getCommissionSummary = async (params) => {
    const response = await axiosClient.get("/commission/summary", { params });
    return response.data;
};

export const getDoctorCommissionReport = async (doctorId, params) => {
    const response = await axiosClient.get(`/commission/doctor/${doctorId}/report`, { params });
    return response.data;
};

export const downloadDoctorCommissionReport = async (doctorId, params) => {
    const response = await axiosClient.get(`/commission/doctor/${doctorId}/report/pdf`, {
        params,
        responseType: 'blob'
    });
    return response.data; // Blob data
};

export const downloadDoctorCommissionCSV = async (doctorId, params) => {
    const response = await axiosClient.get(`/commission/doctor/${doctorId}/report/csv`, {
        params,
        responseType: 'blob'
    });
    return response.data; // Blob data
};
