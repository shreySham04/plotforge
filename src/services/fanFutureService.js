import apiClient from "./axios";

export async function getFanFuturePosts(page = 0, size = 10, search = "") {
  try {
    const res = await apiClient.get("/fan-future", { params: { page, size, search } });
    return res.data;
  } catch {
    return { items: [], totalPages: 1 };
  }
}

export async function getTrendingFanFuturePosts() {
  try {
    const res = await apiClient.get("/fan-future/trending");
    return res.data;
  } catch {
    return [];
  }
}

export async function createFanFuturePost(postData) {
  const res = await apiClient.post("/fan-future", postData);
  return res.data;
}

export async function likeFanFuturePost(id) {
  const res = await apiClient.post(`/fan-future/${id}/like`);
  return res.data;
}

export async function addFanFutureComment(id, text) {
  const res = await apiClient.post(`/fan-future/${id}/comments`, { text });
  return res.data;
}

export async function getFanFutureComments(id) {
  try {
    const res = await apiClient.get(`/fan-future/${id}/comments`);
    return res.data;
  } catch {
    return [];
  }
}

export async function deleteFanFuturePost(id) {
  const res = await apiClient.delete(`/fan-future/${id}`);
  return res.data;
}
