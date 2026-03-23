export function extractApiError(error, fallback = "Request failed") {
  if (error?.friendlyMessage) return error.friendlyMessage;
  if (!error?.response) return "Cannot reach backend server. Make sure API is running on http://localhost:8080.";

  const data = error?.response?.data;
  if (!data) return fallback;

  if (error.response.status === 401) {
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
