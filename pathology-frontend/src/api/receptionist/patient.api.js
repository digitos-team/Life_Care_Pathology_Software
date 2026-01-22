import axiosClient from '../axiosClient';

// Get all patients (lab-wise)
export const getPatients = async (params = {}) => {
  try {
    const response = await axiosClient.get('/patient/getallpatient', { params });
    // Backend returns:
    // { statusCode, data: { patients: [...], pagination: { currentPage, totalPages, totalRecords, recordsPerPage, ... } }, message, success }
    const apiResponse = response.data;
    if (apiResponse && apiResponse.success) {
      const { patients, pagination } = apiResponse.data || {};
      return {
        data: patients || [],
        total: pagination?.totalRecords || 0,
        totalPages: pagination?.totalPages || 1,
        page: pagination?.currentPage || params.page || 1,
        limit: pagination?.recordsPerPage || params.limit || 10,
        hasNextPage: pagination?.hasNextPage || false,
        hasPrevPage: pagination?.hasPrevPage || false
      };
    } else {
      throw new Error(apiResponse?.message || 'Failed to fetch patients');
    }
  } catch (error) {
    console.error('Error fetching patients:', error);
    throw error;
  }
};

// Register patient
export const createPatient = async (patientData) => {
  try {
    const response = await axiosClient.post('/patient/add', patientData);
    return response.data;
  } catch (error) {
    console.error('Error creating patient:', error);
    throw error;
  }
};

// Search patient
export const searchPatient = async (params = {}) => {
  try {
    const response = await axiosClient.get('/patient/search', { params });
    return response.data;
  } catch (error) {
    console.error('Error searching patient:', error);
    throw error;
  }
};

// Patient profile
export const getPatientById = async (id) => {
  try {
    const response = await axiosClient.get(`/patient/getpatientbyid/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching patient by ID:', error);
    throw error;
  }
};

// Update patient
export const updatePatient = async (id, patientData) => {
  try {
    const response = await axiosClient.put(`/patient/updatepatient/${id}`, patientData);
    return response.data;
  } catch (error) {
    console.error('Error updating patient:', error);
    throw error;
  }
};

// Get daily patients for a specific month/year
export const getDailyPatient = async (year, month) => {
  try {
    const response = await axiosClient.get('/patient/daily', {
      params: { year, month }
    });
    // Backend returns { statusCode, data: [...], message, success }
    const apiResponse = response.data;
    if (apiResponse && apiResponse.success) {
      return apiResponse.data || [];
    } else {
      throw new Error(apiResponse?.message || 'Failed to fetch daily patients');
    }
  } catch (error) {
    console.error('Error fetching daily patients:', error);
    throw error;
  }
};

// Delete patient (Keeping this if needed, though not in the provided routes list)
export const deletePatient = async (patientId) => {
  try {
    const response = await axiosClient.delete(`/patient/deletepatient/${patientId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting patient:', error);
    throw error;
  }
};

// Get today's patients
export const getTodayPatients = async () => {
  try {
    const now = new Date();

    // Create dates in UTC that match today's calendar date
    const year = now.getFullYear();
    const month = now.getMonth();
    const date = now.getDate();

    // Start of today in local time, converted to UTC
    const startOfDay = new Date(year, month, date, 0, 0, 0, 0);
    // End of today in local time, converted to UTC  
    const endOfDay = new Date(year, month, date, 23, 59, 59, 999);

    const startISO = startOfDay.toISOString();
    const endISO = endOfDay.toISOString();

    console.log('Fetching today\'s patients:', {
      localDate: `${year}-${String(month + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`,
      startOfDay: startISO,
      endOfDay: endISO
    });

    const response = await axiosClient.get('/patient/getallpatient', {
      params: {
        startDate: startISO,
        endDate: endISO
      }
    });

    const apiResponse = response.data;
    if (apiResponse && apiResponse.success) {
      const patients = apiResponse.data?.patients || apiResponse.data?.data || [];
      console.log('Today\'s patients found:', patients.length);
      return {
        data: patients
      };
    } else {
      throw new Error(apiResponse?.message || 'Failed to fetch today\'s patients');
    }
  } catch (error) {
    console.error('Error fetching today\'s patients:', error);
    throw error;
  }
};

// Get total patient count
export const getTotalPatientCount = async () => {
  try {
    const response = await axiosClient.get('/patient/count');
    console.log('Total Patient Count API Response:', response);

    const apiResponse = response.data;
    if (apiResponse && apiResponse.success) {
      const count = apiResponse.data?.count || apiResponse.data?.totalPatients || apiResponse.count || 0;
      console.log('Extracted total patient count:', count);
      return {
        data: {
          totalPatients: count
        }
      };
    } else {
      throw new Error(apiResponse?.message || 'Failed to fetch patient count');
    }
  } catch (error) {
    console.error('Error fetching patient count:', error);
    // Return 0 if endpoint doesn't exist yet
    return { data: { totalPatients: 0 } };
  }
};

