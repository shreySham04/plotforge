import api from "./api";

export async function getProjectContent(projectId) {
  const { data } = await api.get(`/content/${projectId}`);
  return data;
}

export async function updateProjectContent(projectId, payload) {
  const { data } = await api.put(`/content/${projectId}`, payload);
  return data;
}

export async function getProjectHistory(projectId) {
  const { data } = await api.get(`/content/${projectId}/history`);
  return data;
}

export async function getComments(projectId, page = 0, size = 20) {
  const { data } = await api.get(`/comments/${projectId}`, { params: { page, size } });
  return data;
}

export async function addComment(payload) {
  const { data } = await api.post(`/comments`, payload);
  return data;
}

export async function deleteComment(commentId) {
  await api.delete(`/comments/${commentId}`);
}
