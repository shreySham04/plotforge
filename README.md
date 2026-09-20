# PlotForge 🎬

> **Collaborative Screenplay & Story Creation Platform with Real-Time STOMP Collaboration, Authoritative Security, and AI Co-Pilot Assistance.**

---

## 🏛️ System Architecture

```text
                                 +---------------------------------------+
                                 |         React 18 + Vite Client        |
                                 |  (Tailwind CSS, STOMP.js, Lucide)     |
                                 +-------------------+-------------------+
                                                     |
                                    HTTP / REST      |  WebSocket (/ws/editor)
                                                     v
+----------------------------------------------------+---------------------------------------------------+
|                                        PlotForge Express Server                                        |
|                                                                                                        |
|  +---------------------+  +---------------------+  +---------------------+  +-----------------------+  |
|  |   Auth Middleware   |  |   Project Routes    |  |  Content & History  |  |  Real-time WebSockets |  |
|  | - JWT verification  |  | - CRUD operations   |  | - Story/Script sync |  | - Native STOMP broker |  |
|  | - Owner enforcement |  | - Access control    |  | - Snapshot restore  |  | - Heartbeats & pubsub |  |
|  | - bcrypt hashing    |  | - PDFKit generation |  | - Version tracking |  | - Room broadcasts     |  |
|  +---------------------+  +---------------------+  +---------------------+  +-----------------------+  |
|                                                                                                        |
|  +---------------------+  +---------------------+  +---------------------+  +-----------------------+  |
|  |  Social & Community |  |     TMDB Proxy      |  |  AI Studio Copilot  |  |    In-Memory Store    |  |
|  | - Reviews & ratings |  | - Multi-search API  |  | - Gemini 2.5 Flash  |  | - Debounced file sync |  |
|  | - Fan concepts/pitch|  | - In-memory cache   |  | - Persona doctoring |  | - Atomic I/O writes   |  |
|  | - Public showcase   |  | - Poster fallbacks  |  | - SSE text stream   |  | - Zero data loss      |  |
|  +---------------------+  +---------------------+  +---------------------+  +-----------------------+  |
+----------------------------------------------------+---------------------------------------------------+
                                                     |
                                                     v
                                 +---------------------------------------+
                                 |       Durable File-Backed Data        |
                                 |  (JSON collections in /data/*.json)   |
                                 +---------------------------------------+
```

---

## 🛡️ Security & Integrity Guarantees

PlotForge has undergone an end-to-end security hardening pass to eliminate prototype vulnerabilities:

1. **Strict Role Enforcement & Privilege Escalation Defense**:
   - The user registration flow server-authoritatively assigns the `WRITER` role.
   - Client requests attempting to inject `role: "OWNER"` or `role: "ADMIN"` are strictly disregarded.
   - Administrative and platform owner operations (`/api/admin/*`) require server-side token identity verification against the designated platform owner authority.

2. **Signature-Verified JWTs with Dynamic Entropy**:
   - Authentication relies on cryptographic HMAC-SHA256 tokens (`jsonwebtoken`).
   - All protected endpoints verify the token signature against `JWT_SECRET`.
   - Missing or forged secrets are rejected with `401 Unauthorized`.

3. **Secure Password Storage**:
   - All passwords are encrypted with `bcryptjs` using 10 salt rounds before persistence.
   - Plaintext passwords are never stored in disk files or returned in API responses.

4. **Cryptographic Share Tokens**:
   - Collaboration and public share links use high-entropy 256-bit cryptographically random tokens (`crypto.randomBytes(32)`).
   - Insecure sequential identifiers (such as `share-token-1`) have been eradicated.

5. **Authoritative Access Control**:
   - Destructive operations (`DELETE /api/projects/:id`) verify author ownership or platform administrator credentials.
   - Non-authors receive `403 Forbidden`.

---

## 🚀 Core Capabilities

### 1. Screenplay & Story Composition
- Integrated Dual-View editor supporting long-form prose and industry-standard screenplay formatting.
- Real-time screenplay slugline parsing (`INT.`, `EXT.`, `INT/EXT.`) with scene header index.
- Snapshot history engine with automated diff generation and one-click rollback.

### 2. High-Fidelity PDF Generation (PDFKit)
- Server-side PDF compilation using `pdfkit`.
- Formatted title pages with title, author attribution, logline, genre tags, and Hollywood standard 12pt Courier screenplay dialogue layouts.

### 3. Native STOMP WebSocket Engine
- Built-in lightweight STOMP 1.2 broker implemented on native Node.js WebSockets (`ws`).
- Full frame support: `CONNECT`, `CONNECTED`, `SUBSCRIBE`, `SEND`, `MESSAGE`, `UNSUBSCRIBE`, `DISCONNECT`.
- Per-project broadcast topics (`/topic/project/{id}`) with heartbeat ping/pong lifecycle management.

### 4. AI Script Doctor & Narrative Co-Pilot
- Powered by `@google/genai` running **Gemini 2.5 Flash** server-side.
- Real-time SSE streaming for instant Time-to-First-Token (`/api/agent/copilot/stream`).
- Iconic character personas (Hollywood Script Doctor, Tony Stark, Captain Jack Sparrow, Master Yoda, Wednesday Addams, and more).
- Automated prose-to-screenplay scene converter with diff highlighting (`/api/agent/copilot/sync-script`).

### 5. Entertainment Discovery (TMDB Proxy)
- Cached search proxy for movies, television series, posters, and production backdrops.
- Built-in curated catalog fallback ensuring seamless offline functionality when external API keys are not supplied.

---

## 📡 REST API Reference

| Method | Endpoint | Protection | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register writer account (safe role default) |
| `POST` | `/api/auth/login` | Public | Authenticate with email/password |
| `POST` | `/api/auth/google` | Public | Google Identity OAuth token sign-in |
| `GET` | `/api/auth/me` | JWT | Retrieve current authenticated user profile |
| `POST` | `/api/auth/forgot-password` | Public | Request password reset token |
| `POST` | `/api/auth/reset-password` | Public | Reset password using valid cryptographic token |
| `GET` | `/api/projects` | Optional JWT | List public projects or user's projects |
| `POST` | `/api/projects` | JWT | Create new story or screenplay |
| `GET` | `/api/projects/:id` | Public / JWT | Retrieve project metadata and check permissions |
| `PUT` | `/api/projects/:id` | Author / Admin | Update title, logline, genre, cover image |
| `DELETE` | `/api/projects/:id` | Author / Admin | Permanently delete project and assets |
| `GET` | `/api/projects/:id/export/pdf`| Public | Stream binary PDF screenplay |
| `GET` | `/api/projects/:id/export/txt`| Public | Download plain text screenplay export |
| `GET` | `/api/projects/:id/share-link`| Author / Admin | Generate cryptographically secure share link |
| `GET` | `/api/content/:projectId` | Public / JWT | Fetch project story prose and screenplay script |
| `PUT` | `/api/content/:projectId` | Collaborator | Update content, increment version, record diff |
| `GET` | `/api/content/:projectId/history` | Collaborator | Retrieve version snapshots |
| `POST`| `/api/content/:projectId/history/:versionId/restore` | Author | Rollback content to historical snapshot |
| `POST`| `/api/agent/copilot/stream`| Public / JWT | Server-Sent Events AI screenplay feedback |
| `POST`| `/api/agent/copilot/sync-script` | Public / JWT | Transform prose story to formatted screenplay |
| `GET` | `/api/admin/users` | Owner Only | Platform user administration |
| `DELETE`| `/api/admin/users/:id` | Owner Only | Remove user account (protected root owner) |

---

## 🛠️ Local Development & Testing

### Prerequisites
- Node.js 18+ (tested on Node.js 20 & 22)
- npm 9+

### Environment Setup
Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

Key environment variables:
```env
PORT=3000
JWT_SECRET=your_long_cryptographic_jwt_secret
GEMINI_API_KEY=your_gemini_api_key_here
TMDB_API_KEY=your_tmdb_api_key_here
```

### Running the Application
```bash
# Start development server with live Vite HMR and TypeScript backend
npm run dev

# Run TypeScript typechecks
npm run lint

# Run automated test suite
npm test

# Build production bundle
npm run build

# Start production server
npm start
```

---

## 🧪 Automated Testing

PlotForge includes an automated unit and integration test suite using Node's native test runner (`node:test` + `node:assert` via `tsx`):

```bash
npm test
```

Test coverage includes:
- Role privilege escalation prevention during registration.
- Cryptographic entropy validation for share tokens.
- Salted bcrypt password hashing & verification.
- HMAC-SHA256 JWT signature verification.
- Ownership matrix evaluation for project mutations.
- Screenplay slugline regex parsing.

---

## 📄 License
MIT License. Built for screenwriters, storytellers, and cinema enthusiasts.
