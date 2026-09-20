import { Router, Request, Response } from "express";
import crypto from "crypto";
import {
  projects,
  contents,
  collaborators,
  nextProjectId,
  queuePersistence,
  shareTokens,
  versionHistories,
  projectRelations
} from "../data/store.js";
import { requireAuth, getAuthUser, isOwner } from "../middleware/auth.js";
import { generateProjectPdf } from "../services/pdfService.js";
import { Project } from "../types/index.js";

export const projectRouter = Router();

// ==========================================
// 1. GET ALL ACCESSIBLE PROJECTS
// ==========================================
projectRouter.get("/", (req: Request, res: Response) => {
  const authUser = getAuthUser(req);
  const platformOwner = isOwner(authUser);

  if (!authUser) {
    // Unauthenticated: Only return public projects
    return res.json(projects.filter(p => p.isPublic !== false));
  }

  if (platformOwner) {
    // Platform owner can inspect all projects
    return res.json(projects);
  }

  // Author or collaborator
  const userCollabProjectIds = new Set<number>();
  for (const [projIdStr, collabs] of Object.entries(collaborators)) {
    if (collabs.some(c => (c.userId && c.userId === authUser.id) || (c.username && c.username.toLowerCase() === authUser.username.toLowerCase()))) {
      userCollabProjectIds.add(Number(projIdStr));
    }
  }

  const accessible = projects.filter(p => {
    if (p.isPublic !== false) return true;
    if (p.authorId === authUser.id) return true;
    if (p.authorUsername.toLowerCase() === authUser.username.toLowerCase()) return true;
    if (userCollabProjectIds.has(p.id)) return true;
    return false;
  });

  res.json(accessible);
});

// Public projects endpoint (MUST come before /:id)
projectRouter.get("/public", (req: Request, res: Response) => {
  res.json(projects.filter(p => p.isPublic !== false));
});

// ==========================================
// 2. GET SINGLE PROJECT BY ID
// ==========================================
projectRouter.get("/:id", (req: Request, res: Response) => {
  const projectId = parseInt(req.params.id, 10);
  const project = projects.find(p => p.id === projectId);

  if (!project) {
    return res.status(404).json({ message: "Project not found." });
  }

  // Access check for private projects
  if (project.isPublic === false) {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return res.status(401).json({ message: "This project is private. Please sign in to view." });
    }

    const isAuthor = project.authorId === authUser.id || project.authorUsername.toLowerCase() === authUser.username.toLowerCase();
    const isCollab = (collaborators[projectId] || []).some(
      c => (c.userId && c.userId === authUser.id) || (c.username && c.username.toLowerCase() === authUser.username.toLowerCase())
    );

    if (!isAuthor && !isCollab && !isOwner(authUser)) {
      return res.status(403).json({ message: "Access forbidden: You are not authorized to view this private project." });
    }
  }

  res.json(project);
});

// ==========================================
// 3. CREATE NEW PROJECT (Requires Auth)
// ==========================================
projectRouter.post("/", requireAuth, (req: Request, res: Response) => {
  const authUser = req.user!;
  const { title, description, logline, genre, type, isPublic, coverImage, tags } = req.body;

  if (!title || typeof title !== "string" || !title.trim()) {
    return res.status(400).json({ message: "Project title is required." });
  }

  const newProject: Project = {
    id: nextProjectId(),
    title: title.trim(),
    description: (description || "").trim(),
    logline: (logline || "").trim(),
    genre: genre || "Drama",
    type: type === "SCRIPT" ? "SCRIPT" : type === "SERIES" ? "SERIES" : "STORY",
    status: "DRAFT",
    authorId: authUser.id,
    authorUsername: authUser.username,
    authorEmail: authUser.email,
    isPublic: isPublic !== false,
    coverImage: coverImage || "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=600&auto=format&fit=crop&q=80",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: Array.isArray(tags) ? tags : []
  };

  projects.push(newProject);

  // Initialize content
  contents[newProject.id] = {
    projectId: newProject.id,
    storyContent: "",
    scriptContent: newProject.type === "SCRIPT" ? "FADE IN:\n\nEXT. SCENE - DAY\n\n" : "",
    syncedAt: new Date().toISOString(),
    lastEditedBy: authUser.username,
    version: 1
  };

  queuePersistence();
  res.status(201).json(newProject);
});

// ==========================================
// 4. UPDATE PROJECT (Requires Auth & Permission)
// ==========================================
projectRouter.put("/:id", requireAuth, (req: Request, res: Response) => {
  const authUser = req.user!;
  const projectId = parseInt(req.params.id, 10);
  const project = projects.find(p => p.id === projectId);

  if (!project) {
    return res.status(404).json({ message: "Project not found." });
  }

  const isAuthor = project.authorId === authUser.id || project.authorUsername.toLowerCase() === authUser.username.toLowerCase();
  const isCollab = (collaborators[projectId] || []).some(
    c => ((c.userId && c.userId === authUser.id) || (c.username && c.username.toLowerCase() === authUser.username.toLowerCase())) && c.role === "EDITOR"
  );

  if (!isAuthor && !isCollab && !isOwner(authUser)) {
    return res.status(403).json({ message: "Forbidden: You do not have permission to edit this project metadata." });
  }

  const { title, description, logline, genre, type, status, isPublic, coverImage, tags } = req.body;

  if (title) project.title = title.trim();
  if (description !== undefined) project.description = description;
  if (logline !== undefined) project.logline = logline;
  if (genre) project.genre = genre;
  if (type) project.type = type;
  if (status) project.status = status;
  if (isPublic !== undefined) project.isPublic = Boolean(isPublic);
  if (coverImage) project.coverImage = coverImage;
  if (Array.isArray(tags)) project.tags = tags;
  project.updatedAt = new Date().toISOString();

  queuePersistence();
  res.json(project);
});

// ==========================================
// 5. DELETE PROJECT (Strict Authorization)
// ==========================================
projectRouter.delete("/:id", requireAuth, (req: Request, res: Response) => {
  const authUser = req.user!;
  const projectId = parseInt(req.params.id, 10);
  const index = projects.findIndex(p => p.id === projectId);

  if (index === -1) {
    return res.status(404).json({ message: "Project not found." });
  }

  const project = projects[index];
  const isAuthor = project.authorId === authUser.id || project.authorUsername.toLowerCase() === authUser.username.toLowerCase();

  // ONLY the author or platform owner can delete a project! (NO anonymous deletion bypass)
  if (!isAuthor && !isOwner(authUser)) {
    return res.status(403).json({ message: "Forbidden: Only the original author or platform administrator can delete this project." });
  }

  projects.splice(index, 1);
  delete contents[projectId];
  delete collaborators[projectId];
  delete versionHistories[projectId];

  queuePersistence();
  res.status(204).send();
});

// ==========================================
// 6. CRYPTOGRAPHIC SHARE TOKEN GENERATION
// ==========================================
projectRouter.get("/:id/share-link", requireAuth, (req: Request, res: Response) => {
  const projectId = parseInt(req.params.id, 10);
  const project = projects.find(p => p.id === projectId);

  if (!project) {
    return res.status(404).json({ message: "Project not found." });
  }

  // Generate 64-character unguessable cryptographic token
  const token = crypto.randomBytes(32).toString("hex");
  shareTokens.set(token, {
    projectId,
    token,
    createdAt: new Date().toISOString(),
    permission: "VIEW"
  });

  const host = req.get("host") || "localhost:3000";
  const protocol = req.protocol === "https" || req.headers["x-forwarded-proto"] === "https" ? "https" : "http";
  const shareUrl = `${protocol}://${host}/shared/${token}`;

  res.json({
    link: shareUrl,
    shareToken: token,
    projectId
  });
});

projectRouter.get("/shared/:token", (req: Request, res: Response) => {
  const { token } = req.params;
  const tokenData = shareTokens.get(token);

  if (!tokenData) {
    return res.status(404).json({ message: "Invalid or expired share link." });
  }

  const project = projects.find(p => p.id === tokenData.projectId);
  if (!project) {
    return res.status(404).json({ message: "Shared project no longer exists." });
  }

  const content = contents[project.id] || { projectId: project.id, storyContent: "", scriptContent: "" };

  res.json({
    project,
    content,
    permission: tokenData.permission
  });
});

// ==========================================
// 7. REAL PDF EXPORT (PDFKit Engine)
// ==========================================
projectRouter.get("/:id/export/pdf", (req: Request, res: Response) => {
  const projectId = parseInt(req.params.id, 10);
  const project = projects.find(p => p.id === projectId);

  if (!project) {
    return res.status(404).json({ message: "Project not found." });
  }

  const content = contents[projectId] || {
    projectId,
    storyContent: "",
    scriptContent: ""
  };

  generateProjectPdf(project, content, res);
});

// ==========================================
// 8. TEXT EXPORT
// ==========================================
projectRouter.get("/:id/export/txt", (req: Request, res: Response) => {
  const projectId = parseInt(req.params.id, 10);
  const project = projects.find(p => p.id === projectId);

  if (!project) {
    return res.status(404).json({ message: "Project not found." });
  }

  const content = contents[projectId] || { projectId, storyContent: "", scriptContent: "" };
  const title = project.title || "Screenplay";
  const bodyText = project.type === "SCRIPT" ? (content.scriptContent || "") : (content.storyContent || "");

  const fullText = `=== ${title.toUpperCase()} ===\nWritten by: ${project.authorUsername}\nLogline: ${project.logline || "N/A"}\nGenre: ${project.genre || "N/A"}\n\n${bodyText}`;

  const safeTitle = title.replace(/[^a-zA-Z0-9_\-]/g, "_");
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${safeTitle}.txt"`);
  res.send(fullText);
});

// ==========================================
// 9. PROJECT RELATIONS & VISIBILITY
// ==========================================
projectRouter.put("/:id/visibility", requireAuth, (req: Request, res: Response) => {
  const authUser = req.user!;
  const projectId = parseInt(req.params.id, 10);
  const project = projects.find(p => p.id === projectId);

  if (!project) return res.status(404).json({ message: "Project not found." });

  const isAuthor = project.authorId === authUser.id || project.authorUsername.toLowerCase() === authUser.username.toLowerCase();
  if (!isAuthor && !isOwner(authUser)) {
    return res.status(403).json({ message: "Only the project author can change project visibility." });
  }

  const { isPublic } = req.body;
  if (isPublic !== undefined) {
    project.isPublic = Boolean(isPublic);
    project.updatedAt = new Date().toISOString();
    queuePersistence();
  }

  res.json(project);
});

projectRouter.get("/:id/relations", (req: Request, res: Response) => {
  const projectId = parseInt(req.params.id, 10);
  res.json(projectRelations[projectId] || []);
});

projectRouter.post("/:id/link", requireAuth, (req: Request, res: Response) => {
  const projectId = parseInt(req.params.id, 10);
  const { relatedProjectId, relationType } = req.body;
  const relId = parseInt(relatedProjectId, 10);

  if (!projectRelations[projectId]) projectRelations[projectId] = [];
  projectRelations[projectId].push({ relatedProjectId: relId, relationType: relationType || "ADAPTATION", linkedAt: new Date().toISOString() });
  res.json({ message: "Projects linked successfully", relations: projectRelations[projectId] });
});

projectRouter.post("/:id/link-story/:storyId", requireAuth, (req: Request, res: Response) => {
  const scriptId = parseInt(req.params.id, 10);
  const storyId = parseInt(req.params.storyId, 10);

  if (!projectRelations[scriptId]) projectRelations[scriptId] = [];
  projectRelations[scriptId].push({ relatedProjectId: storyId, relationType: "STORY_SOURCE", linkedAt: new Date().toISOString() });
  res.json({ message: "Story linked to script successfully" });
});

