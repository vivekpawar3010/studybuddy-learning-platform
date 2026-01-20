import axios from 'axios';
import { auth } from './firebase';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add Firebase auth token
api.interceptors.request.use(
  async (config) => {
    try {
      // Get current user
      const user = auth.currentUser;

      if (user) {
        // Get ID token
        const token = await user.getIdToken();

        // Add Authorization header
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('Unauthorized - token may be invalid');
      // You could redirect to login here if needed
    }
    return Promise.reject(error);
  }
);

export default api;