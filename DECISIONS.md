# DECISIONS.md

## Technical Rationale & Architectural Decisions

This document logs every meaningful architectural and technical decision made for **PlotForge**, explaining the considerations, chosen approaches, libraries, and trade-offs.

---

### 1. Hybrid Full-Stack Runtime Architecture (Express + Vite)

* **Decision**: Implement a custom Node.js Express server (`server.ts`) combined with Vite (`vite.config.js`) operating on port 3000.
* **Rationale & Consideration**:
  * **Security**: Keeps API keys (such as `GEMINI_API_KEY` and TMDB tokens) strictly server-side. The client browser never receives or exposes sensitive keys.
  * **Unified Server**: Vite runs as Express middleware in development, allowing unified execution on port `3000` (required by Cloud Run/container ingress restrictions).
  * **Build Process**: Bundling via `esbuild` to CommonJS (`dist/server.cjs`) resolves TypeScript ES module imports natively without complex runtime loader overhead.

---

### 2. State & Database Persistence Strategy (Firebase Firestore + In-Memory Caching)

* **Decision**: Hybrid database architecture utilizing Firebase Firestore as the persistent cloud store with server-side in-memory arrays as a high-speed read cache.
* **Rationale & Consideration**:
  * **Firebase Firestore (`getFirestore`)**: Provides real-time document storage for user profiles, story/script projects, fan theories, fan concepts, and reviews.
  * **In-Memory Sync**: Initial server boot fetches state from Firestore into global array references. Any mutation (e.g., creating a project, posting a theory, registering a user) updates the in-memory state instantly for zero-latency UI responses and persists asynchronously to Firestore via `setDoc` and `getDocs`.
  * **Offline/Dev Resilience**: If Firestore credentials or connections are unavailable in specific test environments, the system safely degrades to memory persistence without crashing the Node process.

---

### 3. Authentication Engine (JWT + HTTP Header Bearer)

* **Decision**: JSON Web Tokens (`jsonwebtoken`) signed with a server secret combined with client-side localStorage token management.
* **Rationale & Consideration**:
  * **Stateless Validation**: Client sends `Authorization: Bearer <token>` with requests. Server decodes user credentials without database read bottlenecks per API call.
  * **Guest Accessibility**: Public routes (`/stories`, `/scripts`, `/fanfuture`, `/reviews`) render community content for unauthenticated guests, while write endpoints (`POST /api/projects`, `POST /api/reviews`) are guarded by `authenticateToken` middleware.

---

### 4. AI Copilot & Generative Slide Integration (Google GenAI SDK)

* **Decision**: Use `@google/genai` on the server-side with `gemini-2.5-flash` model, structured JSON schema response parameters, and an in-memory quota cooldown manager (`geminiQuotaCooldownUntil`).
* **Rationale & Consideration**:
  * **Server-Only Execution**: Prevents browser API key leakage.
  * **Rate Limit Cooldown Guard (429 Handling)**: When Gemini API returns a rate-limit error (`429 RESOURCE_EXHAUSTED`), the server sets a 60-second cooldown timer (`geminiQuotaCooldownUntil = Date.now() + 60000`). While active, subsequent background requests return instant cinematic fallbacks directly without hitting the Google GenAI endpoint. This completely prevents rate-limit error logs and ensures zero latency for end users.
  * **Resilient Fallback Handling**: On any exception, the endpoint gracefully catches the error and returns rich pre-crafted cinematic quotes and TMDB backdrop assets instead of failing.

---

### 5. Firebase Firestore Logging & Connection Management

* **Decision**: Call `setLogLevel("error")` from `firebase/firestore` during server startup.
* **Rationale & Consideration**:
  * **Log Noise Reduction**: The standard Firebase JS SDK emits periodic diagnostic messages (`GrpcConnection RPC 'Listen' stream CANCELLED: Disconnecting idle stream`) when long-polling streams time out on idle connections. Setting log level to `"error"` suppresses these expected, benign connection cycle logs while maintaining full persistent database functionality.

---

### 6. Third-Party Movie Metadata Integration (TMDB API Proxy)

* **Decision**: Build `/api/tmdb/search` and `/api/tmdb/details` endpoints in Express.
* **Rationale & Consideration**:
  * **Rate Limiting & CORS**: Direct browser calls to TMDB risk CORS issues and expose secrets. Server-side proxying enables clean query sanitization and fallback posters when images are missing.

---

### 6. Styling & Theme Engine (Tailwind CSS + React ThemeContext)

* **Decision**: Tailwind CSS with custom global utility classes (`.card`, `.btn`, `.input`) paired with a React `ThemeContext` toggling `.dark` / `.light` root classes.
* **Rationale & Consideration**:
  * **Seamless Theme Switching**: Updates both standard Tailwind dark classes (`dark:bg-[#070b12]`) and CSS variable layers across the entire component tree without full page reloads.
  * **Color Palette**: Neutral dark tones (`#070b12`, `slate-900`) and soft light tones (`slate-50`, `white`) ensure high WCAG contrast and low visual fatigue for long writing sessions.

---

### 8. Dual-Layer Local Disk & Firestore Persistence for Projects and User Data

* **Decision**: Implement dual-layer persistence utilizing local JSON files inside `data/` (`users_db.json`, `projects_db.json`, `contents_db.json`, `collaborators_db.json`, `invitations_db.json`, `comments_db.json`) combined with non-blocking Firestore document syncing.
* **Rationale & Consideration**:
  * **Server Restart & Update Resilience**: Storing projects, screenplays, and user profiles only in server memory resulted in lost project state during code edits or server restarts. Local JSON file persistence ensures 100% data durability across restarts.
  * **Non-Blocking Execution**: Firestore write operations execute non-blockingly with a 1.5s timeout race. This guarantees zero latency for Express endpoint responses while backing up all data to cloud storage.
  * **Startup Auto-Restoration**: On server startup, the system automatically loads persisted state from local JSON files and Firestore collections simultaneously.

---

### 9. Server-Side AI API Proxying & Zero Client-Side Secret Exposure

* **Decision**: Perform all Gemini AI queries server-side in `/api/agent/copilot/suggest` and `/api/agent/copilot/sync-script` using `process.env.GEMINI_API_KEY`.
* **Rationale & Consideration**:
  * **Security & Clean UX**: Removed client-side API key input drawers, modals, and local storage key persistence. Users do not need to provide their own keys; the backend handles model initialization cleanly.

---

### 10. Multi-User Collaboration & In-App Invitation Pipeline

* **Decision**: Dedicated collaboration invitation flow (`/api/projects/:projectId/invite`, `/api/invitations/my`, `/api/invitations/:id/respond`) integrated into user navigation (`CollaborationInvitationsCard`).
* **Rationale & Consideration**:
  * **In-App Notifications**: Users receive pending collaboration requests directly on their Profile/Preferences dashboard and top Navbar.
  * **Access Control**: Accepting an invitation adds the user to the project's collaborator list with designated roles (e.g. `EDITOR`, `VIEWER`), enabling shared script and story editing without affecting author ownership.

---

### 11. Customizable Famous Movie Character AI Co-pilot Persona
* **Decision**: Implemented user-configurable AI Co-pilot personas in Profile Preferences (`aiPersona`) supporting famous movie characters (Captain Jack Sparrow, Master Yoda, Tony Stark, Sherlock Holmes, Morpheus, Don Vito Corleone, Wednesday Addams).
* **Rationale & Consideration**:
  * **User Personalization**: Replaced generic AI Co-pilot labeling with iconic movie character personas that adapt tone, catchphrases, greeting, thinking animations, and system prompts.
  * **Full-Stack Sync**: Selected persona is saved in user profile preferences (`PUT /api/auth/me`), persisted to disk/Firestore, and dynamically sent with `/api/agent/copilot/suggest` requests so the Gemini model adopts the exact character tone chosen by the user.


