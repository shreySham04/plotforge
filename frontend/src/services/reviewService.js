import api from "./api";

export async function createReview(payload) {
  const { data } = await api.post("/reviews", payload);
  return data;
}

export async function getReviews(mineOnly = false) {
  const { data } = await api.get("/reviews", { params: { mineOnly } });
  return data;
}

export async function deleteReview(id) {
  await api.delete(`/reviews/${id}`);
}
