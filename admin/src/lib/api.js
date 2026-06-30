import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({ baseURL: BASE_URL, timeout: 60000 });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('biogen_admin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r.data,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('biogen_admin_token');
      window.location.href = '/login';
    }
    return Promise.reject(new Error(err.response?.data?.error || err.message));
  }
);

export const adminLogin = (creds) => api.post('/api/admin/login', creds);
export const getOverview = () => api.get('/api/admin/overview');
export const getUsers = (params) => api.get('/api/admin/users', { params });
export const updateUserPlan = (id, plan) => api.put(`/api/admin/users/${id}/plan`, { plan });
export const deleteUser = (id) => api.delete(`/api/admin/users/${id}`);
export const getBios = (params) => api.get('/api/admin/bios', { params });
export const deleteBioAdmin = (id) => api.delete(`/api/admin/bios/${id}`);
export const getErrors = () => api.get('/api/admin/errors');
export const getHealth = () => api.get('/api/admin/health');
export const getSettings = () => api.get('/api/admin/settings');
export const updateSettings = (data) => api.put('/api/admin/settings', data);

export default api;
