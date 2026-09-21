import { Server as HttpServer, IncomingMessage } from "http";
import { WebSocketServer, WebSocket } from "ws";
import jwt from "jsonwebtoken";
import { JWT_SECRET, OWNER_EMAIL } from "../config/auth.js";
import { projects, collaborators, shareTokens } from "../data/store.js";

interface StompSubscription {
  id: string;
  destination: string;
}

interface StompClient {
  ws: WebSocket;
  subscriptions: Map<string, StompSubscription>;
  user?: {
    id: number;
    username: string;
    email: string;
    role: string;
  } | null;
  shareTokens: Set<string>;
}

function verifyUserToken(rawToken: string | undefined | null) {
  if (!rawToken || typeof rawToken !== "string") return null;
  const token = rawToken.startsWith("Bearer ") ? rawToken.slice(7).trim() : rawToken.trim();
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (decoded && (decoded.id || decoded.userId)) {
      return {
        id: decoded.id || decoded.userId,
        username: decoded.username || "",
        email: (decoded.email || "").toLowerCase(),
        role: decoded.role || "WRITER"
      };
    }
  } catch {
    return null;
  }
  return null;
}

export function setupStompWebSocketServer(server: HttpServer): WebSocketServer {
  const wss = new WebSocketServer({ noServer: true });
  const clients = new Set<StompClient>();

  server.on("upgrade", (request: IncomingMessage, socket, head) => {
    const urlObj = request.url ? new URL(request.url, "http://localhost") : null;
    const pathname = urlObj?.pathname || "";

    if (pathname === "/ws/editor") {
      wss.handleUpgrade(request, socket, head, (ws) => {
        (ws as any).upgradeUrl = request.url;
        wss.emit("connection", ws, request);
      });
    }
  });

  wss.on("connection", (ws: WebSocket, request?: IncomingMessage) => {
    const client: StompClient = {
      ws,
      subscriptions: new Map(),
      user: null,
      shareTokens: new Set()
    };

    // Check upgrade URL query parameters for initial credentials
    const reqUrl = (ws as any).upgradeUrl || request?.url || "";
    if (reqUrl) {
      try {
        const parsedUrl = new URL(reqUrl, "http://localhost");
        const queryToken = parsedUrl.searchParams.get("token") || parsedUrl.searchParams.get("auth");
        const queryShareToken = parsedUrl.searchParams.get("shareToken") || parsedUrl.searchParams.get("share_token");

        if (queryToken) {
          client.user = verifyUserToken(queryToken);
        }
        if (queryShareToken) {
          client.shareTokens.add(queryShareToken.trim());
        }
      } catch (_) {}
    }

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

  function sendStompError(client: StompClient, message: string, detail?: string) {
    const detailText = detail || message;
    const frame = `ERROR\nmessage:${message}\ncontent-type:text/plain\n\n${detailText}\0`;
    try {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(frame);
      }
    } catch (_) {}
  }

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
        // Authenticate client via CONNECT headers if provided
        const authHeader = headers["authorization"] || headers["passcode"] || headers["token"];
        if (authHeader) {
          const verified = verifyUserToken(authHeader);
          if (verified) {
            client.user = verified;
          }
        }

        const shareTokenHeader = headers["x-share-token"] || headers["share-token"] || headers["sharetoken"];
        if (shareTokenHeader) {
          client.shareTokens.add(shareTokenHeader.trim());
        }

        // Reply with CONNECTED frame
        const connectedFrame = `CONNECTED\nversion:1.2\nheart-beat:10000,10000\n\n\0`;
        try {
          if (client.ws.readyState === WebSocket.OPEN) {
            client.ws.send(connectedFrame);
          }
        } catch (_) {}
        break;
      }

      case "SUBSCRIBE": {
        const id = headers["id"] || `sub-${Math.random().toString(36).substring(2, 8)}`;
        const destination = headers["destination"] || "";

        if (!destination) break;

        // Project Topic Authorization Check
        const projectMatch = destination.match(/\/project\/(\d+)/);
        if (projectMatch) {
          const projectId = parseInt(projectMatch[1], 10);
          const project = projects.find(p => p.id === projectId);

          if (!project) {
            sendStompError(client, "Project not found", `Project with ID ${projectId} does not exist.`);
            break;
          }

          // If project is private, enforce strict authorization
          if (project.isPublic === false) {
            let isAllowed = false;

            // 1. Valid share token check
            for (const sToken of client.shareTokens) {
              const tokenData = shareTokens.get(sToken);
              if (tokenData && tokenData.projectId === project.id) {
                isAllowed = true;
                break;
              }
            }

            // 2. Authenticated user authorization check
            if (!isAllowed && client.user) {
              const isAuthor =
                project.authorId === client.user.id ||
                project.authorUsername.toLowerCase() === client.user.username.toLowerCase();
              const isOwnerUser =
                client.user.role === "OWNER" ||
                client.user.role === "ADMIN" ||
                (OWNER_EMAIL && client.user.email === OWNER_EMAIL);
              const projectCollabs = collaborators[project.id] || [];
              const isCollaborator = projectCollabs.some(
                c =>
                  (c.userId && c.userId === client.user!.id) ||
                  (c.username && c.username.toLowerCase() === client.user!.username.toLowerCase())
              );

              if (isAuthor || isOwnerUser || isCollaborator) {
                isAllowed = true;
              }
            }

            if (!isAllowed) {
              sendStompError(
                client,
                "Forbidden",
                `Access denied: You do not have permission to subscribe to private project ${projectId}.`
              );
              break;
            }
          }
        }

        client.subscriptions.set(id, { id, destination });
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
        let broadcastTopic = destination;
        const appMatch = destination.match(/^\/app\/project\/([^/]+)\/edit/);
        if (appMatch) {
          broadcastTopic = `/topic/project/${appMatch[1]}`;
        }

        // Project Edit Mutation Authorization Check
        const projectMatch = destination.match(/\/project\/(\d+)/);
        if (projectMatch) {
          const projectId = parseInt(projectMatch[1], 10);
          const project = projects.find(p => p.id === projectId);

          if (!project) {
            sendStompError(client, "Project not found", `Cannot send edit: Project ${projectId} does not exist.`);
            break;
          }

          // Broadcasting project changes requires write/editor authorization
          if (!client.user) {
            sendStompError(client, "Unauthorized", "Authentication is required to broadcast project edits.");
            break;
          }

          const isAuthor =
            project.authorId === client.user.id ||
            project.authorUsername.toLowerCase() === client.user.username.toLowerCase();
          const isOwnerUser =
            client.user.role === "OWNER" ||
            client.user.role === "ADMIN" ||
            (OWNER_EMAIL && client.user.email === OWNER_EMAIL);
          const projectCollabs = collaborators[project.id] || [];
          const isEditorCollab = projectCollabs.some(
            c =>
              c.role === "EDITOR" &&
              ((c.userId && c.userId === client.user!.id) ||
                (c.username && c.username.toLowerCase() === client.user!.username.toLowerCase()))
          );

          if (!isAuthor && !isOwnerUser && !isEditorCollab) {
            sendStompError(
              client,
              "Forbidden",
              `Write permission denied: You do not have editor access to project ${projectId}.`
            );
            break;
          }
        }

        // Broadcast to all authorized clients subscribed to this topic
        for (const peer of clients) {
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

  console.log("PlotForge STOMP WebSocket server initialized on /ws/editor with role-based authorization");
  return wss;
}
