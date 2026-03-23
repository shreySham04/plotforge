import { useCallback, useState } from "react";

export default function useApiRequest(asyncFn) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const execute = useCallback(
    async (...args) => {
      setLoading(true);
      setError("");
      try {
        return await asyncFn(...args);
      } catch (err) {
        const message =
          err?.friendlyMessage ||
          err?.response?.data?.message ||
          err?.message ||
          "Request failed";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [asyncFn]
  );

  return { execute, loading, error, setError };
}
