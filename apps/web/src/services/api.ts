import axios from 'axios';
import { supabase } from '../lib/supabase';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add Supabase auth token to requests
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = '/sign-in';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  getGmailOAuthUrl: () => api.post('/auth/gmail/url'),
  getOutlookOAuthUrl: () => api.post('/auth/outlook/url'),
  disconnectAccount: (accountId: string) => api.delete(`/auth/disconnect/${accountId}`),
};

// User API
export const userApi = {
  getMe: () => api.get('/auth/me'),
  updateSettings: (data: { currency?: string; timezone?: string; name?: string }) =>
    api.patch('/user/settings', data),
  completeOnboarding: () => api.post('/user/complete-onboarding'),
  getConnectedAccounts: () => api.get('/user/connected-accounts'),
};

// Subscriptions API
export const subscriptionsApi = {
  list: (params?: { status?: string; categoryId?: string }) =>
    api.get('/subscriptions', { params }),
  get: (id: string) => api.get(`/subscriptions/${id}`),
  create: (data: any) => api.post('/subscriptions', data),
  update: (id: string, data: any) => api.put(`/subscriptions/${id}`, data),
  delete: (id: string) => api.delete(`/subscriptions/${id}`),
};

// Categories API
export const categoriesApi = {
  list: () => api.get('/categories'),
  create: (data: { name: string; icon?: string; color?: string }) =>
    api.post('/categories', data),
  update: (id: string, data: any) => api.put(`/categories/${id}`, data),
  delete: (id: string) => api.delete(`/categories/${id}`),
};

// Analytics API
export const analyticsApi = {
  getSummary: () => api.get('/analytics/summary'),
  getTrend: () => api.get('/analytics/trend'),
};

export default api;
