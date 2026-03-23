import { Client } from "@stomp/stompjs";

export function createEditorSocket(projectId, onMessage) {
  const client = new Client({
    brokerURL: "ws://localhost:8080/ws/editor",
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
