import axios from 'axios';

// Create a centralized Axios instance
const axiosClient = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api`, // Fallback to localhost if env not set
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',

  },
});

// Request Interceptor: Attach Token
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle Errors (Global)
axiosClient.interceptors.response.use(
  (response) => {
    return response; // Return full response, not just response.data
  },
  (error) => {
    const { response } = error;
    if (response && response.status === 401) {
      // Auto logout on 401 Unauthorized
      localStorage.removeItem('accessToken');
      localStorage.removeItem('digitos-user');
      // Optional: Redirect to login or dispatch an event
      // window.location.href = '/login';
    }

    // Throw error so it can be caught in UI/Context
    throw error;
  }
);

export default axiosClient;
