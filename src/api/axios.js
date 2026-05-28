import axios from 'axios';
import { useAuthStore } from '../store/auth.store';

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
instance.interceptors.request.use(
  (config) => {
    // Read directly from localStorage to ensure we get the latest token
    const token = localStorage.getItem('amiri_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
instance.interceptors.response.use(
  (response) => response.data.data, // Unwrap standard backend response shape
  (error) => {
    if (error.response?.status === 401) {
      // Use the store's clearAuth to reset state and localStorage
      useAuthStore.getState().clearAuth();
      if (window.location.pathname !== '/login' && window.location.pathname !== '/pin') {
        window.location.href = '/login';
      }
    }

    const message = error.response?.data?.error || error.message || 'An unexpected error occurred';
    const details = error.response?.data?.details;
    
    const err = new Error(message);
    err.details = details;
    err.status = error.response?.status;
    
    return Promise.reject(err);
  }
);

export default instance;
