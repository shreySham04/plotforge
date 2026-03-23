import api from "./api";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function searchMedia(query, retries = 1) {
  try {
    const { data } = await api.get("/tmdb/search", { params: { query } });
    return data;
  } catch (error) {
    // Retry once for transient upstream TMDB outages surfaced as 503.
    if (retries > 0 && error?.response?.status === 503) {
      await sleep(450);
      return searchMedia(query, retries - 1);
    }
    throw error;
  }
}

export async function getMovieById(id) {
  const { data } = await api.get(`/tmdb/movie/${id}`);
  return data;
}

export async function getTvById(id) {
  const { data } = await api.get(`/tmdb/tv/${id}`);
  return data;
}

export async function createFanPost(payload) {
  const { data } = await api.post("/fanfuture", payload);
  return data;
}

export async function getFanPosts(params = {}) {
  const { data } = await api.get("/fanfuture", { params });
  return data;
}

export async function getFanPostById(id) {
  const { data } = await api.get(`/fanfuture/${id}`);
  return data;
}

export async function deleteFanPost(id) {
  await api.delete(`/fanfuture/${id}`);
}

export async function likeFanPost(id) {
  const { data } = await api.post(`/fanfuture/${id}/like`);
  return data;
}

export async function createFanComment(payload) {
  const { data } = await api.post("/fanfuture/comments", payload);
  return data;
}

export async function getFanComments(postId) {
  const { data } = await api.get(`/fanfuture/${postId}/comments`);
  return data;
}
