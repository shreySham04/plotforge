import api from "./api";

function downloadBlob(responseData, mimeType, filename) {
  const blobUrl = URL.createObjectURL(new Blob([responseData], { type: mimeType }));
  const anchor = document.createElement("a");
  anchor.href = blobUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(blobUrl);
}

export async function getProjects(page = 0, size = 10) {
  const { data } = await api.get("/projects", { params: { page, size } });
  return data;
}

export async function createProject(payload) {
  const { data } = await api.post("/projects", payload);
  return data;
}

export async function deleteProject(id) {
  await api.delete(`/projects/${id}`);
}

export async function getProject(id) {
  const { data } = await api.get(`/projects/${id}`);
  return data;
}

export async function inviteCollaborator(projectId, payload) {
  const { data } = await api.post(`/projects/${projectId}/invite`, payload);
  return data;
}

export async function getCollaborators(projectId) {
  const { data } = await api.get(`/projects/${projectId}/collaborators`);
  return data;
}

export async function removeCollaborator(projectId, userId) {
  await api.delete(`/projects/${projectId}/collaborators/${userId}`);
}

export async function getShareLink(projectId) {
  const { data } = await api.get(`/projects/${projectId}/share-link`);
  return data.link;
}

export async function exportProjectPdf(projectId) {
  const response = await api.get(`/projects/${projectId}/export/pdf`, {
    responseType: "blob"
  });

  downloadBlob(response.data, "application/pdf", `project-${projectId}.pdf`);
}

export const exportPdf = exportProjectPdf;

export async function exportProjectTxt(projectId) {
  const response = await api.get(`/projects/${projectId}/export/txt`, {
    responseType: "blob"
  });

  downloadBlob(response.data, "text/plain", `project-${projectId}.txt`);
}

export const exportTxt = exportProjectTxt;

export async function getProjectVersionHistory(projectId, page = 0, size = 20) {
  const { data } = await api.get(`/projects/${projectId}/history`, { params: { page, size } });
  return data;
}

export async function getProjectVersion(projectId, versionId) {
  const { data } = await api.get(`/projects/${projectId}/history/${versionId}`);
  return data;
}

export async function restoreProjectVersion(projectId, versionId) {
  const { data } = await api.post(`/projects/${projectId}/history/${versionId}/restore`);
  return data;
}

export async function getMyInvitations() {
  const { data } = await api.get("/invitations/my");
  return data;
}

export async function respondToInvitation(invitationId, action) {
  const { data } = await api.post(`/invitations/${invitationId}/respond`, { action });
  return data;
}

export async function getSharedProject(token) {
  const { data } = await api.get(`/share/${token}`);
  return data;
}
