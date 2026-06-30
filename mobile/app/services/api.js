import axios from 'axios';
import { getToken } from './storage';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const data = err.response?.data || {};
    const message = data.error || err.message || 'Something went wrong';
    const error = new Error(message);
    if (data.code) error.code = data.code;
    if (data.resetsAt) error.resetsAt = data.resetsAt;
    return Promise.reject(error);
  }
);

// Bio
export const generateBio = (payload) => api.post('/api/bio/generate', payload);
export const getBioHistory = () => api.get('/api/bio/history');
export const deleteBio = (id) => api.delete(`/api/bio/${id}`);

// Icebreaker
export const generateIcebreakers = (payload) => api.post('/api/icebreaker/generate', payload);
export const getIcebreakerHistory = () => api.get('/api/icebreaker/history');
export const deleteIcebreaker = (id) => api.delete(`/api/icebreaker/${id}`);

// User
export const getUserProfile = () => api.get('/api/user/profile');
export const restorePurchases = () => api.post('/api/user/restore');

// Payments
export const createSubscription = (payload) =>
  api.post('/api/payments/subscribe', payload);
export const createOneTimePayment = (payload) =>
  api.post('/api/payments/one-time', payload);

export default api;
