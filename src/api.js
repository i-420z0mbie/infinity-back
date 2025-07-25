// api.js
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "./constant";


const BASE_URL = 'https://casazmain.naomall.com/';

// Create API instance
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Enhanced request interceptor
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem(ACCESS_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Improved refresh token flow
const refreshToken = async () => {
  try {
    const refresh = await AsyncStorage.getItem(REFRESH_TOKEN);
    if (!refresh) {
      await AsyncStorage.multiRemove([ACCESS_TOKEN, REFRESH_TOKEN]);
      throw new Error('NO_REFRESH_TOKEN');
    }

    const response = await axios.post(`${BASE_URL}core/token/refresh/`, { refresh });
    await AsyncStorage.setItem(ACCESS_TOKEN, response.data.access);
    return response.data.access;
  } catch (error) {
    await AsyncStorage.multiRemove([ACCESS_TOKEN, REFRESH_TOKEN]);
    throw error;
  }
};

// Response interceptor with enhanced error handling
api.interceptors.response.use(
  response => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Handle 401 errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const newToken = await refreshToken();
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Handle specific error cases
        if (refreshError.message === 'NO_REFRESH_TOKEN') {
          return Promise.reject({ ...error, isGuestError: true });
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Add global error suppressor
api.interceptors.response.use(
  response => response,
  (error) => {
    // Suppress guest-related errors
    if (error.isGuestError) {
      return Promise.resolve({ data: null }); // Return empty response
    }
    
    // Handle network errors
    if (!error.response) {
      return Promise.reject({ ...error, message: 'Network Error' });
    }

    return Promise.reject(error);
  }
);

// Helper function for protected calls
export const protectedCall = async (fn) => {
  try {
    const token = await AsyncStorage.getItem(ACCESS_TOKEN);
    if (!token) return { guest: true, data: null };

    return await fn();
  } catch (error) {
    if (error.response?.status === 401) {
      await AsyncStorage.multiRemove([ACCESS_TOKEN, REFRESH_TOKEN]);
    }
    return { error: error.message, data: null };
  }
};

// Usage example for checking favorites
export const checkFavorite = async (propertyId) => {
  return protectedCall(async () => {
    const response = await api.get(`main/properties/${propertyId}/favorites/`);
    return response.data;
  });
};

export default api;