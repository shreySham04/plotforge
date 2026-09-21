import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import {
  User,
  Project,
  ProjectContent,
  Collaborator,
  Invitation,
  ProjectComment,
  Review,
  FanPost,
  FanConcept,
  VersionHistoryEntry,
  ShareTokenData
} from "../types/index.js";

const DATA_DIR = path.join(process.cwd(), "data");
const USERS_FILE = path.join(DATA_DIR, "users_db.json");
const PROJECTS_FILE = path.join(DATA_DIR, "projects_db.json");
const CONTENTS_FILE = path.join(DATA_DIR, "contents_db.json");
const COLLABORATORS_FILE = path.join(DATA_DIR, "collaborators_db.json");
const INVITATIONS_FILE = path.join(DATA_DIR, "invitations_db.json");
const COMMENTS_FILE = path.join(DATA_DIR, "comments_db.json");

// Auto-increment ID counters
let userIdCounter = 100;
let projectIdCounter = 20;
let commentIdCounter = 100;
let invitationIdCounter = 100;
let reviewIdCounter = 100;
let fanPostIdCounter = 100;
let fanConceptIdCounter = 100;

// In-memory typed collections
export const users: User[] = [
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
    role: "WRITER",
    bio: "Fantasy novelist weaving epic tales of mystery and wonder.",
    profileImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    createdAt: new Date().toISOString()
  }
];

// Bootstrap the platform owner strictly from environment variables without hardcoded credentials
export function bootstrapOwnerFromEnv() {
  const envOwnerEmail = (process.env.OWNER_EMAIL || "").trim().toLowerCase();
  if (!envOwnerEmail) return;

  const existing = users.find(u => u.email && u.email.toLowerCase() === envOwnerEmail);
  const ownerPassword = process.env.OWNER_PASSWORD?.trim();
  const passwordHash = ownerPassword ? bcrypt.hashSync(ownerPassword, 10) : "";

  if (existing) {
    existing.role = "OWNER";
    if (ownerPassword) {
      existing.passwordHash = passwordHash;
    }
  } else {
    const ownerUsername =
      process.env.OWNER_USERNAME?.trim() ||
      envOwnerEmail.split("@")[0].replace(/[^a-z0-9_]/gi, "") ||
      "admin";
    users.push({
      id: nextUserId(),
      username: ownerUsername,
      email: envOwnerEmail,
      passwordHash,
      role: "OWNER",
      bio: "Platform Owner & Super Administrator",
      profileImage: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(ownerUsername)}`,
      createdAt: new Date().toISOString()
    });
  }
}

// Initial bootstrap check
bootstrapOwnerFromEnv();

export const projects: Project[] = [
  {
    id: 1,
    title: "Echoes of Orion",
    description: "In the deep void of space, a rogue cartographer intercepts a distress beacon from a spacecraft that vanished 70 years ago.",
    logline: "A deep-space surveyor discovers an ancient ghost ship transmitting coordinates to an impossible star system.",
    genre: "Sci-Fi Thriller",
    type: "SCRIPT",
    status: "IN_PROGRESS",
    authorId: 1,
    authorUsername: "writer1",
    authorEmail: "writer1@example.com",
    isPublic: true,
    coverImage: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=600&auto=format&fit=crop&q=80",
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date().toISOString(),
    tags: ["Space", "Mystery", "Hard Sci-Fi"]
  },
  {
    id: 2,
    title: "The Clockwork Kingdom",
    description: "An apprentice horologist uncovers a mechanism buried beneath the royal citadel that ticks backwards.",
    logline: "When time begins flowing in reverse inside the capital, an outlaw clockmaker must rewrite history before the clock strikes zero.",
    genre: "Steampunk Fantasy",
    type: "STORY",
    status: "DRAFT",
    authorId: 2,
    authorUsername: "storyteller",
    authorEmail: "storyteller@example.com",
    isPublic: true,
    coverImage: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80",
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    updatedAt: new Date().toISOString(),
    tags: ["Steampunk", "Time Travel", "Adventure"]
  }
];

export const contents: Record<number, ProjectContent> = {
  1: {
    projectId: 1,
    storyContent: "Kael stood before the navigation array. The static frequency had resolved into three distinct pulses.",
    scriptContent: `FADE IN:

EXT. DEEP SPACE - THE ORION VEIL - CONTINUOUS

An endless ocean of blackness dotted with silver dust. Floating in silent exile is the ASTRALIS-7, a battered salvage frigate.

INT. ASTRALIS-7 - FLIGHT DECK - CONTINUOUS

KAEL (30s), haggard eyes, stained flight jacket, taps a recalcitrant CRT monitor with the butt of a screwdriver.

KAEL
(whispering)
Come on, old girl. Talk to me.

STATIC clears. A clear, rhythmic chime echoes through the cockpit. Three pulses.

KAEL (CONT'D)
That's not navigational radar. That's a transponder.

He leans forward. Coordinates flicker across the HUD: SOL-SECTOR 09.

KAEL (CONT'D)
The Prometheus. It's been missing since the First Migration.`,
    syncedAt: new Date().toISOString(),
    lastEditedBy: "writer1",
    version: 1
  },
  2: {
    projectId: 2,
    storyContent: "The master gear beneath the Grand Spire turned with a sound like grinding mountains. Vane touched the bronze teeth and felt the vibration pulling him into yesterday.",
    scriptContent: "",
    syncedAt: new Date().toISOString(),
    lastEditedBy: "storyteller",
    version: 1
  }
};

export const collaborators: Record<number, Collaborator[]> = {};
export const invitations: Invitation[] = [];
export const comments: ProjectComment[] = [];
export const reviews: Review[] = [];
export const fanPosts: FanPost[] = [];
export const fanConcepts: FanConcept[] = [];
export const versionHistories: Record<number, VersionHistoryEntry[]> = {};
export const projectRelations: Record<number, any> = {};

// Cryptographic share tokens map
export const shareTokens = new Map<string, ShareTokenData>();

// Password reset tokens map: token -> { userId, expiresAt }
export const passwordResetTokens = new Map<string, { userId: number; expiresAt: number }>();

// Ensure data directory exists
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// Debounced async flush queue
const saveQueue: Record<string, boolean> = {};
let saveTimeout: NodeJS.Timeout | null = null;

export function queuePersistence() {
  saveQueue.users = true;
  saveQueue.projects = true;
  saveQueue.contents = true;
  saveQueue.collaborators = true;
  saveQueue.invitations = true;
  saveQueue.comments = true;

  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(flushPersistenceQueue, 300);
}

async function flushPersistenceQueue() {
  ensureDataDir();
  try {
    if (saveQueue.users) {
      await fs.promises.writeFile(USERS_FILE, JSON.stringify(users, null, 2), "utf8");
      saveQueue.users = false;
    }
    if (saveQueue.projects) {
      await fs.promises.writeFile(PROJECTS_FILE, JSON.stringify(projects, null, 2), "utf8");
      saveQueue.projects = false;
    }
    if (saveQueue.contents) {
      await fs.promises.writeFile(CONTENTS_FILE, JSON.stringify(contents, null, 2), "utf8");
      saveQueue.contents = false;
    }
    if (saveQueue.collaborators) {
      await fs.promises.writeFile(COLLABORATORS_FILE, JSON.stringify(collaborators, null, 2), "utf8");
      saveQueue.collaborators = false;
    }
    if (saveQueue.invitations) {
      await fs.promises.writeFile(INVITATIONS_FILE, JSON.stringify(invitations, null, 2), "utf8");
      saveQueue.invitations = false;
    }
    if (saveQueue.comments) {
      await fs.promises.writeFile(COMMENTS_FILE, JSON.stringify(comments, null, 2), "utf8");
      saveQueue.comments = false;
    }
  } catch (err: any) {
    console.warn("Notice: Local persistence write:", err?.message);
  }
}

// Load initial records on startup
export function loadStoreFromDisk() {
  try {
    ensureDataDir();
    if (fs.existsSync(USERS_FILE)) {
      const loadedUsers = JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
      if (Array.isArray(loadedUsers) && loadedUsers.length > 0) {
        users.length = 0;
        users.push(...loadedUsers);
        for (const u of loadedUsers) {
          if (u.id >= userIdCounter) userIdCounter = u.id + 1;
        }
      }
    }
    if (fs.existsSync(PROJECTS_FILE)) {
      const loadedProjects = JSON.parse(fs.readFileSync(PROJECTS_FILE, "utf8"));
      if (Array.isArray(loadedProjects) && loadedProjects.length > 0) {
        projects.length = 0;
        projects.push(...loadedProjects);
        for (const p of loadedProjects) {
          if (p.id >= projectIdCounter) projectIdCounter = p.id + 1;
        }
      }
    }
    if (fs.existsSync(CONTENTS_FILE)) {
      const loadedContents = JSON.parse(fs.readFileSync(CONTENTS_FILE, "utf8"));
      if (loadedContents && typeof loadedContents === "object") {
        Object.assign(contents, loadedContents);
      }
    }
    if (fs.existsSync(COLLABORATORS_FILE)) {
      const loadedCollabs = JSON.parse(fs.readFileSync(COLLABORATORS_FILE, "utf8"));
      if (loadedCollabs && typeof loadedCollabs === "object") {
        Object.assign(collaborators, loadedCollabs);
      }
    }
    if (fs.existsSync(INVITATIONS_FILE)) {
      const loadedInvs = JSON.parse(fs.readFileSync(INVITATIONS_FILE, "utf8"));
      if (Array.isArray(loadedInvs)) {
        invitations.length = 0;
        invitations.push(...loadedInvs);
        for (const inv of loadedInvs) {
          if (inv.id >= invitationIdCounter) invitationIdCounter = inv.id + 1;
        }
      }
    }
    if (fs.existsSync(COMMENTS_FILE)) {
      const loadedComments = JSON.parse(fs.readFileSync(COMMENTS_FILE, "utf8"));
      if (Array.isArray(loadedComments)) {
        comments.length = 0;
        comments.push(...loadedComments);
      }
    }

    // Re-verify owner bootstrapping post-disk load
    bootstrapOwnerFromEnv();
  } catch (err: any) {
    console.warn("Notice: Initial store load:", err?.message);
  }
}

// Generate unique IDs
export const nextUserId = () => userIdCounter++;
export const nextProjectId = () => projectIdCounter++;
export const nextCommentId = () => commentIdCounter++;
export const nextInvitationId = () => invitationIdCounter++;
export const nextReviewId = () => reviewIdCounter++;
export const nextFanPostId = () => fanPostIdCounter++;
export const nextFanConceptId = () => fanConceptIdCounter++;
