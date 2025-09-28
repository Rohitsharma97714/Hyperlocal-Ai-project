// filepath: c:\Users\HP\OneDrive\Desktop\HyperLocal Ai\frontend\src\api\auth.js
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/auth';
const API_BASE_URL = 'http://localhost:5000/api';

// Create axios instance with interceptors
const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid, clear local storage and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('name');
      localStorage.removeItem('email');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const loginUser = (data) => axios.post(`${API_URL}/login`, data);
export const loginProvider = (data) => axios.post(`${API_URL}/provider/login`, data);
export const loginAdmin = (data) => axios.post(`${API_URL}/admin/login`, data);

export const register = (role, data) => {
  if (role === 'user') return axios.post(`${API_URL}/register`, data);
  if (role === 'provider') return axios.post(`${API_URL}/provider/register`, data);
  if (role === 'admin') return axios.post(`${API_URL}/admin/register`, data);
};

export const verifyOTP = (data) => axios.post(`${API_URL}/verify-otp`, data);

// Protected routes using the configured axios instance
export const getServices = (providerId) => {
  if (providerId) {
    return api.get(`/services/provider/${providerId}`);
  }
  return api.get('/services/public');
};

export const getCategories = () => axios.get(`${API_BASE_URL}/services/categories`);
export const createService = (data) => api.post('/services', data);
export const updateService = (serviceId, data) => api.put(`/services/${serviceId}`, data);
export const deleteService = (serviceId) => api.delete(`/services/${serviceId}`);
export const createBooking = (data) => api.post('/bookings', data);
export const getUserBookings = () => api.get('/bookings/user');
export const getProviderBookings = () => api.get('/bookings/provider');
export const updateBookingStatus = (bookingId, status, notes = '') => api.put(`/bookings/${bookingId}/status`, { status, notes });
export const cancelBooking = (bookingId) => api.patch(`/bookings/${bookingId}/cancel`);
export const submitReview = (bookingId, reviewData) => api.post(`/bookings/${bookingId}/review`, reviewData);
export const searchServices = (query) => api.get(`/search?q=${query}`);
export const updateProfile = (data) => api.put('/auth/profile', data);
