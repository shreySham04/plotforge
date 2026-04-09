import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getCurrentUser, login as loginApi, register as registerApi, updateMe } from "../services/authService";
import { clearStoredToken, getStoredToken, setStoredToken } from "../services/authToken";

const AuthContext = createContext(null);
const AUTH_BOOTSTRAP_TIMEOUT_MS = 10000;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(fn, retries = 2, delayMs = 2000) {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) throw error;
    await sleep(delayMs);
    return fetchWithRetry(fn, retries - 1, delayMs);
  }
}

function userFromAuthResponse(response) {
  if (!response) return null;
  return {
    id: response.userId ?? null,
    username: response.username || "",
    email: response.email || ""
  };
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(getStoredToken());
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let timeoutId;

    async function bootstrap() {
      setLoading(true);

      if (!token) {
        setLoading(false);
        return;
      }

      timeoutId = window.setTimeout(() => {
        if (!cancelled) {
          // Prevent an indefinite splash state if backend cold-start is too slow.
          setLoading(false);
        }
      }, AUTH_BOOTSTRAP_TIMEOUT_MS);

      try {
        const current = await fetchWithRetry(() => getCurrentUser(), 2, 2000);
        if (!cancelled) {
          setUser(current);
        }
      } catch (error) {
        if (!cancelled) {
          const status = error?.response?.status;

          if (status === 401) {
            // Token is truly invalid/expired.
            clearStoredToken();
            setToken(null);
            setUser(null);
          } else {
            // Backend may be sleeping/unreachable. Keep persisted token so session survives reload.
          }
        }
      } finally {
        if (timeoutId) {
          window.clearTimeout(timeoutId);
        }
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    bootstrap();

    return () => {
      cancelled = true;
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
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
        setUser(userFromAuthResponse(response));

        fetchWithRetry(() => getCurrentUser(), 2, 2000)
          .then((current) => setUser(current))
          .catch(() => {
            // Keep login successful even if /me is temporarily unavailable.
          });
      },
      async register(payload) {
        const response = await registerApi(payload);
        if (!response?.token) {
          throw new Error("Registration succeeded but no token was returned");
        }
        setStoredToken(response.token);
        setToken(response.token);
        setUser(userFromAuthResponse(response));

        fetchWithRetry(() => getCurrentUser(), 2, 2000)
          .then((current) => setUser(current))
          .catch(() => {
            // Keep registration successful even if /me is temporarily unavailable.
          });
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
