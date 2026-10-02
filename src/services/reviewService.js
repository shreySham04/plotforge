import apiClient from "./axios";

export async function getReviews(page = 0, size = 50, myOnly = false, movie = "") {
  try {
    const params = { page, size, myOnly: Boolean(myOnly) };
    if (movie) params.movie = movie;
    const res = await apiClient.get("/reviews", { params });
    return res.data;
  } catch {
    return [];
  }
}

export async function getMovieSummaries() {
  try {
    const res = await apiClient.get("/reviews/movies");
    return res.data;
  } catch {
    return [];
  }
}

export async function createReview(reviewData) {
  const resolvedMovie = reviewData.mediaTitle || reviewData.movieTitle || "General Media";
  const payload = {
    ...reviewData,
    movieTitle: resolvedMovie,
    mediaTitle: resolvedMovie,
    reviewTitle: reviewData.reviewTitle || `Critique of ${resolvedMovie}`,
    mediaPoster: reviewData.mediaPoster || reviewData.poster || "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=300",
    poster: reviewData.mediaPoster || reviewData.poster || "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=300"
  };
  const res = await apiClient.post("/reviews", payload);
  return res.data;
}

export async function likeReview(id) {
  const res = await apiClient.post(`/reviews/${id}/like`);
  return res.data;
}

export async function deleteReview(id) {
  await apiClient.delete(`/reviews/${id}`);
}
