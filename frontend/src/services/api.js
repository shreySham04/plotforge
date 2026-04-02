import axios from "axios";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8080").replace(/\/+$/, "");
const baseURL = API_BASE_URL.endsWith("/api") ? API_BASE_URL : `${API_BASE_URL}/api`;

const api = axios.create({
  baseURL
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("writerapp_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      localStorage.removeItem("writerapp_token");
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }

    if (!error.response) {
      error.friendlyMessage = `Cannot reach backend server. Check VITE_API_BASE_URL (${API_BASE_URL}).`;
    } else if (status === 403) {
      error.friendlyMessage = "You do not have permission to perform this action.";
    } else if (status === 401) {
      error.friendlyMessage = "Your session has expired. Please login again.";
    }

    return Promise.reject(error);
  }
);

export default api;
