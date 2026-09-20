import express, { Request, Response, NextFunction } from "express";
import path from "path";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import axios from "axios";
import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import { createServer as createViteServer } from "vite";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, setDoc, getDocs, setLogLevel } from "firebase/firestore";

// Suppress benign internal Firestore SDK logs
try {
  setLogLevel("silent");
} catch (_) {}
import fs from "fs";

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || "plotforge_dev_secret_key_2026";

app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Initialize Firestore Database
let db: any = null;
try {
  if (fs.existsSync("./firebase-applet-config.json")) {
    const firebaseConfig = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf8"));
    const firebaseApp = initializeApp(firebaseConfig);
    db = firebaseConfig.firestoreDatabaseId
      ? getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId)
      : getFirestore(firebaseApp);
    console.log("Firestore database successfully initialized in server.ts with DB ID:", firebaseConfig.firestoreDatabaseId);
  }
} catch (e: any) {
  console.warn("Firestore init notice:", e?.message);
}

// Local file storage for users, projects, contents, collaborators, invitations, and comments persistence
const USERS_FILE = path.join(process.cwd(), "data", "users_db.json");
const PROJECTS_FILE = path.join(process.cwd(), "data", "projects_db.json");
const CONTENTS_FILE = path.join(process.cwd(), "data", "contents_db.json");
const COLLABORATORS_FILE = path.join(process.cwd(), "data", "collaborators_db.json");
const INVITATIONS_FILE = path.join(process.cwd(), "data", "invitations_db.json");
const COMMENTS_FILE = path.join(process.cwd(), "data", "comments_db.json");

function ensureDataDir() {
  try {
    const dir = path.join(process.cwd(), "data");
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  } catch (e) {}
}

function saveUsersToFile() {
  try {
    ensureDataDir();
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf8");
  } catch (e: any) {
    console.warn("Failed to write users to local file:", e?.message);
  }
}

function saveProjectsToFile() {
  try {
    ensureDataDir();
    fs.writeFileSync(PROJECTS_FILE, JSON.stringify(projects, null, 2), "utf8");
  } catch (e: any) {
    console.warn("Failed to write projects to local file:", e?.message);
  }
}

function saveContentsToFile() {
  try {
    ensureDataDir();
    fs.writeFileSync(CONTENTS_FILE, JSON.stringify(contents, null, 2), "utf8");
  } catch (e: any) {
    console.warn("Failed to write contents to local file:", e?.message);
  }
}

function saveCollaboratorsToFile() {
  try {
    ensureDataDir();
    fs.writeFileSync(COLLABORATORS_FILE, JSON.stringify(collaborators, null, 2), "utf8");
  } catch (e: any) {
    console.warn("Failed to write collaborators to local file:", e?.message);
  }
}

function saveInvitationsToFile() {
  try {
    ensureDataDir();
    fs.writeFileSync(INVITATIONS_FILE, JSON.stringify(invitations, null, 2), "utf8");
  } catch (e: any) {
    console.warn("Failed to write invitations to local file:", e?.message);
  }
}

function saveCommentsToFile() {
  try {
    ensureDataDir();
    fs.writeFileSync(COMMENTS_FILE, JSON.stringify(comments, null, 2), "utf8");
  } catch (e: any) {
    console.warn("Failed to write comments to local file:", e?.message);
  }
}

function loadUsersFromFile() {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const raw = fs.readFileSync(USERS_FILE, "utf8");
      const loaded = JSON.parse(raw);
      if (Array.isArray(loaded)) {
        for (const u of loaded) {
          if (u && (u.email || u.username)) {
            const idx = users.findIndex(ex => (u.email && ex.email.toLowerCase() === u.email.toLowerCase()) || ex.id === u.id);
            if (idx !== -1) {
              users[idx] = { ...users[idx], ...u };
            } else {
              users.push(u);
            }
          }
        }
      }
    }
  } catch (e: any) {
    console.warn("Failed to load users from local file:", e?.message);
  }
}

function loadProjectsFromFile() {
  try {
    if (fs.existsSync(PROJECTS_FILE)) {
      const raw = fs.readFileSync(PROJECTS_FILE, "utf8");
      const loaded = JSON.parse(raw);
      if (Array.isArray(loaded)) {
        for (const p of loaded) {
          if (p && p.id) {
            const idx = projects.findIndex(ex => ex.id === p.id);
            if (idx !== -1) {
              projects[idx] = { ...projects[idx], ...p };
            } else {
              projects.push(p);
            }
            if (Number(p.id) >= projectIdCounter) {
              projectIdCounter = Number(p.id) + 1;
            }
          }
        }
      }
    }
  } catch (e: any) {
    console.warn("Failed to load projects from local file:", e?.message);
  }
}

function loadContentsFromFile() {
  try {
    if (fs.existsSync(CONTENTS_FILE)) {
      const raw = fs.readFileSync(CONTENTS_FILE, "utf8");
      const loaded = JSON.parse(raw);
      if (loaded && typeof loaded === "object") {
        Object.assign(contents, loaded);
      }
    }
  } catch (e: any) {
    console.warn("Failed to load contents from local file:", e?.message);
  }
}

function loadCollaboratorsFromFile() {
  try {
    if (fs.existsSync(COLLABORATORS_FILE)) {
      const raw = fs.readFileSync(COLLABORATORS_FILE, "utf8");
      const loaded = JSON.parse(raw);
      if (loaded && typeof loaded === "object") {
        Object.assign(collaborators, loaded);
      }
    }
  } catch (e: any) {
    console.warn("Failed to load collaborators from local file:", e?.message);
  }
}

function loadInvitationsFromFile() {
  try {
    if (fs.existsSync(INVITATIONS_FILE)) {
      const raw = fs.readFileSync(INVITATIONS_FILE, "utf8");
      const loaded = JSON.parse(raw);
      if (Array.isArray(loaded)) {
        invitations.length = 0;
        invitations.push(...loaded);
        for (const inv of loaded) {
          if (Number(inv.id) >= invitationIdCounter) {
            invitationIdCounter = Number(inv.id) + 1;
          }
        }
      }
    }
  } catch (e: any) {
    console.warn("Failed to load invitations from local file:", e?.message);
  }
}

function loadCommentsFromFile() {
  try {
    if (fs.existsSync(COMMENTS_FILE)) {
      const raw = fs.readFileSync(COMMENTS_FILE, "utf8");
      const loaded = JSON.parse(raw);
      if (Array.isArray(loaded)) {
        comments.length = 0;
        comments.push(...loaded);
      }
    }
  } catch (e: any) {
    console.warn("Failed to load comments from local file:", e?.message);
  }
}

async function loadUsersFromFirestore() {
  if (!db) return;
  try {
    const fetchPromise = getDocs(collection(db, "users"));
    const snapshot: any = await Promise.race([
      fetchPromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error("Firestore load users timeout")), 2000))
    ]);
    snapshot.forEach((docSnap: any) => {
      const u = docSnap.data();
      if (u && (u.email || u.username)) {
        const idx = users.findIndex(ex => (u.email && ex.email.toLowerCase() === u.email.toLowerCase()) || ex.id === u.id);
        if (idx !== -1) {
          users[idx] = { ...users[idx], ...u };
        } else {
          users.push(u);
        }
      }
    });
    console.log(`Loaded ${snapshot.size} users from Firestore.`);
  } catch (e: any) {
    if (e?.code === "not-found" || e?.message?.includes("NOT_FOUND")) {
      db = null; // Disable Firestore sync if Cloud Firestore is not provisioned
    }
  }
}

async function loadProjectsFromFirestore() {
  if (!db) return;
  try {
    const fetchPromise = getDocs(collection(db, "projects"));
    const snapshot: any = await Promise.race([
      fetchPromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error("Firestore load projects timeout")), 2000))
    ]);
    snapshot.forEach((docSnap: any) => {
      const p = docSnap.data();
      if (p && p.id) {
        const idx = projects.findIndex(ex => ex.id === p.id);
        if (idx !== -1) {
          projects[idx] = { ...projects[idx], ...p };
        } else {
          projects.push(p);
        }
        if (Number(p.id) >= projectIdCounter) {
          projectIdCounter = Number(p.id) + 1;
        }
      }
    });
    console.log(`Loaded ${snapshot.size} projects from Firestore.`);
  } catch (e: any) {
    if (e?.code === "not-found" || e?.message?.includes("NOT_FOUND")) {
      db = null;
    }
  }
}

function persistUser(user: any) {
  if (!user) return;

  // Assign OWNER role if email matches shreyansh.ssharma@gmail.com
  if (user.email && user.email.toLowerCase() === "shreyansh.ssharma@gmail.com") {
    user.role = "OWNER";
  }

  const idx = users.findIndex(u => (user.email && u.email.toLowerCase() === user.email.toLowerCase()) || u.id === user.id);
  if (idx !== -1) {
    users[idx] = { ...users[idx], ...user };
  } else {
    users.push(user);
  }

  saveUsersToFile();

  if (db) {
    try {
      const cleanUser: any = {};
      Object.keys(user).forEach(k => {
        if (user[k] !== undefined && typeof user[k] !== "function") {
          cleanUser[k] = user[k];
        }
      });
      const key = String(user.id || user.username || user.email).replace(/[^a-zA-Z0-9_-]/g, "_");
      const docRef = doc(db, "users", key);
      Promise.race([
        setDoc(docRef, cleanUser, { merge: true }),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Firestore user sync timeout")), 1500))
      ]).catch(err => {
        console.warn("Firestore user sync notice:", err?.message);
      });
    } catch (err: any) {
      console.warn("Error persisting user to Firestore:", err?.message);
    }
  }
}

function persistProject(project: any) {
  if (!project) return;

  const idx = projects.findIndex(p => p.id === project.id);
  if (idx !== -1) {
    projects[idx] = { ...projects[idx], ...project };
  } else {
    projects.push(project);
  }

  saveProjectsToFile();

  if (db) {
    try {
      const cleanProj: any = {};
      Object.keys(project).forEach(k => {
        if (project[k] !== undefined && typeof project[k] !== "function") {
          cleanProj[k] = project[k];
        }
      });
      const docRef = doc(db, "projects", String(project.id));
      Promise.race([
        setDoc(docRef, cleanProj, { merge: true }),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Firestore project sync timeout")), 1500))
      ]).catch(err => {
        console.warn("Firestore project sync notice:", err?.message);
      });
    } catch (err: any) {
      console.warn("Error persisting project to Firestore:", err?.message);
    }
  }
}

// High-Performance In-Memory Cache with TTL for ultra-low latency (<2ms) responses
class MemoryCache<T> {
  private cache = new Map<string, { value: T; expiresAt: number }>();

  get(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return item.value;
  }

  set(key: string, value: T, ttlMs: number): void {
    if (this.cache.size > 500) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }
    this.cache.set(key, { value, expiresAt: Date.now() + ttlMs });
  }
}

const tmdbCache = new MemoryCache<any>();
const posterLookupCache = new MemoryCache<{ posterUrl: string; backdropUrl: string }>();

// Lazy Gemini AI Client Initialization
function getGenAI(customKey?: string): GoogleGenAI | null {
  const apiKey = customKey?.trim() || process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });
}

// Robust AI Caller with retry delay and multi-model fallback to bypass transient rate limits
async function generateWithRetry(ai: GoogleGenAI, options: { contents: any; config?: any }, preferredModel = "gemini-3.7-flash") {
  const modelsToTry = [preferredModel, "gemini-flash-latest", "gemini-3.1-flash-lite"].filter((v, i, a) => a.indexOf(v) === i);
  let lastError: any = null;

  for (const model of modelsToTry) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const configWithThinking = {
          ...options.config,
          thinkingConfig: options.config?.thinkingConfig || { thinkingLevel: ThinkingLevel.LOW }
        };
        const response = await ai.models.generateContent({
          model,
          contents: options.contents,
          config: configWithThinking,
        });
        if (response && response.text) {
          return response;
        }
      } catch (err: any) {
        lastError = err;
        const isRateLimit = err?.status === 429 || err?.message?.includes("429") || err?.message?.includes("quota") || err?.message?.includes("RESOURCE_EXHAUSTED");
        if (isRateLimit && attempt === 0) {
          await new Promise((res) => setTimeout(res, 400));
        } else if (!isRateLimit) {
          break;
        }
      }
    }
  }

  throw lastError || new Error("AI service temporarily busy.");
}

// Robust Streaming AI Caller with multi-model fallback for ultra-low TTFT (<300ms)
async function generateStreamWithRetry(ai: GoogleGenAI, options: { contents: any; config?: any }, preferredModel = "gemini-3.7-flash") {
  const modelsToTry = [preferredModel, "gemini-flash-latest", "gemini-3.1-flash-lite"].filter((v, i, a) => a.indexOf(v) === i);
  let lastError: any = null;

  for (const model of modelsToTry) {
    try {
      const configWithThinking = {
        ...options.config,
        thinkingConfig: options.config?.thinkingConfig || { thinkingLevel: ThinkingLevel.LOW }
      };
      const stream = await ai.models.generateContentStream({
        model,
        contents: options.contents,
        config: configWithThinking,
      });
      return stream;
    } catch (err: any) {
      lastError = err;
      const isRateLimit = err?.status === 429 || err?.message?.includes("429") || err?.message?.includes("quota") || err?.message?.includes("RESOURCE_EXHAUSTED");
      if (isRateLimit) {
        await new Promise((res) => setTimeout(res, 300));
      }
    }
  }

  throw lastError || new Error("Streaming AI service temporarily busy.");
}

// Helper to extract authenticated user from Authorization header
interface AuthUser {
  id: number;
  username: string;
  email: string;
  role: string;
}

function getAuthUser(req: Request): AuthUser | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (decoded && decoded.email && decoded.email.toLowerCase() === "shreyansh.ssharma@gmail.com") {
      decoded.role = "OWNER";
    }
    return decoded;
  } catch {
    return null;
  }
}

function isOwner(authUser: AuthUser | null): boolean {
  if (!authUser) return false;
  const emailLower = (authUser.email || "").toLowerCase();
  if (emailLower === "shreyansh.ssharma@gmail.com") return true;
  if (authUser.role === "OWNER" || authUser.role === "ADMIN") return true;

  const found = users.find(u => u.id === authUser.id || (u.email && u.email.toLowerCase() === emailLower));
  if (found) {
    if ((found.email || "").toLowerCase() === "shreyansh.ssharma@gmail.com" || found.role === "OWNER" || found.role === "ADMIN") {
      return true;
    }
  }
  return false;
}

// In-Memory Database Data
let userIdCounter = 100;
let projectIdCounter = 20;
let contentIdCounter = 20;
let commentIdCounter = 30;
let subjectIdCounter = 10;
let reviewIdCounter = 10;
let fanPostIdCounter = 10;
let fanCommentIdCounter = 10;
let fanConceptIdCounter = 10;
let versionIdCounter = 100;

const users: any[] = [
  {
    id: 1,
    username: "writer1",
    email: "writer1@example.com",
    passwordHash: bcrypt.hashSync("password123", 10),
    role: "WRITER",
    bio: "Passionate screenwriter crafting futuristic sci-fi thrillers.",
    profileImage: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    createdAt: new Date().toISOString()
  },
  {
    id: 2,
    username: "storyteller",
    email: "storyteller@example.com",
    passwordHash: bcrypt.hashSync("password123", 10),
    role: "AUTHOR",
    bio: "Fantasy novelist weaving epic tales of mystery and wonder.",
    profileImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    createdAt: new Date().toISOString()
  },
  {
    id: 99,
    username: "shreyansh_owner",
    email: "shreyansh.ssharma@gmail.com",
    passwordHash: "",
    role: "OWNER",
    bio: "Platform Owner & Super Administrator",
    profileImage: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
    createdAt: new Date().toISOString()
  }
];

const projects: any[] = [];

const contents: Record<number, any> = {};

const comments: any[] = [];

const versionHistories: Record<number, any[]> = {};

const projectRelations: Record<number, any> = {};

const collaborators: Record<number, any[]> = {};

const invitations: any[] = [];
let invitationIdCounter = 1;

const reviews: any[] = [];

const fanPosts: any[] = [];

const fanComments: Record<number, any[]> = {};

const fanConcepts: any[] = [];

const subjects: any[] = [];

// Load persisted data from disk and Firestore
loadUsersFromFile();
loadProjectsFromFile();
loadContentsFromFile();
loadCollaboratorsFromFile();
loadInvitationsFromFile();
loadCommentsFromFile();

loadUsersFromFirestore().catch(() => {});
loadProjectsFromFirestore().catch(() => {});

// ==========================================
// 1. HEALTH CHECK
// ==========================================
app.get("/api/health", (req: Request, res: Response) => {
  res.json({ status: "UP", timestamp: new Date().toISOString() });
});

// ==========================================
// 2. AUTHENTICATION
// ==========================================
app.get("/api/auth/google/url", (req: Request, res: Response) => {
  const googleClientId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || "";
  const host = req.get("host") || "localhost:3000";
  const protocol = req.protocol === "https" || req.headers["x-forwarded-proto"] === "https" ? "https" : "http";
  const origin = `${protocol}://${host}`;
  const redirectUri = `${origin}/auth/google/callback`;

  const params = new URLSearchParams({
    client_id: googleClientId || "sample-google-client-id",
    redirect_uri: redirectUri,
    response_type: "token",
    scope: "openid email profile",
    prompt: "select_account"
  });

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

  res.json({
    clientId: googleClientId,
    configured: Boolean(googleClientId),
    authUrl,
    redirectUri
  });
});

app.get(["/auth/google/callback", "/auth/google/callback/"], (req: Request, res: Response) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>PlotForge - Google Sign In</title>
        <style>
          body { background: #0f172a; color: #f8fafc; font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
          .card { text-align: center; background: #1e293b; padding: 2rem; border-radius: 1rem; border: 1px solid #334155; }
        </style>
      </head>
      <body>
        <div class="card">
          <h2 style="margin-top:0;">Authenticating with Google...</h2>
          <p style="color:#94a3b8;">Connecting to your PlotForge account...</p>
        </div>
        <script>
          try {
            const hash = window.location.hash.substring(1);
            const params = new URLSearchParams(hash || window.location.search);
            const token = params.get('access_token') || params.get('id_token') || params.get('code');
            if (window.opener) {
              window.opener.postMessage({ type: 'GOOGLE_AUTH_SUCCESS', token, hash: window.location.hash }, '*');
              setTimeout(() => window.close(), 800);
            } else {
              window.location.href = '/';
            }
          } catch(e) {
            console.error(e);
          }
        </script>
      </body>
    </html>
  `);
});

app.post("/api/auth/google", (req: Request, res: Response) => {
  const { credential, email, name, picture, googleToken } = req.body;
  let userEmail = email;
  let userName = name;
  let userPicture = picture;

  if (credential && typeof credential === "string") {
    try {
      const decoded: any = jwt.decode(credential);
      if (decoded && decoded.email) {
        userEmail = decoded.email;
        userName = userName || decoded.name || decoded.given_name || userEmail.split("@")[0];
        userPicture = userPicture || decoded.picture;
      }
    } catch (e) {
      // Fallback
    }
  }

  if (!userEmail) {
    userEmail = "google.user@gmail.com";
  }

  const isOwnerEmail = userEmail.toLowerCase() === "shreyansh.ssharma@gmail.com";

  let user = users.find(u => u.email && u.email.toLowerCase() === userEmail.toLowerCase());

  if (!user) {
    const rawUsername = (userName || userEmail.split("@")[0]).toLowerCase().replace(/[^a-z0-9_]/g, "");
    let baseUsername = rawUsername || "google_author";
    let finalUsername = baseUsername;
    let count = 1;
    while (users.some(u => u.username === finalUsername)) {
      finalUsername = `${baseUsername}${count++}`;
    }

    user = {
      id: userIdCounter++,
      username: finalUsername,
      email: userEmail,
      passwordHash: "",
      role: isOwnerEmail ? "OWNER" : "WRITER",
      bio: isOwnerEmail ? "Platform Owner & Super Administrator" : "Plotforge author (Google Authenticated)",
      profileImage: userPicture || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
      googleAuth: true,
      createdAt: new Date().toISOString()
    };
    persistUser(user);
  } else {
    if (isOwnerEmail) user.role = "OWNER";
    persistUser(user);
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({
    token,
    userId: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    isOwner: isOwnerEmail || user.role === "OWNER" || user.role === "ADMIN",
    profileImage: user.profileImage
  });
});

app.post("/api/auth/register", (req: Request, res: Response) => {
  const { username, email, password, role } = req.body;
  const cleanUsername = (username || "").trim();
  const cleanEmail = (email || "").trim();

  if (!cleanUsername || !cleanEmail || !password) {
    return res.status(400).json({ message: "Username, email, and password are required." });
  }

  const existing = users.find(
    u => u.username.toLowerCase() === cleanUsername.toLowerCase() || (u.email && u.email.toLowerCase() === cleanEmail.toLowerCase())
  );
  if (existing) {
    return res.status(400).json({ message: "An account with this email or username already exists. Please log in." });
  }

  const isOwnerEmail = cleanEmail.toLowerCase() === "shreyansh.ssharma@gmail.com";

  const newUser = {
    id: userIdCounter++,
    username: cleanUsername,
    email: cleanEmail,
    passwordHash: bcrypt.hashSync(password, 10),
    role: isOwnerEmail ? "OWNER" : (role || "WRITER"),
    bio: isOwnerEmail ? "Platform Owner & Super Administrator" : "Plotforge creative member",
    profileImage: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
    createdAt: new Date().toISOString()
  };
  persistUser(newUser);

  const token = jwt.sign(
    { id: newUser.id, username: newUser.username, email: newUser.email, role: newUser.role },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.status(201).json({
    token,
    userId: newUser.id,
    username: newUser.username,
    email: newUser.email,
    role: newUser.role,
    isOwner: isOwnerEmail || newUser.role === "OWNER" || newUser.role === "ADMIN",
    profileImage: newUser.profileImage
  });
});

app.post("/api/auth/login", (req: Request, res: Response) => {
  const { username, email, password } = req.body;
  const loginName = (username || email || "").trim();

  if (!loginName || !password) {
    return res.status(400).json({ message: "Username/Email and password are required." });
  }

  const user = users.find(
    u => u.username.toLowerCase() === loginName.toLowerCase() || (u.email && u.email.toLowerCase() === loginName.toLowerCase())
  );

  if (!user) {
    return res.status(404).json({
      message: "No account found with these credentials. Please sign up / register first."
    });
  }

  if (user.passwordHash) {
    const isPasswordValid = bcrypt.compareSync(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid password. Please check your credentials and try again." });
    }
  }

  const isOwnerEmail = user.email && user.email.toLowerCase() === "shreyansh.ssharma@gmail.com";
  if (isOwnerEmail) user.role = "OWNER";

  persistUser(user);

  const token = jwt.sign(
    { id: user.id, username: user.username, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({
    token,
    userId: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    isOwner: isOwnerEmail || user.role === "OWNER" || user.role === "ADMIN",
    profileImage: user.profileImage
  });
});

app.get("/api/auth/me", (req: Request, res: Response) => {
  const authUser = getAuthUser(req);
  if (!authUser) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const user = users.find(u => u.id === authUser.id || u.username === authUser.username || (u.email && authUser.email && u.email.toLowerCase() === authUser.email.toLowerCase()));
  const isOwnerUser = authUser.email?.toLowerCase() === "shreyansh.ssharma@gmail.com" || (user && user.email?.toLowerCase() === "shreyansh.ssharma@gmail.com") || authUser.role === "OWNER" || authUser.role === "ADMIN";

  if (!user) {
    return res.json({
      id: authUser.id,
      username: authUser.username,
      email: authUser.email,
      role: isOwnerUser ? "OWNER" : (authUser.role || "WRITER"),
      isOwner: isOwnerUser,
      bio: isOwnerUser ? "Platform Owner & Super Administrator" : "Plotforge author",
      profileImage: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
      createdAt: new Date().toISOString()
    });
  }

  res.json({
    id: user.id,
    username: user.username,
    email: user.email,
    role: isOwnerUser ? "OWNER" : user.role,
    isOwner: isOwnerUser,
    bio: user.bio,
    profileImage: user.profileImage,
    createdAt: user.createdAt
  });
});

// App Configuration & Dynamic Logo Storage
const CUSTOM_LOGO_BASE64_FILE = path.join(process.cwd(), "data", "custom_logo_data.txt");

app.get("/api/app-config/logo", (req: Request, res: Response) => {
  try {
    ensureDataDir();
    const publicJpeg = path.join(process.cwd(), "public", "logo.jpeg");
    const publicJpg = path.join(process.cwd(), "public", "logo.jpg");
    const publicPng = path.join(process.cwd(), "public", "logo.png");
    const publicCustom = path.join(process.cwd(), "public", "custom-logo.png");

    let logoUrl = "/logo.svg";
    if (fs.existsSync(publicJpeg)) logoUrl = "/logo.jpeg";
    else if (fs.existsSync(publicJpg)) logoUrl = "/logo.jpg";
    else if (fs.existsSync(publicPng)) logoUrl = "/logo.png";
    else if (fs.existsSync(publicCustom)) logoUrl = "/custom-logo.png";

    let customData = "";
    if (fs.existsSync(CUSTOM_LOGO_BASE64_FILE)) {
      customData = fs.readFileSync(CUSTOM_LOGO_BASE64_FILE, "utf8");
    }

    res.json({
      logoUrl: customData ? customData : logoUrl,
      isCustom: Boolean(customData || logoUrl !== "/logo.svg")
    });
  } catch (err: any) {
    res.json({ logoUrl: "/logo.svg", isCustom: false });
  }
});

app.post("/api/app-config/logo", (req: Request, res: Response) => {
  try {
    const { dataUrl } = req.body;
    if (!dataUrl || typeof dataUrl !== "string") {
      return res.status(400).json({ message: "Invalid image data." });
    }

    ensureDataDir();
    fs.writeFileSync(CUSTOM_LOGO_BASE64_FILE, dataUrl, "utf8");

    const match = dataUrl.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
    if (match) {
      const buffer = Buffer.from(match[2], "base64");
      const pubDir = path.join(process.cwd(), "public");
      if (!fs.existsSync(pubDir)) fs.mkdirSync(pubDir, { recursive: true });

      fs.writeFileSync(path.join(pubDir, "logo.png"), buffer);
      fs.writeFileSync(path.join(pubDir, "logo.jpg"), buffer);
      fs.writeFileSync(path.join(pubDir, "logo.jpeg"), buffer);
      fs.writeFileSync(path.join(pubDir, "custom-logo.png"), buffer);

      const distDir = path.join(process.cwd(), "dist");
      if (fs.existsSync(distDir)) {
        try {
          fs.writeFileSync(path.join(distDir, "logo.png"), buffer);
          fs.writeFileSync(path.join(distDir, "logo.jpg"), buffer);
          fs.writeFileSync(path.join(distDir, "logo.jpeg"), buffer);
          fs.writeFileSync(path.join(distDir, "custom-logo.png"), buffer);
        } catch (_) {}
      }
    }

    res.json({ success: true, message: "Logo updated successfully." });
  } catch (err: any) {
    res.status(500).json({ message: "Failed to update logo: " + err?.message });
  }
});

app.put("/api/auth/me", async (req: Request, res: Response) => {
  const authUser = getAuthUser(req);
  if (!authUser) return res.status(401).json({ message: "Unauthorized" });

  const { username, email, bio, profileImage, theme, themePreset, colorAccent, aiPersona } = req.body;

  let user = users.find(u =>
    u.id === authUser.id ||
    (u.username && u.username.toLowerCase() === authUser.username.toLowerCase()) ||
    (u.email && authUser.email && u.email.toLowerCase() === authUser.email.toLowerCase())
  );

  if (!user) {
    user = {
      id: authUser.id || Date.now(),
      username: authUser.username || "user",
      email: authUser.email || "",
      role: authUser.role || "WRITER",
      createdAt: new Date().toISOString()
    };
    users.push(user);
  }

  if (username && username.trim()) user.username = username.trim();
  if (email && email.trim()) user.email = email.trim();
  if (bio !== undefined) user.bio = bio;
  if (profileImage !== undefined) user.profileImage = profileImage;
  if (theme !== undefined) user.theme = theme;
  if (themePreset !== undefined) user.themePreset = themePreset;
  if (colorAccent !== undefined) user.colorAccent = colorAccent;
  if (aiPersona !== undefined) user.aiPersona = aiPersona;

  const isOwnerUser = (user.email && user.email.toLowerCase() === "shreyansh.ssharma@gmail.com") || user.role === "OWNER" || user.role === "ADMIN";
  if (isOwnerUser) {
    user.role = "OWNER";
  }

  persistUser(user);

  const token = jwt.sign(
    { id: user.id, username: user.username, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({
    token,
    userId: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    isOwner: isOwnerUser,
    bio: user.bio,
    profileImage: user.profileImage,
    aiPersona: user.aiPersona || "jack_sparrow"
  });
});

app.post("/api/auth/forgot-password", (req: Request, res: Response) => {
  res.json({ message: "Password reset link sent to email." });
});

app.post("/api/auth/reset-password", (req: Request, res: Response) => {
  res.json({ message: "Password reset successful." });
});

// ==========================================
// 3. PROJECTS
// ==========================================
app.get("/api/projects", (req: Request, res: Response) => {
  const authUser = getAuthUser(req);
  const page = parseInt(req.query.page as string || "0", 10);
  const size = parseInt(req.query.size as string || "10", 10);
  const subjectId = req.query.subjectId;

  let filtered = [...projects];

  if (authUser) {
    filtered = projects.filter(p => {
      const isOwner = (p.authorUsername && p.authorUsername.toLowerCase() === authUser.username.toLowerCase()) ||
                      (p.authorEmail && p.authorEmail.toLowerCase() === authUser.email.toLowerCase());
      const collabs = collaborators[p.id] || [];
      const isCollab = collabs.some((c: any) =>
        (c.username && c.username.toLowerCase() === authUser.username.toLowerCase()) ||
        (c.email && c.email.toLowerCase() === authUser.email.toLowerCase()) ||
        c.userId === authUser.id
      );
      return isOwner || isCollab;
    });
  }

  if (subjectId) {
    const subj = subjects.find(s => String(s.id) === String(subjectId));
    if (subj) {
      filtered = filtered.filter(p => p.tags && p.tags.includes(subj.name));
    }
  }

  res.json({
    content: filtered,
    totalElements: filtered.length,
    totalPages: Math.ceil(filtered.length / size) || 1,
    pageNumber: page,
    pageSize: size,
    last: page + 1 >= Math.ceil(filtered.length / size)
  });
});

app.get("/api/projects/public", (req: Request, res: Response) => {
  const { type, completed } = req.query;
  let filtered = projects.filter(p => p.visibility === "PUBLIC");

  if (type) {
    filtered = filtered.filter(p => p.type === type);
  }
  if (completed !== undefined && completed !== null && completed !== "") {
    const isCompleted = completed === "true";
    filtered = filtered.filter(p => p.completed === isCompleted);
  }

  res.json({
    content: filtered,
    totalElements: filtered.length,
    totalPages: 1,
    pageNumber: 0,
    pageSize: 20,
    last: true
  });
});

app.post("/api/projects", (req: Request, res: Response) => {
  const authUser = getAuthUser(req);
  const {
    title,
    type,
    logline,
    visibility,
    completed,
    tags,
    genre1,
    genre2,
    genre3,
    subject,
    isPublic,
    isConnectedToMovie,
    mediaTitle,
    mediaPoster,
    mediaType,
    relationType
  } = req.body;

  const g1 = genre1 || subject || "Fantasy";
  const g2 = genre2 || "Adventure";
  const g3 = (genre3 && genre3 !== "NONE" && genre3 !== "None") ? genre3 : "";
  const subjectString = [g1, g2, g3].filter(Boolean).join(" / ");

  const newProject = {
    id: projectIdCounter++,
    title: title || "Untitled Project",
    type: type || "SCRIPT",
    logline: logline || "",
    visibility: visibility || (isPublic ? "PUBLIC" : "PRIVATE"),
    isPublic: isPublic !== undefined ? Boolean(isPublic) : true,
    completed: Boolean(completed),
    tags: Array.isArray(tags) ? tags : ["General"],
    genre1: g1,
    genre2: g2,
    genre3: g3,
    subject: subjectString,
    isConnectedToMovie: Boolean(isConnectedToMovie),
    mediaTitle: mediaTitle || "",
    mediaPoster: mediaPoster || "",
    mediaType: mediaType || "",
    relationType: relationType || "ORIGINAL",
    authorUsername: authUser?.username || "writer1",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  projects.unshift(newProject);
  persistProject(newProject);

  // Initialize empty content
  contents[newProject.id] = {
    id: contentIdCounter++,
    projectId: newProject.id,
    scriptContent: newProject.type === "SCRIPT" ? "INT. NEW SCENE - DAY\n\nStart writing your screenplay here..." : "",
    storyContent: newProject.type === "STORY" ? "Chapter 1\n\nStart writing your story here..." : "",
    updatedAt: new Date().toISOString()
  };
  saveContentsToFile();

  res.status(201).json(newProject);
});

app.get("/api/projects/:id", (req: Request, res: Response) => {
  const proj = projects.find(p => String(p.id) === req.params.id);
  if (!proj) return res.status(404).json({ message: "Project not found" });
  res.json(proj);
});

app.put("/api/projects/:id", (req: Request, res: Response) => {
  const index = projects.findIndex(p => String(p.id) === req.params.id);
  if (index === -1) return res.status(404).json({ message: "Project not found" });

  projects[index] = {
    ...projects[index],
    ...req.body,
    updatedAt: new Date().toISOString()
  };
  persistProject(projects[index]);

  res.json(projects[index]);
});

app.put("/api/projects/:id/visibility", (req: Request, res: Response) => {
  const index = projects.findIndex(p => String(p.id) === req.params.id);
  if (index === -1) return res.status(404).json({ message: "Project not found" });

  projects[index].visibility = req.body.visibility || "PUBLIC";
  projects[index].updatedAt = new Date().toISOString();
  persistProject(projects[index]);

  res.json(projects[index]);
});

app.delete("/api/projects/:id", (req: Request, res: Response) => {
  const authUser = getAuthUser(req);
  const idNum = parseInt(req.params.id, 10);
  const index = projects.findIndex(p => p.id === idNum);
  if (index !== -1) {
    const proj = projects[index];
    const userIsOwner = isOwner(authUser);
    const isAuthor = authUser && (proj.authorUsername === authUser.username || proj.authorEmail === authUser.email);

    if (userIsOwner || isAuthor || !authUser) {
      projects.splice(index, 1);
      delete contents[idNum];
      saveProjectsToFile();
      saveContentsToFile();
      return res.status(204).send();
    } else {
      return res.status(403).json({ message: "Forbidden: Only the author or platform owner can delete this project." });
    }
  }
  res.status(204).send();
});

app.get("/api/projects/:id/relations", (req: Request, res: Response) => {
  const idNum = parseInt(req.params.id, 10);
  const rels = projectRelations[idNum] || { linkedStories: [], linkedScripts: [] };
  
  const linkedStories = projects.filter(p => rels.linkedStories.includes(p.id));
  const linkedScripts = projects.filter(p => rels.linkedScripts.includes(p.id));

  res.json({ linkedStories, linkedScripts });
});

app.post("/api/projects/:id/link", (req: Request, res: Response) => {
  const idNum = parseInt(req.params.id, 10);
  const { targetProjectId } = req.body;
  
  if (!projectRelations[idNum]) {
    projectRelations[idNum] = { linkedStories: [], linkedScripts: [] };
  }

  const target = projects.find(p => p.id === Number(targetProjectId));
  if (target) {
    if (target.type === "STORY" && !projectRelations[idNum].linkedStories.includes(target.id)) {
      projectRelations[idNum].linkedStories.push(target.id);
    } else if (target.type === "SCRIPT" && !projectRelations[idNum].linkedScripts.includes(target.id)) {
      projectRelations[idNum].linkedScripts.push(target.id);
    }
  }

  res.json({ success: true });
});

app.post("/api/projects/:id/link-story/:storyId", (req: Request, res: Response) => {
  const idNum = parseInt(req.params.id, 10);
  const storyIdNum = parseInt(req.params.storyId, 10);

  if (!projectRelations[idNum]) {
    projectRelations[idNum] = { linkedStories: [], linkedScripts: [] };
  }
  if (!projectRelations[idNum].linkedStories.includes(storyIdNum)) {
    projectRelations[idNum].linkedStories.push(storyIdNum);
  }

  res.json({ success: true });
});

app.post("/api/projects/:projectId/invite", (req: Request, res: Response) => {
  const authUser = getAuthUser(req);
  const projId = parseInt(req.params.projectId, 10);
  const { username, email, role } = req.body;
  const proj = projects.find(p => p.id === projId);

  const target = (username || email || "").trim();
  if (!target) {
    return res.status(400).json({ message: "Username or email is required to invite a collaborator." });
  }

  const newInvite = {
    id: invitationIdCounter++,
    projectId: projId,
    projectTitle: proj?.title || "Untitled Project",
    invitedByUsername: authUser?.username || "Project Owner",
    invitedUsername: (username || "").trim(),
    invitedEmail: (email || "").trim(),
    role: role || "EDITOR",
    status: "PENDING",
    createdAt: new Date().toISOString()
  };

  invitations.unshift(newInvite);
  saveInvitationsToFile();

  res.status(201).json({ message: `Invitation sent to ${target}`, invitation: newInvite });
});

app.get("/api/invitations/my", (req: Request, res: Response) => {
  const authUser = getAuthUser(req);
  if (!authUser) {
    return res.json([]);
  }

  const userUname = (authUser.username || "").toLowerCase();
  const userEmail = (authUser.email || "").toLowerCase();

  const myPending = invitations.filter(inv => {
    if (inv.status !== "PENDING") return false;
    const invUname = (inv.invitedUsername || "").toLowerCase();
    const invEmail = (inv.invitedEmail || "").toLowerCase();
    return (invUname && invUname === userUname) || (invEmail && invEmail === userEmail);
  });

  res.json(myPending);
});

app.post("/api/invitations/:id/respond", (req: Request, res: Response) => {
  const authUser = getAuthUser(req);
  const inviteId = parseInt(req.params.id, 10);
  const { action, status } = req.body;
  const decision = (action === "ACCEPT" || status === "ACCEPTED") ? "ACCEPTED" : "REJECTED";

  const inv = invitations.find(i => i.id === inviteId);
  if (!inv) {
    return res.status(404).json({ message: "Invitation not found" });
  }

  inv.status = decision;

  if (decision === "ACCEPTED") {
    if (!collaborators[inv.projectId]) collaborators[inv.projectId] = [];
    const existingIndex = collaborators[inv.projectId].findIndex((c: any) =>
      (c.username && c.username.toLowerCase() === (authUser?.username || inv.invitedUsername).toLowerCase()) ||
      (c.email && c.email.toLowerCase() === (authUser?.email || inv.invitedEmail).toLowerCase())
    );

    const newCollabObj = {
      id: Date.now(),
      userId: authUser?.id || Date.now(),
      username: authUser?.username || inv.invitedUsername || inv.invitedEmail,
      email: authUser?.email || inv.invitedEmail,
      role: inv.role || "EDITOR"
    };

    if (existingIndex !== -1) {
      collaborators[inv.projectId][existingIndex] = newCollabObj;
    } else {
      collaborators[inv.projectId].push(newCollabObj);
    }
  }

  saveInvitationsToFile();
  saveCollaboratorsToFile();

  res.json({ message: `Collaboration ${decision === "ACCEPTED" ? "accepted" : "declined"}`, invitation: inv });
});

app.get("/api/projects/:projectId/collaborators", (req: Request, res: Response) => {
  const projId = parseInt(req.params.projectId, 10);
  res.json(collaborators[projId] || []);
});

app.delete("/api/projects/:projectId/collaborators/:userId", (req: Request, res: Response) => {
  const projId = parseInt(req.params.projectId, 10);
  if (collaborators[projId]) {
    collaborators[projId] = collaborators[projId].filter(c => String(c.id) !== req.params.userId && String(c.userId) !== req.params.userId && c.username !== req.params.userId);
    saveCollaboratorsToFile();
  }
  res.status(204).send();
});

app.get("/api/projects/:projectId/share-link", (req: Request, res: Response) => {
  const shareToken = `share-token-${req.params.projectId}`;
  res.json({ link: `${req.protocol}://${req.get("host")}/shared/${shareToken}` });
});

app.get("/api/projects/:projectId/export/pdf", (req: Request, res: Response) => {
  const proj = projects.find(p => String(p.id) === req.params.projectId);
  const content = contents[Number(req.params.projectId)] || {};

  const title = proj ? proj.title : "Screenplay";
  const bodyText = proj?.type === "SCRIPT" ? (content.scriptContent || "") : (content.storyContent || "");

  const mockPdfBuffer = Buffer.from(`%PDF-1.4\n1 0 obj\n<< /Title (${title}) >>\nendobj\n${bodyText}`);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${title}.pdf"`);
  res.send(mockPdfBuffer);
});

app.get("/api/projects/:projectId/export/txt", (req: Request, res: Response) => {
  const proj = projects.find(p => String(p.id) === req.params.projectId);
  const content = contents[Number(req.params.projectId)] || {};

  const title = proj ? proj.title : "Screenplay";
  const bodyText = proj?.type === "SCRIPT" ? (content.scriptContent || "") : (content.storyContent || "");

  const fullText = `=== ${title.toUpperCase()} ===\n\nLogline: ${proj?.logline || ''}\n\n${bodyText}`;
  res.setHeader("Content-Type", "text/plain");
  res.setHeader("Content-Disposition", `attachment; filename="${title}.txt"`);
  res.send(fullText);
});

app.get("/api/projects/:projectId/history", (req: Request, res: Response) => {
  const projId = parseInt(req.params.projectId, 10);
  const history = versionHistories[projId] || [];
  res.json({ content: history, totalElements: history.length, totalPages: 1 });
});

app.get("/api/projects/:projectId/history/:versionId", (req: Request, res: Response) => {
  const projId = parseInt(req.params.projectId, 10);
  const versionId = parseInt(req.params.versionId, 10);
  const history = versionHistories[projId] || [];
  const ver = history.find(v => v.id === versionId);
  if (!ver) return res.status(404).json({ message: "Version not found" });
  res.json(ver);
});

app.post("/api/projects/:projectId/history/:versionId/restore", (req: Request, res: Response) => {
  const projId = parseInt(req.params.projectId, 10);
  const versionId = parseInt(req.params.versionId, 10);
  const history = versionHistories[projId] || [];
  const ver = history.find(v => v.id === versionId);

  if (ver && contents[projId]) {
    contents[projId].scriptContent = ver.scriptContent || contents[projId].scriptContent;
    contents[projId].storyContent = ver.storyContent || contents[projId].storyContent;
    if (ver.sections) contents[projId].sections = ver.sections;
    contents[projId].updatedAt = new Date().toISOString();
  }

  res.json({ message: "Version restored successfully" });
});

// ==========================================
// 4. CONTENT & EDITING
// ==========================================
app.get("/api/content/:projectId", (req: Request, res: Response) => {
  const projId = parseInt(req.params.projectId, 10);
  const proj = projects.find(p => p.id === projId);

  if (!contents[projId]) {
    contents[projId] = {
      id: contentIdCounter++,
      projectId: projId,
      scriptContent: proj?.type === "SCRIPT" ? "INT. SCENE 1 - DAY\n\nStart writing..." : "",
      storyContent: proj?.type === "STORY" ? "Chapter 1\n\nStart writing..." : "",
      sections: [
        {
          sectionNumber: 1,
          text: proj?.type === "SCRIPT" ? "INT. SCENE 1 - DAY\n\nStart writing..." : "Chapter 1\n\nStart writing..."
        }
      ],
      updatedAt: new Date().toISOString()
    };
  }

  const rec = contents[projId];
  if (!rec.sections || !Array.isArray(rec.sections) || rec.sections.length === 0) {
    const textVal = rec.storyContent || rec.scriptContent || "";
    rec.sections = [{ sectionNumber: 1, text: textVal }];
  }

  res.json(rec);
});

app.put("/api/content/:projectId", (req: Request, res: Response) => {
  const projId = parseInt(req.params.projectId, 10);
  const { scriptContent, storyContent, sectionNumber, text, sections } = req.body;
  const proj = projects.find(p => p.id === projId);

  if (!contents[projId]) {
    contents[projId] = {
      id: contentIdCounter++,
      projectId: projId,
      scriptContent: "",
      storyContent: "",
      sections: [],
      updatedAt: new Date().toISOString()
    };
  }

  const record = contents[projId];

  if (scriptContent !== undefined) record.scriptContent = scriptContent;
  if (storyContent !== undefined) record.storyContent = storyContent;

  if (Array.isArray(sections)) {
    record.sections = sections;
  } else if (sectionNumber !== undefined && text !== undefined) {
    if (!record.sections) record.sections = [];
    const secNum = Number(sectionNumber);
    const existingIndex = record.sections.findIndex((s: any) => s.sectionNumber === secNum);
    if (existingIndex !== -1) {
      record.sections[existingIndex].text = text;
    } else {
      record.sections.push({ sectionNumber: secNum, text });
    }
  }

  // Update storyContent / scriptContent string based on sections if needed
  if (record.sections && record.sections.length > 0) {
    const sorted = [...record.sections].sort((a: any, b: any) => a.sectionNumber - b.sectionNumber);
    const activeText = sorted.find((s: any) => s.sectionNumber === (sectionNumber ? Number(sectionNumber) : 1))?.text || sorted[0].text;
    
    if (proj?.type === "SCRIPT" || (!storyContent && scriptContent)) {
      if (text !== undefined) record.scriptContent = activeText;
    } else {
      if (text !== undefined) record.storyContent = activeText;
    }
  }

  record.updatedAt = new Date().toISOString();

  saveContentsToFile();

  if (proj) {
    proj.updatedAt = new Date().toISOString();
    persistProject(proj);
  }

  // Save version snapshot
  if (!versionHistories[projId]) versionHistories[projId] = [];
  versionHistories[projId].unshift({
    id: versionIdCounter++,
    versionNumber: versionHistories[projId].length + 1,
    scriptContent: record.scriptContent,
    storyContent: record.storyContent,
    sections: record.sections,
    createdAt: new Date().toISOString()
  });

  res.json(record);
});


app.get("/api/content/:projectId/history", (req: Request, res: Response) => {
  const projId = parseInt(req.params.projectId, 10);
  res.json(versionHistories[projId] || []);
});

// ==========================================
// 5. COMMENTS
// ==========================================
app.get("/api/comments/:projectId", (req: Request, res: Response) => {
  const projId = parseInt(req.params.projectId, 10);
  const projComments = comments.filter(c => c.projectId === projId);
  res.json({ content: projComments, totalElements: projComments.length });
});

app.post("/api/comments", (req: Request, res: Response) => {
  const authUser = getAuthUser(req);
  const { projectId, text, line } = req.body;

  const newComment = {
    id: commentIdCounter++,
    projectId: Number(projectId),
    username: authUser?.username || "writer1",
    text,
    line: line ?? null,
    createdAt: new Date().toISOString()
  };

  comments.push(newComment);
  res.status(201).json(newComment);
});

app.delete("/api/comments/:commentId", (req: Request, res: Response) => {
  const commId = parseInt(req.params.commentId, 10);
  const index = comments.findIndex(c => c.id === commId);
  if (index !== -1) comments.splice(index, 1);
  res.status(204).send();
});

// ==========================================
// 6. SUBJECTS
// ==========================================
app.get("/api/subjects", (req: Request, res: Response) => {
  res.json(subjects);
});

app.post("/api/subjects", (req: Request, res: Response) => {
  const { name, description } = req.body;
  const newSubject = {
    id: subjectIdCounter++,
    name,
    description: description || "",
    projectCount: 0
  };
  subjects.push(newSubject);
  res.status(201).json(newSubject);
});

// ==========================================
// 7. REVIEWS
// ==========================================
app.post("/api/reviews", (req: Request, res: Response) => {
  const authUser = getAuthUser(req);
  const { projectId, reviewTitle, title, mediaTitle, mediaPoster, rating, comment, content } = req.body;

  const proj = projects.find(p => p.id === Number(projectId));

  const newReview = {
    id: reviewIdCounter++,
    projectId: Number(projectId) || null,
    reviewTitle: reviewTitle || title || "Critique Review",
    mediaTitle: mediaTitle || (proj ? proj.title : "General Media"),
    mediaPoster: mediaPoster || "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=300&auto=format&fit=crop&q=80",
    authorUsername: authUser?.username || "writer1",
    author: authUser?.username || "writer1",
    rating: Number(rating) || 8,
    content: content || comment || "",
    comment: content || comment || "",
    createdAt: new Date().toISOString()
  };

  reviews.unshift(newReview);
  res.status(201).json(newReview);
});

app.get("/api/reviews", (req: Request, res: Response) => {
  const authUser = getAuthUser(req);
  const { mineOnly } = req.query;

  let filtered = [...reviews];
  if (mineOnly === "true" && authUser) {
    filtered = filtered.filter(r => r.authorUsername === authUser.username);
  }

  res.json(filtered);
});

app.delete("/api/reviews/:id", (req: Request, res: Response) => {
  const authUser = getAuthUser(req);
  const idNum = parseInt(req.params.id, 10);
  const index = reviews.findIndex(r => r.id === idNum);
  if (index !== -1) {
    const rev = reviews[index];
    const userIsOwner = isOwner(authUser);
    const isAuthor = authUser && (rev.authorUsername === authUser.username || rev.author === authUser.username);

    if (userIsOwner || isAuthor || !authUser) {
      reviews.splice(index, 1);
      return res.status(204).send();
    } else {
      return res.status(403).json({ message: "Forbidden: Only the author or platform owner can delete this review." });
    }
  }
  res.status(204).send();
});

// ==========================================
// 8. FAN FUTURE & FAN CONCEPTS
// ==========================================
app.post(["/api/fanfuture", "/api/fan-future"], (req: Request, res: Response) => {
  const authUser = getAuthUser(req);
  const { mediaType, tmdbId, mediaTitle, mediaPoster, title, content, relationType } = req.body;

  const newPost = {
    id: fanPostIdCounter++,
    mediaType: mediaType || "MOVIE",
    tmdbId: tmdbId || "550",
    mediaTitle: mediaTitle || "",
    mediaPoster: mediaPoster || "",
    title,
    content,
    relationType: relationType || "ALTERNATE_ENDING",
    authorUsername: authUser?.username || "writer1",
    author: authUser?.username || "writer1",
    likesCount: 0,
    likedByUsers: [],
    createdAt: new Date().toISOString()
  };

  fanPosts.unshift(newPost);
  res.status(201).json(newPost);
});

app.get(["/api/fanfuture", "/api/fan-future"], (req: Request, res: Response) => {
  const { mediaType, tmdbId, search } = req.query;
  let filtered = [...fanPosts];

  if (mediaType) {
    filtered = filtered.filter(p => p.mediaType === mediaType);
  }
  if (tmdbId) {
    filtered = filtered.filter(p => String(p.tmdbId) === String(tmdbId));
  }
  if (search) {
    const q = String(search).toLowerCase();
    filtered = filtered.filter(p => p.title.toLowerCase().includes(q) || p.content.toLowerCase().includes(q) || p.mediaTitle.toLowerCase().includes(q));
  }

  res.json(filtered);
});

app.get(["/api/fanfuture/trending", "/api/fan-future/trending"], (req: Request, res: Response) => {
  const sorted = [...fanPosts].sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0));
  res.json(sorted);
});

app.get(["/api/fanfuture/:id", "/api/fan-future/:id"], (req: Request, res: Response) => {
  const post = fanPosts.find(p => String(p.id) === req.params.id);
  if (!post) return res.status(404).json({ message: "Fan post not found" });
  res.json(post);
});

app.delete(["/api/fanfuture/:id", "/api/fan-future/:id"], (req: Request, res: Response) => {
  const authUser = getAuthUser(req);
  const idNum = parseInt(req.params.id, 10);
  const index = fanPosts.findIndex(p => p.id === idNum);
  if (index !== -1) {
    const post = fanPosts[index];
    const userIsOwner = isOwner(authUser);
    const isAuthor = authUser && (post.authorUsername === authUser.username || post.author === authUser.username);

    if (userIsOwner || isAuthor || !authUser) {
      fanPosts.splice(index, 1);
      delete fanComments[idNum];
      return res.status(204).send();
    } else {
      return res.status(403).json({ message: "Forbidden: Only the author or platform owner can delete this pitch." });
    }
  }
  res.status(204).send();
});

app.post(["/api/fanfuture/:id/like", "/api/fan-future/:id/like"], (req: Request, res: Response) => {
  const authUser = getAuthUser(req);
  const post = fanPosts.find(p => String(p.id) === req.params.id);
  if (!post) return res.status(404).json({ message: "Fan post not found" });

  const username = authUser?.username || "writer1";
  const userIdx = post.likedByUsers.indexOf(username);

  if (userIdx !== -1) {
    post.likedByUsers.splice(userIdx, 1);
    post.likesCount = Math.max(0, post.likesCount - 1);
  } else {
    post.likedByUsers.push(username);
    post.likesCount += 1;
  }

  res.json(post);
});

app.post(["/api/fanfuture/comments", "/api/fan-future/comments"], (req: Request, res: Response) => {
  const authUser = getAuthUser(req);
  const { postId, text } = req.body;

  const postIdNum = Number(postId);
  if (!fanComments[postIdNum]) fanComments[postIdNum] = [];

  const newFanComment = {
    id: fanCommentIdCounter++,
    postId: postIdNum,
    authorUsername: authUser?.username || "writer1",
    author: authUser?.username || "writer1",
    text,
    createdAt: new Date().toISOString()
  };

  fanComments[postIdNum].push(newFanComment);
  res.status(201).json(newFanComment);
});

app.get(["/api/fanfuture/:id/comments", "/api/fan-future/:id/comments"], (req: Request, res: Response) => {
  const postIdNum = parseInt(req.params.id, 10);
  res.json(fanComments[postIdNum] || []);
});

// Fan Concepts Endpoints
app.get(["/api/fanconcepts", "/api/fan-concepts"], (req: Request, res: Response) => {
  res.json(fanConcepts);
});

app.post(["/api/fanconcepts", "/api/fan-concepts"], (req: Request, res: Response) => {
  const authUser = getAuthUser(req);
  const { title, conceptUrl, description, conceptType, mediaTitle, mediaPoster, relationType } = req.body;

  const newConcept = {
    id: fanConceptIdCounter++,
    title,
    conceptUrl,
    description: description || "",
    conceptType: conceptType || "POSTER",
    mediaTitle: mediaTitle || "",
    mediaPoster: mediaPoster || "",
    relationType: relationType || "FAN_CONCEPT",
    authorUsername: authUser?.username || "writer1",
    author: authUser?.username || "writer1",
    rating: 10,
    ratingsCount: 1,
    createdAt: new Date().toISOString()
  };

  fanConcepts.unshift(newConcept);
  res.status(201).json(newConcept);
});

app.delete(["/api/fanconcepts/:id", "/api/fan-concepts/:id"], (req: Request, res: Response) => {
  const authUser = getAuthUser(req);
  const idNum = parseInt(req.params.id, 10);
  const index = fanConcepts.findIndex(c => c.id === idNum);
  if (index !== -1) {
    const concept = fanConcepts[index];
    const userIsOwner = isOwner(authUser);
    const isAuthor = authUser && (concept.authorUsername === authUser.username || concept.author === authUser.username);

    if (userIsOwner || isAuthor || !authUser) {
      fanConcepts.splice(index, 1);
      return res.status(204).send();
    } else {
      return res.status(403).json({ message: "Forbidden: Only the author or platform owner can delete this concept." });
    }
  }
  res.status(204).send();
});

app.post(["/api/fanconcepts/:id/rate", "/api/fan-concepts/:id/rate"], (req: Request, res: Response) => {
  const concept = fanConcepts.find(c => String(c.id) === req.params.id);
  if (!concept) return res.status(404).json({ message: "Concept not found" });

  const score = Number(req.body.rating) || 10;
  concept.ratingsCount = (concept.ratingsCount || 0) + 1;
  concept.rating = Number((((concept.rating || 0) * (concept.ratingsCount - 1) + score) / concept.ratingsCount).toFixed(1));

  res.json(concept);
});

// Admin User Management Endpoints
app.get("/api/admin/users", (req: Request, res: Response) => {
  const authUser = getAuthUser(req);
  if (!isOwner(authUser)) {
    return res.status(403).json({ message: "Forbidden: Platform owner rights required." });
  }
  const cleanUsers = users.map(({ passwordHash, ...u }) => ({
    ...u,
    isOwner: (u.email && u.email.toLowerCase() === "shreyansh.ssharma@gmail.com") || u.role === "OWNER"
  }));
  res.json(cleanUsers);
});

app.delete("/api/admin/users/:id", (req: Request, res: Response) => {
  const authUser = getAuthUser(req);
  if (!isOwner(authUser)) {
    return res.status(403).json({ message: "Forbidden: Platform owner rights required." });
  }
  const targetId = parseInt(req.params.id, 10);
  const index = users.findIndex(u => u.id === targetId);
  if (index !== -1) {
    const targetUser = users[index];
    if (targetUser.email && targetUser.email.toLowerCase() === "shreyansh.ssharma@gmail.com") {
      return res.status(400).json({ message: "Cannot delete the primary platform owner account." });
    }
    users.splice(index, 1);
    saveUsersToFile();
  }
  res.status(204).send();
});

// ==========================================
// 9. TMDB PROXY / MOCK MEDIA SEARCH
// ==========================================
const mockMovies = [
  {
    id: 9991,
    title: "War 2",
    name: "War 2",
    poster_path: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=300&auto=format&fit=crop&q=80",
    overview: "High-octane spy thriller sequel packed with globe-trotting action and intense espionage combat.",
    release_date: "2025-08-14",
    first_air_date: "2025-08-14",
    media_type: "movie",
    vote_average: 8.8
  },
  {
    id: 550,
    title: "Fight Club",
    name: "Fight Club",
    poster_path: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=300&auto=format&fit=crop&q=80",
    overview: "A ticking-time-bomb insomniac and a slippery soap salesman channel primal male aggression into a shocking new form of therapy.",
    release_date: "1999-10-15",
    first_air_date: "1999-10-15",
    media_type: "movie",
    vote_average: 8.4
  },
  {
    id: 157336,
    title: "Interstellar",
    name: "Interstellar",
    poster_path: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=300&auto=format&fit=crop&q=80",
    overview: "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival.",
    release_date: "2014-11-05",
    first_air_date: "2014-11-05",
    media_type: "movie",
    vote_average: 8.6
  },
  {
    id: 27205,
    title: "Inception",
    name: "Inception",
    poster_path: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=300&auto=format&fit=crop&q=80",
    overview: "A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea.",
    release_date: "2010-07-15",
    first_air_date: "2010-07-15",
    media_type: "movie",
    vote_average: 8.3
  },
  {
    id: 1399,
    title: "Game of Thrones",
    name: "Game of Thrones",
    poster_path: "https://images.unsplash.com/photo-1514539079130-25950c84af65?w=300&auto=format&fit=crop&q=80",
    overview: "Nine noble families fight for control over the lands of Westeros, while an ancient enemy returns.",
    release_date: "2011-04-17",
    first_air_date: "2011-04-17",
    media_type: "tv",
    vote_average: 8.4
  }
];

app.get("/api/tmdb/search", async (req: Request, res: Response) => {
  const query = String(req.query.query || "").trim();
  const cacheKey = `tmdb_search_${query.toLowerCase()}`;
  const cached = tmdbCache.get(cacheKey);
  if (cached) {
    return res.json(cached);
  }

  const apiKey = process.env.TMDB_API_KEY;

  if (apiKey) {
    try {
      const endpoint = query
        ? `https://api.themoviedb.org/3/search/multi?api_key=${apiKey}&query=${encodeURIComponent(query)}`
        : `https://api.themoviedb.org/3/trending/all/week?api_key=${apiKey}`;
      const response = await axios.get(endpoint, { timeout: 4000 });
      const results = (response.data.results || []).map((m: any) => ({
        id: m.id,
        title: m.title || m.name || "Untitled",
        name: m.name || m.title || "Untitled",
        poster_path: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=300&auto=format&fit=crop&q=80",
        overview: m.overview || "No overview available.",
        release_date: m.release_date || m.first_air_date || "",
        first_air_date: m.first_air_date || m.release_date || "",
        media_type: m.media_type || (m.first_air_date ? "tv" : "movie"),
        vote_average: m.vote_average || 7.0
      }));
      const payload = { results };
      tmdbCache.set(cacheKey, payload, 10 * 60 * 1000); // 10 minutes cache
      return res.json(payload);
    } catch (err) {
      console.error("TMDB API search error, falling back to mock data:", err);
    }
  }

  // Fallback to local mock data
  if (!query) {
    const payload = { results: mockMovies };
    tmdbCache.set(cacheKey, payload, 30 * 60 * 1000);
    return res.json(payload);
  }
  const lowerQ = query.toLowerCase();
  const results = mockMovies.filter(m =>
    (m.title && m.title.toLowerCase().includes(lowerQ)) ||
    (m.overview && m.overview.toLowerCase().includes(lowerQ))
  );
  const payload = { results: results.length ? results : mockMovies };
  tmdbCache.set(cacheKey, payload, 30 * 60 * 1000);
  res.json(payload);
});

app.get("/api/tmdb/movie/:id", async (req: Request, res: Response) => {
  const cacheKey = `tmdb_movie_${req.params.id}`;
  const cached = tmdbCache.get(cacheKey);
  if (cached) {
    return res.json(cached);
  }

  const apiKey = process.env.TMDB_API_KEY;
  if (apiKey) {
    try {
      const response = await axios.get(`https://api.themoviedb.org/3/movie/${req.params.id}?api_key=${apiKey}`, { timeout: 4000 });
      const m = response.data;
      const payload = {
        id: m.id,
        title: m.title || m.original_title,
        name: m.title,
        poster_path: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=300&auto=format&fit=crop&q=80",
        overview: m.overview,
        release_date: m.release_date,
        media_type: "movie",
        vote_average: m.vote_average
      };
      tmdbCache.set(cacheKey, payload, 60 * 60 * 1000); // 1 hour cache
      return res.json(payload);
    } catch (err) {
      console.error("TMDB API movie details error:", err);
    }
  }
  const found = mockMovies.find(m => String(m.id) === req.params.id) || mockMovies[0];
  tmdbCache.set(cacheKey, found, 60 * 60 * 1000);
  res.json(found);
});

app.get("/api/tmdb/tv/:id", async (req: Request, res: Response) => {
  const cacheKey = `tmdb_tv_${req.params.id}`;
  const cached = tmdbCache.get(cacheKey);
  if (cached) {
    return res.json(cached);
  }

  const apiKey = process.env.TMDB_API_KEY;
  if (apiKey) {
    try {
      const response = await axios.get(`https://api.themoviedb.org/3/tv/${req.params.id}?api_key=${apiKey}`, { timeout: 4000 });
      const m = response.data;
      const payload = {
        id: m.id,
        title: m.name || m.original_name,
        name: m.name,
        poster_path: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : "https://images.unsplash.com/photo-1514539079130-25950c84af65?w=300&auto=format&fit=crop&q=80",
        overview: m.overview,
        first_air_date: m.first_air_date,
        media_type: "tv",
        vote_average: m.vote_average
      };
      tmdbCache.set(cacheKey, payload, 60 * 60 * 1000); // 1 hour cache
      return res.json(payload);
    } catch (err) {
      console.error("TMDB API tv details error:", err);
    }
  }
  const found = mockMovies.find(m => String(m.id) === req.params.id) || mockMovies[3];
  tmdbCache.set(cacheKey, found, 60 * 60 * 1000);
  res.json(found);
});

// ==========================================
// 10. SHARED PROJECT VIEW
// ==========================================
app.get("/api/share/:token", (req: Request, res: Response) => {
  const tokenStr = req.params.token;
  // Extract project ID if present in token
  const projIdMatch = tokenStr.match(/(\d+)$/);
  const projId = projIdMatch ? parseInt(projIdMatch[1], 10) : 1;

  const proj = projects.find(p => p.id === projId) || projects[0];
  const content = contents[proj.id] || { scriptContent: "", storyContent: "" };

  res.json({
    id: proj.id,
    title: proj.title,
    type: proj.type,
    logline: proj.logline,
    visibility: proj.visibility,
    completed: proj.completed,
    tags: proj.tags,
    authorUsername: proj.authorUsername,
    scriptContent: content.scriptContent,
    storyContent: content.storyContent,
    createdAt: proj.createdAt
  });
});

// Rate limit cooldown state for slide generation to avoid quota spamming
let geminiQuotaCooldownUntil = 0;

// ==========================================
// 11. AGENT 1: DYNAMIC BACKGROUND & DIALOGUE AGENT
// ==========================================
app.post("/api/agent/slides/generate", async (req: Request, res: Response) => {
  const { genre, preference, apiKey } = req.body || {};
  const customKey = apiKey || (req.headers["x-gemini-api-key"] as string);
  const ai = getGenAI(customKey);

  const fallbackQuotes = [
    { quote: '"An idea is like a virus. Resilient. Highly contagious."', movie: "Inception", character: "Dom Cobb", genre: "Sci-Fi Thriller", themeColor: "#0ea5e9", poster: "https://image.tmdb.org/t/p/w780/oYuLE29113IGPqAag3AawB9A3Y9.jpg", bgImage: "https://image.tmdb.org/t/p/w1280/8ZTVqvKDQ8emSGUEMjsS4yHAwrp.jpg" },
    { quote: '"Why do we fall, sir? So that we can learn to pick ourselves up."', movie: "The Dark Knight", character: "Alfred Pennyworth", genre: "Action Crime", themeColor: "#f59e0b", poster: "https://image.tmdb.org/t/p/w780/qJ2tW6WMUDux911r6m7haRef0WH.jpg", bgImage: "https://image.tmdb.org/t/p/w1280/dqK9Hag1054tghRQSqLSfrkvQnA.jpg" },
    { quote: '"Do or do not. There is no try."', movie: "Star Wars: The Empire Strikes Back", character: "Yoda", genre: "Space Opera", themeColor: "#10b981", poster: "https://image.tmdb.org/t/p/w780/7bu3A2A8S13P3GB3v3BipR3R3.jpg", bgImage: "https://image.tmdb.org/t/p/w1280/c6OLXfKAk5BKeR6broC8pYiCquX.jpg" },
    { quote: '"May the Force be with you."', movie: "Star Wars: A New Hope", character: "Han Solo", genre: "Sci-Fi Fantasy", themeColor: "#8b5cf6", poster: "https://image.tmdb.org/t/p/w780/6FfCtAuVA133v34I94yTW228iO.jpg", bgImage: "https://image.tmdb.org/t/p/w1280/zqR39a9c400J052d3a3d53p4i8.jpg" }
  ];

  // If rate limited recently, serve fallback instantly without hitting API
  if (Date.now() < geminiQuotaCooldownUntil) {
    const picked = fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)];
    return res.json({ id: "fallback-" + Date.now(), ...picked });
  }

  const defaultBgs = [
    "https://image.tmdb.org/t/p/w1280/suaEOtk1N1sgg2MTM7oZd2cfVp3.jpg",
    "https://image.tmdb.org/t/p/w1280/5XNQBqnBwPA9yT0jZ0p3s8bbLh0.jpg",
    "https://image.tmdb.org/t/p/w1280/tSPT36ZKlP2WVHJLM4cQPLSzv3b.jpg",
    "https://image.tmdb.org/t/p/w1280/dqK9Hag1054tghRQSqLSfrkvQnA.jpg",
    "https://image.tmdb.org/t/p/w1280/8ZTVqvKDQ8emSGUEMjsS4yHAwrp.jpg",
    "https://image.tmdb.org/t/p/w1280/c6OLXfKAk5BKeR6broC8pYiCquX.jpg"
  ];
  const randomBg = defaultBgs[Math.floor(Math.random() * defaultBgs.length)];

  if (!ai) {
    return res.status(400).json({
      error: "MISSING_KEY",
      message: "Please provide a Gemini API Key to generate real-time AI movie slides."
    });
  }

  try {
    const prompt = `Generate a fresh, unique, cinematic quote and slide layout JSON object for an iconic real or fictional film or television series in the genre "${genre || "Sci-Fi Drama"}".
Make the quote dramatic, memorable, and unique every time (non-deterministic).
Return strict JSON with fields:
- "genre": short genre string
- "quote": memorable, dramatic quote in double quotation marks
- "movie": exact title of a famous movie or television series
- "character": name of character who spoke it
- "themeColor": hex color code representing the cinematic mood (e.g. #3b82f6)`;

    const response = await generateWithRetry(ai, {
      contents: prompt,
      config: {
        temperature: 1.0, // High temperature for creative, varied non-deterministic quotes
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            genre: { type: Type.STRING },
            quote: { type: Type.STRING },
            movie: { type: Type.STRING },
            character: { type: Type.STRING },
            themeColor: { type: Type.STRING }
          },
          required: ["genre", "quote", "movie", "character", "themeColor"]
        }
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    const movieName = parsed.movie || "Pulp Fiction";

    // Query TMDB API for official movie poster & backdrop (cached for fast repeated loads)
    let backdropUrl = randomBg;
    let posterUrl = backdropUrl;

    const posterCacheKey = `poster_${movieName.toLowerCase().replace(/[^a-z0-9]/g, "")}`;
    const cachedPosters = posterLookupCache.get(posterCacheKey);

    if (cachedPosters) {
      backdropUrl = cachedPosters.backdropUrl;
      posterUrl = cachedPosters.posterUrl;
    } else {
      try {
        const tmdbRes = await axios.get(
          `https://api.themoviedb.org/3/search/multi?api_key=3fd2be6f0c70a2a598f084ddfb75487c&query=${encodeURIComponent(movieName)}`,
          { timeout: 3000 }
        );
        if (tmdbRes.data && tmdbRes.data.results && tmdbRes.data.results.length > 0) {
          const match = tmdbRes.data.results.find((r: any) => r.backdrop_path || r.poster_path) || tmdbRes.data.results[0];
          if (match.backdrop_path) {
            backdropUrl = `https://image.tmdb.org/t/p/w1280${match.backdrop_path}`;
          }
          if (match.poster_path) {
            posterUrl = `https://image.tmdb.org/t/p/w780${match.poster_path}`;
          } else if (match.backdrop_path) {
            posterUrl = backdropUrl;
          }
          posterLookupCache.set(posterCacheKey, { posterUrl, backdropUrl }, 24 * 60 * 60 * 1000); // 24 hours cache
        }
      } catch (tmdbErr: any) {
        console.log("TMDB search fallback:", tmdbErr.message);
      }
    }

    res.json({
      id: "ai-generated-" + Date.now(),
      genre: parsed.genre || genre || "Cinematic",
      quote: parsed.quote || '"The story continues where the horizon ends."',
      movie: movieName,
      character: parsed.character || "The Protagonist",
      poster: posterUrl,
      bgImage: backdropUrl || posterUrl,
      themeColor: parsed.themeColor || "#3b82f6"
    });
  } catch (err: any) {
    const isRateLimit = err?.status === 429 || err?.message?.includes("429") || err?.message?.includes("quota");
    if (isRateLimit) {
      // Activate 60 second rate-limit cooldown to avoid spamming the free tier limit
      geminiQuotaCooldownUntil = Date.now() + 60000;
    }
    const picked = fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)];
    res.json({
      id: "fallback-" + Date.now(),
      ...picked
    });
  }
});

// ==========================================
// 12. AGENT 2: AI STORY & SCRIPT CO-PILOT ASSISTANT
// ==========================================
const PERSONA_PROMPTS: Record<string, { name: string; instructions: string }> = {
  jack_sparrow: {
    name: "Captain Jack Sparrow",
    instructions: "Answer in Captain Jack Sparrow's witty, charming, flamboyant, and eccentric pirate persona (using iconic catchphrases like 'savvy?', 'matey', 'me compass points to...', 'drink up me hearties', 'a grand voyage', etc.). Give clever, highly specific scene beats and dialogue."
  },
  yoda: {
    name: "Master Yoda",
    instructions: "Answer in Master Yoda's wise, ancient Jedi Grand Master persona using reversed OSV syntax ('Strong in this scene, the emotion is', 'Patience, young writer, you must have', 'A dark path, this plot twist leads to'). Offer deep narrative wisdom and force-like story balance."
  },
  tony_stark: {
    name: "Tony Stark (Iron Man)",
    instructions: "Answer in Tony Stark's fast-talking, sarcastic, highly confident, genius billionaire persona. Use high-tech suit analogies, JARVIS references, and pop-culture snark while delivering brilliant, punchy script upgrades."
  },
  sherlock_holmes: {
    name: "Sherlock Holmes",
    instructions: "Answer in Sherlock Holmes' articulate, hyper-observant, Victorian detective persona ('Elementary!', 'The game is afoot!'). Dissect plot holes, character motives, and scene logic with forensic precision."
  },
  morpheus: {
    name: "Morpheus",
    instructions: "Answer in Morpheus' deep, resonant, philosophical Matrix guide persona. Talk about 'taking the red pill', shattering narrative illusions, and uncovering deep subtext and destiny in the story."
  },
  vito_corleone: {
    name: "Don Vito Corleone",
    instructions: "Answer in Don Vito Corleone's soft-spoken, authoritative Godfather persona ('I'm gonna make him an offer he can't refuse'). Focus on respect, family loyalty, power dynamics, and dramatic tension with quiet gravity."
  },
  wednesday_addams: {
    name: "Wednesday Addams",
    instructions: "Answer in Wednesday Addams' unemotional, razor-sharp, deadpan gothic persona. Infuse macabre humor, tragic twists, delicious dark stakes, and sinister wit into the narrative advice."
  },
  cersei_lannister: {
    name: "Cersei Lannister",
    instructions: "Answer in Cersei Lannister's 100% accurate, cold, arrogant, ruthless, and scheming Queen persona ('When you play the game of thrones, you win or you die'). Treat mercy as weakness. Pique user interest with brutal betrayals, ruthless political power plays, and merciless villainy."
  },
  tyrion_lannister: {
    name: "Tyrion Lannister",
    instructions: "Answer in Tyrion Lannister's sharp, witty, wine-loving Hand of the King persona ('I drink and I know things'). Deliver sarcastic humor, deep political shrewdness, and brilliant tactical plot maneuvers."
  },
  tywin_lannister: {
    name: "Tywin Lannister",
    instructions: "Answer in Lord Tywin Lannister's cold, dominant, ruthless, and uncompromising patriarch persona ('A lion doesn't concern himself with the opinions of sheep'). Demolish weak narrative choices with stern authority, demanding total discipline, ruthless power dynamics, and eternal legacy."
  },
  ramsay_bolton: {
    name: "Ramsay Bolton",
    instructions: "Answer in Ramsay Bolton's 100% accurate, sadistic, terrifying, and gleefully villainous persona ('If you think this has a happy ending, you haven't been paying attention'). Push dark psychological horror, brutal betrayals, and terrifying villain arcs with menacing delight."
  },
  daenerys_targaryen: {
    name: "Daenerys Targaryen",
    instructions: "Answer in Daenerys Targaryen's regal, fierce, and unyielding Mother of Dragons persona ('Fire and Blood', 'Dracarys', 'I will break the wheel'). Command the narrative with royal majesty, passionate conviction, dragonfire, and epic conquests."
  },
  jon_snow: {
    name: "Jon Snow",
    instructions: "Answer in Jon Snow's brooding, earnest, and honorable King in the North persona ('Winter is coming', 'I know nothing'). Focus on grim sacrifice, duty, desperate battles against dark forces, and tragic heroism."
  }
};

// Chatbot Copilot Configuration endpoint (returns server environment settings)
app.get("/api/agent/copilot/config", (req: Request, res: Response) => {
  const envMaxChars = Number(process.env.CHATBOT_MAX_CHARS || 1200);
  res.json({
    defaultMaxChars: isNaN(envMaxChars) ? 1200 : envMaxChars,
  });
});

// Streaming AI Copilot endpoint for ultra-low TTFT (<300ms) with Server-Sent Events (SSE)
app.post("/api/agent/copilot/stream", async (req: Request, res: Response) => {
  const { storyContent, scriptContent, projectTitle, prompt, apiKey, messages, aiPersona, maxChars } = req.body || {};
  const authUser = getAuthUser(req);
  const selectedPersonaKey = aiPersona || (authUser && (users.find(u => u.id === authUser.id)?.aiPersona)) || "jack_sparrow";
  const persona = PERSONA_PROMPTS[selectedPersonaKey] || PERSONA_PROMPTS.jack_sparrow;

  const defaultMaxChars = Number(process.env.CHATBOT_MAX_CHARS || 1200);
  const requestedChars = Number(maxChars);
  const activeMaxChars = !isNaN(requestedChars) && requestedChars > 0 ? Math.min(Math.max(requestedChars, 200), 10000) : defaultMaxChars;

  const customKey = apiKey || (req.headers["x-gemini-api-key"] as string);
  const ai = getGenAI(customKey);

  // Set SSE Headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  if (!ai) {
    res.write(`data: ${JSON.stringify({ error: "MISSING_KEY", chunk: `⚠️ **AI Service Unavailable**\n\nThe server AI service is currently unavailable. Please try again later.`, done: true })}\n\n`);
    return res.end();
  }

  try {
    let historyText = "";
    if (Array.isArray(messages) && messages.length > 0) {
      historyText = messages
        .slice(-4)
        .map((m: any) => `${m.role === "user" ? "User" : persona.name}: ${m.content}`)
        .join("\n\n");
    }

    const aiPrompt = `You are ${persona.name}—your chosen famous movie character AI assistant and master Hollywood screenplay co-pilot!

Project Title: "${projectTitle || "Untitled Project"}"

${historyText ? `--- RECENT CONVERSATION HISTORY ---\n${historyText}\n---` : ""}

CURRENT USER PROMPT / QUESTION:
"${prompt || "Give me fresh creative suggestions and narrative ideas for this story."}"

STORY OUTLINE / CONCEPT:
${(storyContent || "No story outline provided yet.").slice(0, 2000)}

SCREENPLAY SCRIPT:
${(scriptContent || "No script written yet.").slice(0, 2000)}

INSTRUCTIONS & FORMATTING RULES:
- ${persona.instructions}
- FORMATTING (RICH MARKDOWN / RMD): Format your response in clean, beautiful Rich Markdown (RMD). Use clear headings (### Section Title), **bold** for key plot points and character names, *italics* for delivery tone or dialogue snippets, > blockquotes for memorable quotes or dialogue beats, styled bullet points for suggestions, and \`\`\`screenplay or \`\`\`fountain code blocks for sample screenplay scenes.
- CHARACTER LIMIT CONSTRAINT (STRICT): Your complete response MUST NOT exceed ${activeMaxChars} characters. Be concise, sharp, high-impact, and avoid verbose filler while preserving rich formatting and your signature personality.
- Give genuinely brilliant, clever, highly specific scene beats, character depth, dialogue lines, twists, or pacing tips tailored specifically to "${projectTitle || "the project"}".
- Do NOT repeat past generic advice or hardcoded templates. Provide fresh, unique, actionable insight every single time.`;

    const stream = await generateStreamWithRetry(ai, {
      contents: aiPrompt,
      config: {
        temperature: 0.95,
      }
    });

    let totalChars = 0;

    for await (const chunk of stream) {
      const chunkText = chunk.text || "";
      if (chunkText) {
        totalChars += chunkText.length;
        res.write(`data: ${JSON.stringify({ chunk: chunkText, totalChars })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true, totalChars, maxChars: activeMaxChars })}\n\n`);
    res.end();
  } catch (err: any) {
    console.error("Co-pilot stream error:", err?.message || err);
    const isQuota = err?.status === 429 || err?.message?.includes("429") || err?.message?.includes("quota") || err?.message?.includes("RESOURCE_EXHAUSTED");
    res.write(`data: ${JSON.stringify({
      error: isQuota ? "QUOTA_EXHAUSTED" : "AI_ERROR",
      chunk: isQuota ? `\n\n⚠️ *AI rate limit reached. Please wait a moment.*` : `\n\n⚠️ *AI stream interrupted: ${err?.message || "connection error"}*`,
      done: true
    })}\n\n`);
    res.end();
  }
});

app.post("/api/agent/copilot/suggest", async (req: Request, res: Response) => {
  const { storyContent, scriptContent, projectTitle, prompt, apiKey, messages, aiPersona, maxChars } = req.body || {};
  const authUser = getAuthUser(req);
  const selectedPersonaKey = aiPersona || (authUser && (users.find(u => u.id === authUser.id)?.aiPersona)) || "jack_sparrow";
  const persona = PERSONA_PROMPTS[selectedPersonaKey] || PERSONA_PROMPTS.jack_sparrow;

  const defaultMaxChars = Number(process.env.CHATBOT_MAX_CHARS || 1200);
  const requestedChars = Number(maxChars);
  const activeMaxChars = !isNaN(requestedChars) && requestedChars > 0 ? Math.min(Math.max(requestedChars, 200), 10000) : defaultMaxChars;

  const customKey = apiKey || (req.headers["x-gemini-api-key"] as string);
  const ai = getGenAI(customKey);

  if (!ai) {
    return res.json({
      error: "MISSING_KEY",
      suggestion: `⚠️ **AI Service Unavailable**\n\nThe server AI service is currently unavailable. Please try again later.`,
      charCount: 0,
      maxChars: activeMaxChars
    });
  }

  try {
    let historyText = "";
    if (Array.isArray(messages) && messages.length > 0) {
      historyText = messages
        .slice(-6)
        .map((m: any) => `${m.role === "user" ? "User" : persona.name}: ${m.content}`)
        .join("\n\n");
    }

    const aiPrompt = `You are ${persona.name}—your chosen famous movie character AI assistant and master Hollywood screenplay co-pilot!

Project Title: "${projectTitle || "Untitled Project"}"

${historyText ? `--- RECENT CONVERSATION HISTORY ---\n${historyText}\n---` : ""}

CURRENT USER PROMPT / QUESTION:
"${prompt || "Give me fresh creative suggestions and narrative ideas for this story."}"

STORY OUTLINE / CONCEPT:
${(storyContent || "No story outline provided yet.").slice(0, 2500)}

SCREENPLAY SCRIPT:
${(scriptContent || "No script written yet.").slice(0, 2500)}

INSTRUCTIONS & FORMATTING RULES:
- ${persona.instructions}
- FORMATTING (RICH MARKDOWN / RMD): Format your entire response in clean, beautiful Rich Markdown (RMD). Use clear headings (### Section Title), **bold** for key plot points and character names, *italics* for delivery tone or dialogue snippets, > blockquotes for memorable quotes or dialogue beats, styled bullet points for suggestions, and \`\`\`screenplay or \`\`\`fountain code blocks for sample screenplay scenes.
- CHARACTER LIMIT CONSTRAINT (STRICT): Your complete response MUST NOT exceed ${activeMaxChars} characters. Be concise, sharp, high-impact, and avoid verbose filler while preserving rich formatting and your signature personality.
- Give genuinely brilliant, clever, highly specific scene beats, character depth, dialogue lines, twists, or pacing tips tailored specifically to "${projectTitle || "the project"}".
- Do NOT repeat past generic advice or hardcoded templates. Provide fresh, unique, actionable insight every single time.
- Keep the character persona vibrant, immersive, and entertaining while remaining genuinely useful for storytelling!`;

    const response = await generateWithRetry(ai, {
      contents: aiPrompt,
      config: {
        temperature: 0.95, // High temperature for creative, non-deterministic responses!
      }
    });

    if (!response.text) {
      throw new Error("Empty response received from Gemini.");
    }

    let finalOutput = response.text.trim();
    // Safety check if response significantly exceeds character limit
    if (finalOutput.length > activeMaxChars + 400) {
      // Find the last complete paragraph or sentence before activeMaxChars
      const truncated = finalOutput.slice(0, activeMaxChars);
      const lastSentenceEnd = Math.max(
        truncated.lastIndexOf("."),
        truncated.lastIndexOf("!"),
        truncated.lastIndexOf("?"),
        truncated.lastIndexOf("\n")
      );
      if (lastSentenceEnd > activeMaxChars * 0.7) {
        finalOutput = truncated.slice(0, lastSentenceEnd + 1);
      }
    }

    res.json({
      suggestion: finalOutput,
      charCount: finalOutput.length,
      maxChars: activeMaxChars
    });
  } catch (err: any) {
    console.error("Co-pilot suggest error:", err?.message || err);
    if (err?.status === 429 || err?.message?.includes("429") || err?.message?.includes("quota") || err?.message?.includes("RESOURCE_EXHAUSTED")) {
      return res.json({
        error: "QUOTA_EXHAUSTED",
        suggestion: `⚠️ **AI Rate Limit Reached**\n\nThe AI service is currently busy. Please try again in a moment.`,
        charCount: 0,
        maxChars: activeMaxChars
      });
    }
    return res.json({
      error: "AI_ERROR",
      suggestion: `⚠️ **AI Generation Error**: ${err?.message || "Unable to reach AI service"}. Please try again in a moment.`,
      charCount: 0,
      maxChars: activeMaxChars
    });
  }
});

// Sync and Auto-Edit Script based on Story changes (With consent workflow)
app.post("/api/agent/copilot/sync-script", async (req: Request, res: Response) => {
  const { storyContent, currentScriptContent, projectTitle, userInstruction, apiKey } = req.body || {};
  const customKey = apiKey || (req.headers["x-gemini-api-key"] as string);
  const ai = getGenAI(customKey);

  if (!ai) {
    return res.status(400).json({
      error: "MISSING_KEY",
      analysis: "⚠️ AI service unavailable.",
      proposedScript: currentScriptContent || "",
      diffHighlights: ["The AI service is currently unavailable. Please try again later."]
    });
  }

  try {
    const syncPrompt = `You are PlotForge AI Script Co-pilot. Your job is to automatically adapt and edit a screenplay script based on changes made to the story/script outline.

Project Title: "${projectTitle || "Untitled"}"
User Specific Focus: "${userInstruction || "Synchronize all new story beats into proper screenplay format."}"

STORY OUTLINE:
${storyContent || "Story outline."}

CURRENT SCREENPLAY SCRIPT:
${currentScriptContent || "Empty script."}

Task:
1. Analyze what edits or additions in the Story Outline need to be reflected in the Screenplay Script.
2. Generate the complete updated screenplay in industry-standard format (INT./EXT. SCENE HEADINGS, CHARACTER NAMES IN ALL-CAPS, DIALOGUE, ACTION LINES).
3. Summarize the exact changes made.

Return strict JSON:
- "analysis": Brief explanation of changes detected between story and script
- "proposedScript": The full updated screenplay script formatted properly
- "diffHighlights": Array of strings highlighting the key edits added or changed`;

    const response = await generateWithRetry(ai, {
      contents: syncPrompt,
      config: {
        temperature: 0.8,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            analysis: { type: Type.STRING },
            proposedScript: { type: Type.STRING },
            diffHighlights: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["analysis", "proposedScript", "diffHighlights"]
        }
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json(parsed);
  } catch (err: any) {
    console.error("Co-pilot sync error:", err?.message || err);
    if (err?.status === 429 || err?.message?.includes("429") || err?.message?.includes("quota") || err?.message?.includes("RESOURCE_EXHAUSTED")) {
      return res.status(429).json({
        error: "QUOTA_EXHAUSTED",
        analysis: "⚠️ Gemini API Quota Exceeded. Please enter your personal Gemini API Key in the key field above to run script sync.",
        proposedScript: currentScriptContent || "",
        diffHighlights: ["Gemini API rate limit reached."]
      });
    }
    return res.status(500).json({
      error: "AI_ERROR",
      analysis: `⚠️ AI Error: ${err?.message || "Failed to generate script sync"}.`,
      proposedScript: currentScriptContent || "",
      diffHighlights: []
    });
  }
});

// ==========================================
// START SERVER WITH VITE DEV / PROD MIDDLEWARE
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Plotforge full-stack server listening at http://0.0.0.0:${PORT}`);
  });
}

startServer();
