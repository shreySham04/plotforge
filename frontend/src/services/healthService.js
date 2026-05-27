import apiClient from "./api";

export async function warmBackend() {
  try {
    await apiClient.get("/health");
  } catch {
    // Ignore warm-up failures to avoid blocking the UI.
  }
}
