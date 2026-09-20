import { Router, Request, Response } from "express";
import {
  projects,
  contents,
  collaborators,
  versionHistories,
  queuePersistence
} from "../data/store.js";
import { requireAuth, getAuthUser, isOwner } from "../middleware/auth.js";
import { evaluateProjectAccess } from "../services/accessControl.js";
import { VersionHistoryEntry } from "../types/index.js";

export const contentRouter = Router();

// ==========================================
// 1. GET PROJECT CONTENT
// ==========================================
contentRouter.get("/:projectId", (req: Request, res: Response) => {
  const projectId = parseInt(req.params.projectId, 10);
  const project = projects.find(p => p.id === projectId);

  if (!project) {
    return res.status(404).json({ message: "Project not found." });
  }

  // Authoritative access check (supports private projects & share tokens)
  const access = evaluateProjectAccess(project, req);
  if (!access.allowed) {
    return res.status(access.statusCode).json({ message: access.reason });
  }

  const content = contents[projectId] || {
    projectId,
    storyContent: "",
    scriptContent: "",
    version: 1
  };

  res.json(content);
});

// ==========================================
// 2. UPDATE PROJECT CONTENT (Authorized)
// ==========================================
contentRouter.put("/:projectId", requireAuth, (req: Request, res: Response) => {
  const authUser = req.user!;
  const projectId = parseInt(req.params.projectId, 10);
  const project = projects.find(p => p.id === projectId);

  if (!project) {
    return res.status(404).json({ message: "Project not found." });
  }

  const isAuthor = project.authorId === authUser.id || project.authorUsername.toLowerCase() === authUser.username.toLowerCase();
  const isCollabEditor = (collaborators[projectId] || []).some(
    c => ((c.userId && c.userId === authUser.id) || (c.username && c.username.toLowerCase() === authUser.username.toLowerCase())) && c.role === "EDITOR"
  );

  if (!isAuthor && !isCollabEditor && !isOwner(authUser)) {
    return res.status(403).json({ message: "Forbidden: You do not have write access to edit this screenplay/story." });
  }

  const { storyContent, scriptContent, summary } = req.body;

  if (!contents[projectId]) {
    contents[projectId] = {
      projectId,
      storyContent: "",
      scriptContent: "",
      version: 0
    };
  }

  const current = contents[projectId];
  const newStory = storyContent !== undefined ? storyContent : current.storyContent;
  const newScript = scriptContent !== undefined ? scriptContent : current.scriptContent;
  const newVersion = (current.version || 1) + 1;

  contents[projectId] = {
    projectId,
    storyContent: newStory,
    scriptContent: newScript,
    syncedAt: new Date().toISOString(),
    lastEditedBy: authUser.username,
    version: newVersion
  };

  // Record version history snapshot
  if (!versionHistories[projectId]) {
    versionHistories[projectId] = [];
  }

  const historyEntry: VersionHistoryEntry = {
    id: `v-${projectId}-${newVersion}-${Date.now()}`,
    projectId,
    versionNumber: newVersion,
    timestamp: new Date().toISOString(),
    authorUsername: authUser.username,
    storyContent: newStory,
    scriptContent: newScript,
    summary: summary || `Saved revision v${newVersion} by ${authUser.username}`
  };

  versionHistories[projectId].unshift(historyEntry);
  if (versionHistories[projectId].length > 50) {
    versionHistories[projectId].pop();
  }

  project.updatedAt = new Date().toISOString();
  queuePersistence();

  res.json(contents[projectId]);
});

// ==========================================
// 3. VERSION HISTORY RESTORE
// ==========================================
contentRouter.get("/:projectId/history", (req: Request, res: Response) => {
  const projectId = parseInt(req.params.projectId, 10);
  const history = versionHistories[projectId] || [];
  res.json({ content: history, totalElements: history.length, totalPages: 1 });
});

contentRouter.post("/:projectId/history/:versionId/restore", requireAuth, (req: Request, res: Response) => {
  const authUser = req.user!;
  const projectId = parseInt(req.params.projectId, 10);
  const { versionId } = req.params;

  const project = projects.find(p => p.id === projectId);
  if (!project) return res.status(404).json({ message: "Project not found." });

  const isAuthor = project.authorId === authUser.id || project.authorUsername.toLowerCase() === authUser.username.toLowerCase();
  if (!isAuthor && !isOwner(authUser)) {
    return res.status(403).json({ message: "Forbidden: Only authors can restore previous versions." });
  }

  const history = versionHistories[projectId] || [];
  const entry = history.find(h => h.id === versionId || String(h.versionNumber) === versionId);

  if (!entry) {
    return res.status(404).json({ message: "Version snapshot not found." });
  }

  contents[projectId] = {
    projectId,
    storyContent: entry.storyContent,
    scriptContent: entry.scriptContent,
    syncedAt: new Date().toISOString(),
    lastEditedBy: `${authUser.username} (Restored v${entry.versionNumber})`,
    version: ((contents[projectId]?.version) || 1) + 1
  };

  queuePersistence();
  res.json({ message: `Successfully restored version ${entry.versionNumber}`, content: contents[projectId] });
});
