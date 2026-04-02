import api from "./api";

export async function login(credentials) {
  const payload = {
    ...credentials,
    username: credentials.username || credentials.email
  };
  const { data } = await api.post("/auth/login", payload);
  return data;
}

export async function register(userData) {
  const { data } = await api.post("/auth/register", userData);
  return data;
}

export async function getCurrentUser() {
  const { data } = await api.get("/auth/me");
  return data;
}

export const me = getCurrentUser;

export async function updateMe(payload) {
  const { data } = await api.put("/auth/me", payload);
  return data;
}
