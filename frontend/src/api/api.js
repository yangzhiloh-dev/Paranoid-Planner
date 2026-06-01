// Frontend API Module
// Axios instance with automatic JWT token handling

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

console.log(' [API] Initializing with baseURL:', API_URL);

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    console.log(' [API Request]', config.method.toUpperCase(), config.url, {
      hasToken: !!token,
      data: config.data,
    });

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => {
    console.log(' [API Response]', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error(' [API Error]', {
      status: error.response?.status,
      message: error.response?.data?.error || error.message,
      url: error.config?.url,
      method: error.config?.method,
    });

    if (error.response?.status === 401) {
      localStorage.removeItem('token');

      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (name, email, password) =>
    api.post('/auth/register', { name, email, password }),

  login: (email, password) =>
    api.post('/auth/login', { email, password }),

  getMe: () =>
    api.get('/auth/me'),
};

export const modulesAPI = {
  getModules: () =>
    api.get('/modules'),

  createModule: (data) =>
    api.post('/modules', data),

  updateModule: (id, data) =>
    api.put(`/modules/${id}`, data),

  deleteModule: (id) =>
    api.delete(`/modules/${id}`),
};

export const tasksAPI = {
  getTasks: () =>
    api.get('/tasks'),

  createTask: (data) =>
    api.post('/tasks', data),

  updateTask: (id, data) =>
    api.put(`/tasks/${id}`, data),

  deleteTask: (id) =>
    api.delete(`/tasks/${id}`),
};

export const scheduleAPI = {
  generateSchedule: () =>
    api.post('/schedule/generate'),

  getSchedule: () =>
    api.get('/schedule'),
};

export default api;