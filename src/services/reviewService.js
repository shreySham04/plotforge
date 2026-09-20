import apiClient from "./axios";

export async function getReviews(page = 0, size = 10, myOnly = false) {
  try {
    const res = await apiClient.get("/reviews", { params: { page, size, myOnly } });
    return res.data;
  } catch {
    return { items: [], totalPages: 1 };
  }
}

export async function createReview(reviewData) {
  const res = await apiClient.post("/reviews", reviewData);
  return res.data;
}

export async function deleteReview(id) {
  await apiClient.delete(`/reviews/${id}`);
}
