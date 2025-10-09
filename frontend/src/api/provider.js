import axios from 'axios';
import API_BASE_URL from '../config/apiConfig.js';

// Get auth token from localStorage
const getAuthToken = () => {
  return localStorage.getItem('token');
};

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('name');
      localStorage.removeItem('email');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const getApprovalStatus = async () => {
  try {
    const response = await apiClient.get('/provider/status');
    return response;
  } catch (error) {
    console.error('[Provider API] Error fetching approval status:', error);
    if (error.response) {
      console.error('[Provider API] Server responded with:', error.response.status, error.response.data);
    } else if (error.request) {
      console.error('[Provider API] No response received:', error.request);
    } else {
      console.error('[Provider API] Axios config error:', error.message);
    }
    throw error;
  }
};

export const getProfile = async () => {
  try {
    const response = await apiClient.get('/provider/profile');
    return response;
  } catch (error) {
    console.error('[Provider API] Error fetching profile:', error);
    if (error.response) {
      console.error('[Provider API] Server responded with:', error.response.status, error.response.data);
    } else if (error.request) {
      console.error('[Provider API] No response received:', error.request);
    } else {
      console.error('[Provider API] Axios config error:', error.message);
    }
    throw error;
  }
};

export const updateProfile = async (profileData) => {
  try {
    const response = await apiClient.put('/provider/profile', profileData);
    return response;
  } catch (error) {
    console.error('[Provider API] Error updating profile:', error);
    if (error.response) {
      console.error('[Provider API] Server responded with:', error.response.status, error.response.data);
    } else if (error.request) {
      console.error('[Provider API] No response received:', error.request);
    } else {
      console.error('[Provider API] Axios config error:', error.message);
    }
    throw error;
  }
};

export const getApprovedServices = async (providerId) => {
  try {
    const response = await apiClient.get(`/services/provider/${providerId}/approved`);
    return response;
  } catch (error) {
    console.error('[Provider API] Error fetching approved services:', error);
    if (error.response) {
      console.error('[Provider API] Server responded with:', error.response.status, error.response.data);
    } else if (error.request) {
      console.error('[Provider API] No response received:', error.request);
    } else {
      console.error('[Provider API] Axios config error:', error.message);
    }
    throw error;
  }
};

export const getPendingServices = async (providerId) => {
  try {
    const response = await apiClient.get(`/services/provider/${providerId}/pending`);
    return response;
  } catch (error) {
    console.error('[Provider API] Error fetching pending services:', error);
    if (error.response) {
      console.error('[Provider API] Server responded with:', error.response.status, error.response.data);
    } else if (error.request) {
      console.error('[Provider API] No response received:', error.request);
    } else {
      console.error('[Provider API] Axios config error:', error.message);
    }
    throw error;
  }
};

export const addService = async (serviceData) => {
  try {
    if (serviceData instanceof FormData) {
      const response = await apiClient.post('/services', serviceData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response;
    }
    const response = await apiClient.post('/services', serviceData);
    return response;
  } catch (error) {
    console.error('[Provider API] Error adding service:', error);
    if (error.response) {
      console.error('[Provider API] Server responded with:', error.response.status, error.response.data);
    } else if (error.request) {
      console.error('[Provider API] No response received:', error.request);
    } else {
      console.error('[Provider API] Axios config error:', error.message);
    }
    throw error;
  }
};

export const updateService = async (serviceId, serviceData) => {
  try {
    if (serviceData instanceof FormData) {
      const response = await apiClient.put(`/services/${serviceId}`, serviceData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response;
    }
    const response = await apiClient.put(`/services/${serviceId}`, serviceData);
    return response;
  } catch (error) {
    console.error('[Provider API] Error updating service:', error);
    if (error.response) {
      console.error('[Provider API] Server responded with:', error.response.status, error.response.data);
    } else if (error.request) {
      console.error('[Provider API] No response received:', error.request);
    } else {
      console.error('[Provider API] Axios config error:', error.message);
    }
    throw error;
  }
};

export const getPublicServices = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams();
    if (filters.category) queryParams.append('category', filters.category);
    if (filters.location) queryParams.append('location', filters.location);
    if (filters.search) queryParams.append('search', filters.search);

    const response = await apiClient.get(`/services/public?${queryParams.toString()}`);
    return response;
  } catch (error) {
    console.error('[Provider API] Error fetching public services:', error);
    if (error.response) {
      console.error('[Provider API] Server responded with:', error.response.status, error.response.data);
    } else if (error.request) {
      console.error('[Provider API] No response received:', error.request);
    } else {
      console.error('[Provider API] Axios config error:', error.message);
    }
    throw error;
  }
};
