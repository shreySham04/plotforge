import { Client } from "@stomp/stompjs";

function getWsUrl() {
  if (import.meta.env.VITE_WS_URL) return import.meta.env.VITE_WS_URL;
  if (typeof window === "undefined") return "ws://localhost:3000/ws/editor";
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}/ws/editor`;
}
const WS_URL = getWsUrl();

export function createEditorSocket(projectId, onMessage, options = {}) {
  const token =
    options?.token ||
    (typeof localStorage !== "undefined" ? localStorage.getItem("auth_token") : null);
  const shareToken =
    options?.shareToken ||
    (typeof localStorage !== "undefined" ? localStorage.getItem("share_token") : null);

  const connectHeaders = {};
  let wsEndpoint = WS_URL;
  const params = [];

  if (token) {
    connectHeaders.Authorization = `Bearer ${token}`;
    params.push(`token=${encodeURIComponent(token)}`);
  }
  if (shareToken) {
    connectHeaders["x-share-token"] = shareToken;
    params.push(`shareToken=${encodeURIComponent(shareToken)}`);
  }

  if (params.length > 0) {
    wsEndpoint += (wsEndpoint.includes("?") ? "&" : "?") + params.join("&");
  }

  const client = new Client({
    brokerURL: wsEndpoint,
    connectHeaders,
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
