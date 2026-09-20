export type UserRole = "OWNER" | "ADMIN" | "WRITER" | "COLLABORATOR" | "READER";

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  isOwner?: boolean;
}

export interface User {
  id: number;
  username: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  bio?: string;
  profileImage?: string;
  theme?: string;
  themePreset?: string;
  colorAccent?: string;
  aiPersona?: string;
  googleAuth?: boolean;
  createdAt: string;
}

export interface Project {
  id: number;
  title: string;
  description?: string;
  logline?: string;
  genre?: string;
  type: "STORY" | "SCRIPT" | "SERIES";
  status?: "DRAFT" | "IN_PROGRESS" | "REVIEW" | "COMPLETED";
  authorId: number;
  authorUsername: string;
  authorEmail?: string;
  isPublic: boolean;
  coverImage?: string;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  shareToken?: string;
}

export interface ProjectContent {
  projectId: number;
  storyContent: string;
  scriptContent: string;
  syncedAt?: string;
  lastEditedBy?: string;
  version?: number;
}

export interface VersionHistoryEntry {
  id: string;
  projectId: number;
  versionNumber: number;
  timestamp: string;
  authorUsername: string;
  storyContent: string;
  scriptContent: string;
  summary: string;
}

export interface Collaborator {
  id: number;
  projectId: number;
  userId?: number;
  username: string;
  email?: string;
  role: "EDITOR" | "COMMENTER" | "VIEWER";
  status: "ACTIVE" | "PENDING";
  addedAt: string;
}

export interface Invitation {
  id: number;
  projectId: number;
  projectTitle: string;
  inviterUsername: string;
  targetUsernameOrEmail: string;
  role: "EDITOR" | "COMMENTER" | "VIEWER";
  status: "PENDING" | "ACCEPTED" | "DECLINED";
  createdAt: string;
}

export interface ProjectComment {
  id: number;
  projectId: number;
  authorId?: number;
  authorUsername: string;
  authorEmail?: string;
  authorAvatar?: string;
  content: string;
  sectionType?: "STORY" | "SCRIPT" | "GENERAL";
  createdAt: string;
}

export interface Review {
  id: number;
  author: string;
  authorUsername?: string;
  authorEmail?: string;
  authorImage?: string;
  movieTitle: string;
  rating: number;
  content: string;
  genre?: string;
  likes: number;
  createdAt: string;
}

export interface FanPost {
  id: number;
  title: string;
  author: string;
  authorUsername?: string;
  authorEmail?: string;
  authorImage?: string;
  franchise: string;
  category: string;
  synopsis: string;
  cast?: string;
  upvotes: number;
  tags?: string[];
  createdAt: string;
}

export interface FanConcept {
  id: number;
  title: string;
  author: string;
  authorUsername?: string;
  authorEmail?: string;
  authorImage?: string;
  universe: string;
  type: string;
  description: string;
  upvotes: number;
  createdAt: string;
}

export interface ShareTokenData {
  projectId: number;
  token: string;
  createdAt: string;
  expiresAt?: string;
  permission: "VIEW" | "COMMENT";
}
