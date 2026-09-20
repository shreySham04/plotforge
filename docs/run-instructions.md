# Run & Development Instructions

PlotForge is a unified TypeScript application combining an Express API server, native STOMP WebSocket broker, and React 18 client on port 3000.

---

## 1. Prerequisites

- **Node.js**: v18.0+ or v20.0+ LTS
- **npm**: v9.0+

---

## 2. Quickstart

1. Clone repository and navigate to root:
   ```bash
   git clone https://github.com/shreySham04/plotforge.git
   cd plotforge
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Environment Configuration:
   ```bash
   cp .env.example .env
   ```
   *Configure `JWT_SECRET`, `GEMINI_API_KEY` (optional for AI copilot), and `TMDB_API_KEY` (optional).*

4. Run local development server:
   ```bash
   npm run dev
   ```
   *The Express server boots with Vite middleware on `http://localhost:3000`.*

---

## 3. Verification & Testing

- **Run Automated Test Suite**:
  ```bash
  npm test
  ```
- **Typecheck & Linter**:
  ```bash
  npm run lint
  ```
- **Production Build**:
  ```bash
  npm run build
  ```

---

## 4. WebSocket & Real-Time Collaboration

- **WebSocket URL**: `ws://localhost:3000/ws/editor`
- **Protocol**: STOMP 1.2 over WebSockets
- **Topic Subscription**: `/topic/project/{projectId}`
- **Publish Destination**: `/app/project/{projectId}/edit`
- **Heartbeat**: 10000ms ping/pong intervals

