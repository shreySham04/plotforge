import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getCurrentUser, login as loginApi, register as registerApi, updateMe } from "../services/authService";
import { clearStoredToken, getStoredToken, setStoredToken } from "../services/authToken";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(getStoredToken());
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function bootstrap() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const current = await getCurrentUser();
        setUser(current);
      } catch {
        clearStoredToken();
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    bootstrap();
  }, [token]);

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      async login(credentials) {
        const response = await loginApi(credentials);
        if (!response?.token) {
          throw new Error("Login succeeded but no token was returned");
        }
        setStoredToken(response.token);
        setToken(response.token);
        const current = await getCurrentUser();
        setUser(current);
      },
      async register(payload) {
        const response = await registerApi(payload);
        if (!response?.token) {
          throw new Error("Registration succeeded but no token was returned");
        }
        setStoredToken(response.token);
        setToken(response.token);
        const current = await getCurrentUser();
        setUser(current);
      },
      async updateProfile(payload) {
        const response = await updateMe(payload);
        setStoredToken(response.token);
        setToken(response.token);
        const current = await getCurrentUser();
        setUser(current);
      },
      logout() {
        clearStoredToken();
        setToken(null);
        setUser(null);
      }
    }),
    [token, user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
