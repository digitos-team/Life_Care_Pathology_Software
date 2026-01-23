import axiosClient from "../axiosClient";

export const createSpecialization = async (data) => {
    // Assuming the backend has route /api/specializations
    const response = await axiosClient.post("/specializations", data);
    return response.data;
};

export const getAllSpecializations = async (params) => {
    const response = await axiosClient.get("/specializations", { params });
    return response.data;
};

export const getSpecializationById = async (id) => {
    const response = await axiosClient.get(`/specializations/${id}`);
    return response.data;
};

export const updateSpecialization = async (id, data) => {
    const response = await axiosClient.put(`/specializations/${id}`, data);
    return response.data;
};

export const deleteSpecialization = async (id) => {
    const response = await axiosClient.delete(`/specializations/${id}`);
    return response.data;
};
