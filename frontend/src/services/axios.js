import axios from "axios";
import { clearStoredToken, getStoredToken } from "./authToken";

const LOCAL_HTTP_PATTERN = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i;
const API = (import.meta.env.VITE_API_BASE_URL || "https://plotforge-1.onrender.com/api").replace(/\/+$/, "");
const HTTPS_API = LOCAL_HTTP_PATTERN.test(API) ? API : API.replace(/^http:\/\//i, "https://");
const BASE_API = HTTPS_API.endsWith("/api") ? HTTPS_API : `${HTTPS_API}/api`;
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 900;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function shouldRetry(error) {
  const status = error?.response?.status;
  if (!error?.response) return true;
  return status === 429 || status >= 500;
}

const apiClient = axios.create({
  baseURL: BASE_API,
  withCredentials: true,
  timeout: 15000
});

apiClient.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const requestConfig = error?.config;

    if (requestConfig && shouldRetry(error)) {
      requestConfig.__retryCount = requestConfig.__retryCount || 0;
      if (requestConfig.__retryCount < MAX_RETRIES) {
        requestConfig.__retryCount += 1;
        await wait(RETRY_DELAY_MS * requestConfig.__retryCount);
        return apiClient(requestConfig);
      }
    }

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
      error.friendlyMessage = `Cannot reach backend server. Check VITE_API_BASE_URL (${BASE_API}).`;
    } else if (status === 400) {
      error.friendlyMessage = error?.response?.data?.message || "Validation failed. Please check your input.";
    } else if (status === 403) {
      error.friendlyMessage = "You do not have permission to perform this action.";
    } else if (status === 401) {
      if (isLoginRequest) {
        error.friendlyMessage = "Invalid email or password.";
      } else if (isRegisterRequest) {
        error.friendlyMessage = error?.response?.data?.message || "Registration failed. Please verify your details and try again.";
      } else {
        error.friendlyMessage = "Your session has expired. Please login again.";
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;