import { Client } from "@stomp/stompjs";

const LOCAL_HTTP_PATTERN = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i;
const API = (import.meta.env.VITE_API_BASE_URL || "https://plotforge-1.onrender.com/api").replace(/\/+$/, "");
const HTTPS_API = LOCAL_HTTP_PATTERN.test(API) ? API : API.replace(/^http:\/\//i, "https://");
const NORMALIZED_API_BASE = HTTPS_API.endsWith("/api") ? HTTPS_API.slice(0, -4) : HTTPS_API;
const WS_URL = (import.meta.env.VITE_WS_URL || `${NORMALIZED_API_BASE.replace(/^https?/i, "wss")}/ws/editor`).replace(/\/+$/, "");

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
