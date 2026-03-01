/**
 * Axios API client – centralised HTTP configuration.
 */
import axios from 'axios';

const API_BASE = '/api/v1';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

// ── Auth ──────────────────────────────────────────────────────────────────
export const login = (username, password) =>
  api.post('/auth/login', { username, password });

export const signup = (username, email, password, phone) =>
  api.post('/auth/signup', { username, email, password, phone });

export const getMe = () => api.get('/auth/me');

// ── Servers ──────────────────────────────────────────────────────────────
export const getServers = () => api.get('/servers/');
export const registerServer = (data) => api.post('/servers/', data);
export const getServerHealth = (id) => api.get(`/servers/${id}/health`);

// ── Metrics ──────────────────────────────────────────────────────────────
export const getLatestMetrics = (serverId) =>
  api.get(`/metrics/${serverId}/latest`);

export const getMetricHistory = (serverId, range = '1h') =>
  api.get(`/metrics/${serverId}/history`, { params: { range } });

// ── Alerts ───────────────────────────────────────────────────────────────
export const getAlerts = (limit = 50, offset = 0) =>
  api.get(`/alerts/?limit=${limit}&offset=${offset}`);

export const getAlertSummary = () => api.get('/alerts/summary');

export const resolveAlert = (alertId) =>
  api.post(`/alerts/${alertId}/resolve`);
