import express, { Request, Response } from "express";
import http from "http";
import path from "path";
import fs from "fs";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

// Config and Store
import { loadStoreFromDisk } from "./server/data/store.js";
import { setupStompWebSocketServer } from "./server/websocket/stompServer.js";

// Modular Routers
import { authRouter } from "./server/routes/auth.routes.js";
import { projectRouter } from "./server/routes/project.routes.js";
import { contentRouter } from "./server/routes/content.routes.js";
import { collaborationRouter } from "./server/routes/collaboration.routes.js";
import { socialRouter } from "./server/routes/social.routes.js";
import { aiRouter } from "./server/routes/ai.routes.js";
import { tmdbRouter } from "./server/routes/tmdb.routes.js";
import { adminRouter } from "./server/routes/admin.routes.js";
import { shareTokens, projects, contents, comments } from "./server/data/store.js";
import { requireOwner } from "./server/middleware/auth.js";
import { evaluateProjectAccess } from "./server/services/accessControl.js";

const app = express();
const server = http.createServer(app);
const PORT = 3000;

// Initialize STOMP WebSocket server
setupStompWebSocketServer(server);

// Middleware
app.use(cors());
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

// Load stored data from disk
loadStoreFromDisk();

// ==========================================
// 1. HEALTH & SYSTEM DIAGNOSTICS
// ==========================================
app.get("/api/health", (req: Request, res: Response) => {
  res.json({
    status: "UP",
    timestamp: new Date().toISOString(),
    service: "PlotForge API",
    version: "2.0.0"
  });
});

// ==========================================
// 2. LOGO CUSTOMIZATION API
// ==========================================
const DATA_DIR = path.join(process.cwd(), "data");
const CUSTOM_LOGO_FILE = path.join(DATA_DIR, "custom_logo_base64.txt");

app.get("/api/app-config/logo", (req: Request, res: Response) => {
  try {
    if (fs.existsSync(CUSTOM_LOGO_FILE)) {
      const customData = fs.readFileSync(CUSTOM_LOGO_FILE, "utf8");
      if (customData) {
        return res.json({ logoUrl: customData, isCustom: true });
      }
    }
    res.json({ logoUrl: "/logo.svg", isCustom: false });
  } catch {
    res.json({ logoUrl: "/logo.svg", isCustom: false });
  }
});

app.post("/api/app-config/logo", requireOwner, (req: Request, res: Response) => {
  try {
    const { dataUrl } = req.body;
    if (!dataUrl || typeof dataUrl !== "string") {
      return res.status(400).json({ message: "Invalid image data." });
    }

    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(CUSTOM_LOGO_FILE, dataUrl, "utf8");

    const match = dataUrl.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
    if (match) {
      const buffer = Buffer.from(match[2], "base64");
      const pubDir = path.join(process.cwd(), "public");
      if (!fs.existsSync(pubDir)) fs.mkdirSync(pubDir, { recursive: true });
      fs.writeFileSync(path.join(pubDir, "logo.png"), buffer);
      fs.writeFileSync(path.join(pubDir, "logo.jpeg"), buffer);
    }

    res.json({ message: "Logo updated successfully", logoUrl: dataUrl });
  } catch (err: any) {
    res.status(500).json({ message: "Failed to save logo", error: err?.message });
  }
});

// ==========================================
// 3. GOOGLE OAUTH POPUP CALLBACK
// ==========================================
app.get(["/auth/google/callback", "/auth/google/callback/"], (req: Request, res: Response) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head><title>Google Authentication</title></head>
      <body style="background: #111827; color: #fff; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
        <div style="text-align: center;">
          <h2 style="font-size: 1.25rem;">Completing Google Sign-In...</h2>
          <p style="color: #9ca3af; font-size: 0.875rem;">This window will close automatically.</p>
        </div>
        <script>
          try {
            const hash = window.location.hash.substring(1);
            const params = new URLSearchParams(hash);
            const accessToken = params.get("access_token") || params.get("id_token");
            if (window.opener) {
              window.opener.postMessage({ type: "GOOGLE_AUTH_SUCCESS", token: accessToken }, window.location.origin);
              window.close();
            }
          } catch(e) {
            console.error(e);
          }
        </script>
      </body>
    </html>
  `);
});

// ==========================================
// 4. SHARED PROJECT TOKEN ACCESS
// ==========================================
app.get(["/api/share/:token", "/api/projects/shared/:token"], (req: Request, res: Response) => {
  const { token } = req.params;
  const tokenData = shareTokens.get(token);

  if (!tokenData) {
    return res.status(404).json({ message: "Share link is invalid or expired." });
  }

  const project = projects.find(p => p.id === tokenData.projectId);
  if (!project) {
    return res.status(404).json({ message: "Shared project not found." });
  }

  const content = contents[project.id] || { projectId: project.id, storyContent: "", scriptContent: "" };

  res.json({
    project,
    content,
    permission: tokenData.permission
  });
});

// Legacy comment endpoint alias: /api/comments/:projectId
app.get("/api/comments/:projectId", (req: Request, res: Response) => {
  const projId = parseInt(req.params.projectId, 10);
  const project = projects.find(p => p.id === projId);

  if (!project) {
    return res.status(404).json({ message: "Project not found." });
  }

  const access = evaluateProjectAccess(project, req);
  if (!access.allowed) {
    return res.status(access.statusCode).json({ message: access.reason });
  }

  const projComments = comments.filter(c => c.projectId === projId);
  res.json(projComments);
});

// ==========================================
// 5. MOUNT ROUTE MODULES
// ==========================================
app.use("/api/auth", authRouter);
app.use("/api/projects", projectRouter);
app.use("/api/content", contentRouter);
app.use("/api", collaborationRouter);
app.use("/api", socialRouter);
app.use("/api/agent", aiRouter);
app.use("/api/tmdb", tmdbRouter);
app.use("/api/admin", adminRouter);

// ==========================================
// 6. VITE MIDDLEWARE & STATIC ASSETS
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`PlotForge server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
