import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8080/api"
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
      error.friendlyMessage = "Cannot reach backend server. Make sure API is running on http://localhost:8080.";
    } else if (status === 403) {
      error.friendlyMessage = "You do not have permission to perform this action.";
    } else if (status === 401) {
      error.friendlyMessage = "Your session has expired. Please login again.";
    }

    return Promise.reject(error);
  }
);

export default api;
