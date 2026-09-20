import apiClient from "./axios";

export async function getFanConcepts(page = 0, size = 10) {
  try {
    const res = await apiClient.get("/fan-concepts", { params: { page, size } });
    return res.data;
  } catch {
    return { items: [], totalPages: 1 };
  }
}

export async function createFanConcept(conceptData) {
  const res = await apiClient.post("/fan-concepts", conceptData);
  return res.data;
}

export async function rateFanConcept(id, rating) {
  const res = await apiClient.post(`/fan-concepts/${id}/rate`, { rating });
  return res.data;
}

export async function deleteFanConcept(id) {
  const res = await apiClient.delete(`/fan-concepts/${id}`);
  return res.data;
}
