import { useMemo } from "react";
import { useAuth } from "../context/AuthContext";

export default function useAuthUser() {
  const { user, token, loading, logout } = useAuth();

  return useMemo(
    () => ({
      user,
      token,
      loading,
      isAuthenticated: Boolean(token),
      logout
    }),
    [user, token, loading, logout]
  );
}
