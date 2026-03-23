import api from "./api";

export async function getSubjects() {
  const { data } = await api.get("/subjects");
  return data;
}

export async function createSubject(payload) {
  const { data } = await api.post("/subjects", payload);
  return data;
}
