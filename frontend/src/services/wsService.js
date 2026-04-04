import { Client } from "@stomp/stompjs";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "https://plotforge-1.onrender.com").replace(/\/+$/, "");
const NORMALIZED_API_BASE = API_BASE_URL.endsWith("/api") ? API_BASE_URL.slice(0, -4) : API_BASE_URL;
const WS_URL = (import.meta.env.VITE_WS_URL || `${NORMALIZED_API_BASE.replace(/^http/, "ws")}/ws/editor`).replace(/\/+$/, "");

export function createEditorSocket(projectId, onMessage) {
  const client = new Client({
    brokerURL: WS_URL,
    reconnectDelay: 3000,
    onConnect: () => {
      client.subscribe(`/topic/project/${projectId}`, (message) => {
        try {
          onMessage(JSON.parse(message.body));
        } catch {
          // Ignore malformed websocket messages.
        }
      });
    }
  });

  client.activate();
  return client;
}

export function publishEdit(client, projectId, payload) {
  if (!client || !client.connected) return;
  client.publish({
    destination: `/app/project/${projectId}/edit`,
    body: JSON.stringify({ ...payload, messageType: payload.messageType || "EDIT" })
  });
}

export function publishTyping(client, projectId, payload) {
  if (!client || !client.connected) return;
  client.publish({
    destination: `/app/project/${projectId}/edit`,
    body: JSON.stringify({ ...payload, messageType: "TYPING" })
  });
}
