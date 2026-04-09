import apiClient from "./axios";

export async function login(credentials) {
  const payload = {
    ...credentials,
    username: credentials.username || credentials.email
  };
  const res = await apiClient.post("/auth/login", payload);
  return res.data;
}

export async function register(userData) {
  const res = await apiClient.post("/auth/register", userData);
  return res.data;
}

export async function forgotPassword(email) {
  const res = await apiClient.post("/auth/forgot-password", { email });
  return res.data;
}

export async function resetPassword(payload) {
  const res = await apiClient.post("/auth/reset-password", payload);
  return res.data;
}

export async function getCurrentUser() {
  const res = await apiClient.get("/auth/me");
  return res.data;
}

export const me = getCurrentUser;

export async function updateMe(payload) {
  const res = await apiClient.put("/auth/me", payload);
  return res.data;
}
