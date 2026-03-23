import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { login as loginApi, me, register as registerApi, updateMe } from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("writerapp_token"));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function bootstrap() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const current = await me();
        setUser(current);
      } catch {
        localStorage.removeItem("writerapp_token");
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
        localStorage.setItem("writerapp_token", response.token);
        setToken(response.token);
        const current = await me();
        setUser(current);
      },
      async register(payload) {
        const response = await registerApi(payload);
        localStorage.setItem("writerapp_token", response.token);
        setToken(response.token);
        const current = await me();
        setUser(current);
      },
      async updateProfile(payload) {
        const response = await updateMe(payload);
        localStorage.setItem("writerapp_token", response.token);
        setToken(response.token);
        const current = await me();
        setUser(current);
      },
      logout() {
        localStorage.removeItem("writerapp_token");
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
