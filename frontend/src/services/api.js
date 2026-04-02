import axios from "axios";
import { clearStoredToken, getStoredToken } from "./authToken";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8080").replace(/\/+$/, "");
const baseURL = API_BASE_URL.endsWith("/api") ? API_BASE_URL : `${API_BASE_URL}/api`;

const api = axios.create({
  baseURL
});

api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const requestUrl = String(error?.config?.url || "");
    const isLoginRequest = /\/auth\/login/.test(requestUrl);
    const isRegisterRequest = /\/auth\/register/.test(requestUrl);
    const isAuthRequest = isLoginRequest || isRegisterRequest;

    if (status === 401 && getStoredToken() && !isAuthRequest) {
      clearStoredToken();
      const onAuthScreen = window.location.pathname.startsWith("/login") || window.location.pathname.startsWith("/register");
      if (!onAuthScreen) {
        window.location.href = "/login";
      }
    }

    if (!error.response) {
      error.friendlyMessage = `Cannot reach backend server. Check VITE_API_BASE_URL (${API_BASE_URL}).`;
    } else if (status === 403) {
      error.friendlyMessage = "You do not have permission to perform this action.";
    } else if (status === 401) {
      if (isLoginRequest) {
        error.friendlyMessage = "Invalid email or password.";
      } else if (isRegisterRequest) {
        error.friendlyMessage = "Registration failed. Please verify your details and try again.";
      } else {
        error.friendlyMessage = "Your session has expired. Please login again.";
      }
    }

    return Promise.reject(error);
  }
);

export default api;
