import axiosClient from "../axiosClient";

export const getDoctors = async (params = {}) => {
  try {
    const response = await axiosClient.get("/doctor/all", {
      params,
    });
    // response is the backend body.
    return response.data;
  } catch (error) {
    console.error("Error fetching doctors:", error);
    throw error;
  }
};

export const createDoctor = async (doctorData) => {
  try {
    const response = await axiosClient.post("/doctor/add", doctorData);
    return response.data;
  } catch (error) {
    console.error("Error creating doctor:", error);
    throw error;
  }
};

export const updateDoctor = async (doctorId, doctorData) => {
  try {
    const response = await axiosClient.put(
      `/doctor/update/${doctorId}`,
      doctorData
    );
    return response.data;
  } catch (error) {
    console.error("Error updating doctor:", error);
    throw error;
  }
};

export const deleteDoctor = async (doctorId) => {
  try {
    const response = await axiosClient.delete(`/doctor/${doctorId}`);
    return response.data; // Usually { success: true, ... }
  } catch (error) {
    console.error("Error deleting doctor:", error);
    throw error;
  }
};

export const getDoctorById = async (id) => {
  try {
    const response = await axiosClient.get(`/doctor/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching doctor details:", error);
    throw error;
  }
};

export const getDoctorCommissionReport = async (doctorId, type = 'all') => {
  try {
    const response = await axiosClient.get(`/doctor/reports/${doctorId}`, {
      params: { type }
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching doctor commission report:", error);
    throw error;
  }
};
