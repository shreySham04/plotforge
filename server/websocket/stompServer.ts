import { Server as HttpServer } from "http";
import { WebSocketServer, WebSocket } from "ws";

interface StompSubscription {
  id: string;
  destination: string;
}

interface StompClient {
  ws: WebSocket;
  subscriptions: Map<string, StompSubscription>;
}

export function setupStompWebSocketServer(server: HttpServer): WebSocketServer {
  const wss = new WebSocketServer({ noServer: true });
  const clients = new Set<StompClient>();

  server.on("upgrade", (request, socket, head) => {
    const pathname = request.url ? new URL(request.url, "http://localhost").pathname : "";

    if (pathname === "/ws/editor") {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    }
  });

  wss.on("connection", (ws: WebSocket) => {
    const client: StompClient = {
      ws,
      subscriptions: new Map()
    };
    clients.add(client);

    ws.on("message", (rawMessage: Buffer | string) => {
      const text = rawMessage.toString();
      handleStompFrame(client, text);
    });

    ws.on("close", () => {
      clients.delete(client);
    });

    ws.on("error", () => {
      clients.delete(client);
    });
  });

  function handleStompFrame(client: StompClient, frameText: string) {
    // Heartbeat ping (newlines only)
    if (frameText === "\n" || frameText === "\r\n") {
      try {
        client.ws.send("\n");
      } catch (_) {}
      return;
    }

    // Parse STOMP Command, Headers, and Body
    const nullIdx = frameText.indexOf("\0");
    const content = nullIdx !== -1 ? frameText.substring(0, nullIdx) : frameText;
    const parts = content.split(/\r?\n\r?\n/);
    const headerLines = parts[0].split(/\r?\n/);
    const command = headerLines[0].trim();
    const body = parts.slice(1).join("\n\n");

    const headers: Record<string, string> = {};
    for (let i = 1; i < headerLines.length; i++) {
      const line = headerLines[i];
      const sep = line.indexOf(":");
      if (sep !== -1) {
        const key = line.substring(0, sep).trim().toLowerCase();
        const value = line.substring(sep + 1).trim();
        headers[key] = value;
      }
    }

    switch (command) {
      case "CONNECT":
      case "STOMP": {
        // Reply with CONNECTED frame
        const connectedFrame = `CONNECTED\nversion:1.2\nheart-beat:10000,10000\n\n\0`;
        client.ws.send(connectedFrame);
        break;
      }

      case "SUBSCRIBE": {
        const id = headers["id"] || `sub-${Math.random().toString(36).substring(2, 8)}`;
        const destination = headers["destination"] || "";
        if (destination) {
          client.subscriptions.set(id, { id, destination });
        }
        break;
      }

      case "UNSUBSCRIBE": {
        const id = headers["id"];
        if (id) {
          client.subscriptions.delete(id);
        }
        break;
      }

      case "SEND": {
        const destination = headers["destination"] || "";
        // Map /app/project/{id}/edit destination to /topic/project/{id}
        let broadcastTopic = destination;
        const appMatch = destination.match(/^\/app\/project\/([^/]+)\/edit/);
        if (appMatch) {
          broadcastTopic = `/topic/project/${appMatch[1]}`;
        }

        // Broadcast to all clients subscribed to this topic
        for (const peer of clients) {
          // Send to all other clients subscribed to the topic
          for (const [subId, sub] of peer.subscriptions) {
            if (sub.destination === broadcastTopic) {
              const msgId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
              const messageFrame = `MESSAGE\nsubscription:${subId}\nmessage-id:${msgId}\ndestination:${broadcastTopic}\ncontent-type:application/json\n\n${body}\0`;
              try {
                if (peer.ws.readyState === WebSocket.OPEN) {
                  peer.ws.send(messageFrame);
                }
              } catch (_) {}
            }
          }
        }
        break;
      }

      case "DISCONNECT": {
        try {
          client.ws.close();
        } catch (_) {}
        clients.delete(client);
        break;
      }

      default:
        break;
    }
  }

  console.log("PlotForge STOMP WebSocket server initialized on /ws/editor");
  return wss;
}
