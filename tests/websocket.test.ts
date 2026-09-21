import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import http from "http";
import WebSocket from "ws";
import jwt from "jsonwebtoken";
import { setupStompWebSocketServer } from "../server/websocket/stompServer.js";
import { projects, shareTokens } from "../server/data/store.js";
import { JWT_SECRET } from "../server/config/auth.js";
import { Project } from "../server/types/index.js";

describe("PlotForge v2: WebSocket STOMP Authorization Engine", () => {
  let server: http.Server;
  let port: number;

  const testProject: Project = {
    id: 888,
    title: "Top Secret WebSocket Project",
    description: "Private screenplay",
    genre: "Thriller",
    type: "SCRIPT",
    status: "DRAFT",
    authorId: 42,
    authorUsername: "ws_author",
    isPublic: false,
    collaboratorCount: 0,
    reviewCount: 0,
    views: 0,
    likes: 0,
    createdAt: new Date().toISOString()
  };

  const authorToken = jwt.sign(
    { id: 42, username: "ws_author", email: "ws_author@plotforge.internal", role: "WRITER" },
    JWT_SECRET
  );

  const adversaryToken = jwt.sign(
    { id: 999, username: "ws_intruder", email: "intruder@evil.com", role: "WRITER" },
    JWT_SECRET
  );

  before(async () => {
    projects.push(testProject);
    server = http.createServer();
    setupStompWebSocketServer(server);
    await new Promise<void>((resolve) => {
      server.listen(0, () => {
        const addr = server.address() as any;
        port = addr.port;
        resolve();
      });
    });
  });

  after(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  test("Unauthorized WebSocket subscriber to private project receives STOMP ERROR", (t, done) => {
    const ws = new WebSocket(`ws://localhost:${port}/ws/editor`);

    ws.on("open", () => {
      // Connect without credentials
      ws.send("CONNECT\naccept-version:1.2\n\n\0");
    });

    ws.on("message", (data) => {
      const msg = data.toString();
      if (msg.startsWith("CONNECTED")) {
        // Attempt to subscribe to private project 888 without author credentials or share token
        ws.send("SUBSCRIBE\nid:sub-1\ndestination:/topic/project/888\n\n\0");
      } else if (msg.startsWith("ERROR")) {
        assert.ok(msg.includes("Forbidden") || msg.includes("Access denied"));
        ws.close();
        done();
      }
    });
  });

  test("Authorized WebSocket subscriber with JWT can subscribe to private project", (t, done) => {
    const ws = new WebSocket(`ws://localhost:${port}/ws/editor?token=${encodeURIComponent(authorToken)}`);

    ws.on("open", () => {
      ws.send(`CONNECT\naccept-version:1.2\nauthorization:Bearer ${authorToken}\n\n\0`);
    });

    let connected = false;
    ws.on("message", (data) => {
      const msg = data.toString();
      if (msg.startsWith("CONNECTED")) {
        connected = true;
        // Subscribe to private project as author
        ws.send("SUBSCRIBE\nid:sub-2\ndestination:/topic/project/888\n\n\0");

        // Send a test edit as author
        setTimeout(() => {
          ws.send(
            JSON.stringify({
              command: "SEND",
              destination: "/app/project/888/edit",
              body: JSON.stringify({ messageType: "TYPING", user: "ws_author" })
            })
          );
          // If no ERROR frame received, subscription and access are authorized
          assert.equal(connected, true);
          ws.close();
          done();
        }, 100);
      } else if (msg.startsWith("ERROR")) {
        done(new Error(`Unexpected STOMP ERROR: ${msg}`));
      }
    });
  });

  test("Unauthorized client attempting to broadcast edit to private project receives STOMP ERROR", (t, done) => {
    const ws = new WebSocket(`ws://localhost:${port}/ws/editor?token=${encodeURIComponent(adversaryToken)}`);

    ws.on("open", () => {
      ws.send(`CONNECT\naccept-version:1.2\nauthorization:Bearer ${adversaryToken}\n\n\0`);
    });

    ws.on("message", (data) => {
      const msg = data.toString();
      if (msg.startsWith("CONNECTED")) {
        // Attempt to broadcast an unauthorized edit
        ws.send("SEND\ndestination:/app/project/888/edit\n\n{\"text\":\"hacked content\"}\0");
      } else if (msg.startsWith("ERROR")) {
        assert.ok(msg.includes("Forbidden") || msg.includes("Write permission denied"));
        ws.close();
        done();
      }
    });
  });
});
