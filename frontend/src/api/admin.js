import axios from 'axios';
import API_BASE_URL from '../config/apiConfig.js';

// Get pending providers
export const getPendingProviders = async () => {
  const token = localStorage.getItem('token');
  console.log('Frontend API: getPendingProviders - Token present:', !!token, 'Length:', token?.length);
  const response = await axios.get(`${API_BASE_URL}/pending-providers`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// Get pending services
export const getPendingServices = async () => {
  const token = localStorage.getItem('token');
  const response = await axios.get(`${API_BASE_URL}/pending-services`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// Get approved providers
export const getApprovedProviders = async () => {
  const token = localStorage.getItem('token');
  const response = await axios.get(`${API_BASE_URL}/approved-providers`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// Get approved services
export const getApprovedServices = async () => {
  const token = localStorage.getItem('token');
  const response = await axios.get(`${API_BASE_URL}/approved-services`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// Get rejected providers
export const getRejectedProviders = async () => {
  const token = localStorage.getItem('token');
  const response = await axios.get(`${API_BASE_URL}/rejected-providers`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// Get rejected services
export const getRejectedServices = async () => {
  const token = localStorage.getItem('token');
  const response = await axios.get(`${API_BASE_URL}/rejected-services`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// Update admin profile
export const updateAdminProfile = async (profileData) => {
  const token = localStorage.getItem('token');
  const response = await axios.put(`${API_BASE_URL}/profile`, profileData, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// Approve a provider
export const approveProvider = async (providerId, adminNotes) => {
  const token = localStorage.getItem('token');
  const response = await axios.put(`${API_BASE_URL}/providers/${providerId}/approve`, { adminNotes }, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// Reject a provider
export const rejectProvider = async (providerId, adminNotes) => {
  const token = localStorage.getItem('token');
  const response = await axios.put(`${API_BASE_URL}/providers/${providerId}/reject`, { adminNotes }, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// Approve a service
export const approveService = async (serviceId, adminNotes) => {
  const token = localStorage.getItem('token');
  const response = await axios.patch(`${API_BASE_URL}/services/${serviceId}/status`, { status: 'approved', adminNotes }, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// Reject a service
export const rejectService = async (serviceId, adminNotes) => {
  const token = localStorage.getItem('token');
  const response = await axios.patch(`${API_BASE_URL}/services/${serviceId}/status`, { status: 'rejected', adminNotes }, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// Approve a booking
export const approveBooking = async (bookingId, notes) => {
  const token = localStorage.getItem('token');
  const response = await axios.put(`${API_BASE_URL}/bookings/${bookingId}/status`, { status: 'approved', notes }, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// Reject a booking (delete from database)
export const rejectBooking = async (bookingId, notes) => {
  const token = localStorage.getItem('token');
  // Assuming backend API supports DELETE for booking rejection and deletion
  const response = await axios.delete(`${API_BASE_URL}/bookings/${bookingId}`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { notes }
  });
  return response.data;
};
