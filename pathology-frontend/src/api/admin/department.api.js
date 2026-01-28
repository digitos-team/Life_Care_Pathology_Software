import axiosClient from '../axiosClient';

const BASE_URL = '/departments';

export const createDepartment = async (data) => {
    const response = await axiosClient.post(`${BASE_URL}/add-department`, data);
    return response.data;
};

export const getDepartments = async () => {
    const response = await axiosClient.get(`${BASE_URL}/getdepartments`);
    return response.data;
};

export const getDepartmentById = async (id) => {
    const response = await axiosClient.get(`${BASE_URL}/getdepartment/${id}`);
    return response.data;
};

export const searchDepartment = async (query) => {
    const response = await axiosClient.get(`${BASE_URL}/search?query=${query}`);
    return response.data;
};

export const updateDepartment = async (id, data) => {
    const response = await axiosClient.put(`${BASE_URL}/update-department/${id}`, data);
    return response.data;
};

export const deleteDepartment = async (id) => {
    const response = await axiosClient.delete(`${BASE_URL}/delete-department/${id}`);
    return response.data;
};
