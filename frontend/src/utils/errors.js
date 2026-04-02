export function extractApiError(error, fallback = "Request failed") {
  if (error?.friendlyMessage) return error.friendlyMessage;
  if (!error?.response) {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
    return `Cannot reach backend server. Check VITE_API_BASE_URL (${baseUrl}).`;
  }

  const data = error?.response?.data;
  if (!data) return fallback;

  if (error.response.status === 401) {
    if (!localStorage.getItem("writerapp_token")) {
      return "Invalid email or password.";
    }
    return "Your session expired. Please login again.";
  }
  if (error.response.status === 403) {
    return "You do not have permission to do that.";
  }
  if (error.response.status === 503) {
    return "TMDB is temporarily unavailable. Please retry in a moment.";
  }

  if (Array.isArray(data.details) && data.details.length > 0) {
    return data.details.join(" | ");
  }

  if (typeof data.message === "string" && data.message.trim().length > 0) {
    return data.message;
  }

  return fallback;
}
