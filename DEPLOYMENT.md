# PlotForge Deployment Guide 🚀

PlotForge is a modern full-stack web application comprising:
1. **React 18 + Vite SPA**: Client-side screenplay editor, community boards, and UI.
2. **Node.js Express Server**: REST APIs, access control, PDFKit export, and Gemini AI agent.
3. **STOMP WebSocket Server**: Real-time collaborative screenplay editing (`/ws/editor`).

---

## 🏗️ Architecture Options

### Option 1: Decoupled Deployment (Recommended for Vercel + Container Backend)

In this architecture, the static frontend is hosted on Vercel's Edge CDN, while the persistent Express API and WebSocket broker run in a long-lived container service (e.g., Google Cloud Run, Render, Railway, or Fly.io).

```text
[Browser User]
    │
    ├── (HTTPS Static Assets) ──> [Vercel CDN] (Vite React Client)
    │
    ├── (HTTPS REST API /api/*) ─> [Cloud Run / Render] (Express Backend)
    │
    └── (WSS WebSocket /ws/*) ───> [Cloud Run / Render] (STOMP Broker)
```

#### Step A: Deploying Backend (Cloud Run / Render / Railway)
1. Use the included multi-stage `Dockerfile`:
   ```bash
   docker build -t plotforge-backend .
   docker run -p 3000:3000 -e JWT_SECRET=your_jwt_secret plotforge-backend
   ```
2. Configure environment variables in your container host:
   - `PORT=3000`
   - `JWT_SECRET=strong_random_secret`
   - `ALLOWED_ORIGINS=https://your-frontend.vercel.app`
   - `OWNER_EMAIL=owner@example.com`
   - `OWNER_PASSWORD=strong_owner_password`
   - `GEMINI_API_KEY=your_gemini_key` (optional)

#### Step B: Deploying Frontend (Vercel)
1. In Vercel Project Settings:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build:client` (or configured via `vercel.json`)
   - **Output Directory**: `dist`
2. Configure Environment Variables in Vercel:
   - `VITE_API_BASE_URL`: `https://your-backend.run.app`
   - `VITE_WS_URL`: `wss://your-backend.run.app/ws/editor`
3. Deploy! The frontend will automatically make cross-origin authenticated requests with credentials and connect to the persistent STOMP WebSocket server.

---

### Option 2: Unified Container Deployment (Google Cloud Run / Single Container)

In this architecture, a single Node.js container hosts both the static frontend and the Express/WebSocket backend:

1. **Build & Start**:
   ```bash
   npm run build
   npm start
   ```
2. The Express server serves Vite static assets from `/dist` and serves `/api/*` and `/ws/editor` on port 3000.
3. Fully compatible with Google Cloud Run, Docker Compose, AWS App Runner, and DigitalOcean App Platform.

---

## ⚙️ Environment Variables Reference

| Variable | Required | Scope | Description |
| :--- | :--- | :--- | :--- |
| `JWT_SECRET` | Recommended | Backend | Secret used to cryptographically sign and verify auth tokens |
| `OWNER_EMAIL` | Optional | Backend | Bootstraps initial platform owner account |
| `OWNER_PASSWORD` | Optional | Backend | Password for bootstrapped platform owner |
| `OWNER_USERNAME` | Optional | Backend | Username for platform owner |
| `ALLOWED_ORIGINS` | Optional | Backend | Comma-separated CORS allowed origins (e.g. `https://plotforge.vercel.app`) |
| `GEMINI_API_KEY` | Optional | Backend | Google Gemini API key for narrative AI co-pilot |
| `VITE_API_BASE_URL` | Optional | Frontend | Target backend URL for decoupled frontend (e.g. `https://api.plotforge.com`) |
| `VITE_WS_URL` | Optional | Frontend | Target WebSocket URL for decoupled frontend (e.g. `wss://api.plotforge.com/ws/editor`) |

---

## 🚦 Continuous Integration (CI/CD)

The repository includes GitHub Actions CI (`.github/workflows/ci.yml`) configured to:
- Run on pushes and pull requests to `main` and `master`.
- Can be triggered manually via `workflow_dispatch`.
- Executes clean installation (`npm ci`), TypeScript typecheck (`npm run lint`), automated test suite (`npm test`), and production bundling (`npm run build`).
