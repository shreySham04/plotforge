import { Router, Request, Response } from "express";
import {
  projects,
  collaborators,
  invitations,
  comments,
  users,
  nextInvitationId,
  nextCommentId,
  queuePersistence
} from "../data/store.js";
import { requireAuth, getAuthUser, isOwner } from "../middleware/auth.js";
import { Invitation, Collaborator, ProjectComment } from "../types/index.js";

export const collaborationRouter = Router();

// ==========================================
// 1. INVITATIONS
// ==========================================
collaborationRouter.post("/invitations", requireAuth, (req: Request, res: Response) => {
  const authUser = req.user!;
  const { projectId, targetUsernameOrEmail, role } = req.body;

  const projId = parseInt(projectId, 10);
  const project = projects.find(p => p.id === projId);

  if (!project) {
    return res.status(404).json({ message: "Project not found." });
  }

  const isAuthor = project.authorId === authUser.id || project.authorUsername.toLowerCase() === authUser.username.toLowerCase();
  if (!isAuthor && !isOwner(authUser)) {
    return res.status(403).json({ message: "Only the project author can send collaboration invitations." });
  }

  const cleanTarget = (targetUsernameOrEmail || "").trim().toLowerCase();
  if (!cleanTarget) {
    return res.status(400).json({ message: "Target username or email is required." });
  }

  const newInvite: Invitation = {
    id: nextInvitationId(),
    projectId: projId,
    projectTitle: project.title,
    inviterUsername: authUser.username,
    targetUsernameOrEmail: cleanTarget,
    role: role === "VIEWER" ? "VIEWER" : role === "COMMENTER" ? "COMMENTER" : "EDITOR",
    status: "PENDING",
    createdAt: new Date().toISOString()
  };

  invitations.push(newInvite);
  queuePersistence();

  res.status(201).json({ message: `Invitation sent to ${cleanTarget}`, invitation: newInvite });
});

collaborationRouter.get("/invitations/my", requireAuth, (req: Request, res: Response) => {
  const authUser = req.user!;
  const usernameLower = authUser.username.toLowerCase();
  const emailLower = authUser.email.toLowerCase();

  const myInvites = invitations.filter(inv => {
    const target = inv.targetUsernameOrEmail.toLowerCase();
    return (target === usernameLower || target === emailLower) && inv.status === "PENDING";
  });

  res.json(myInvites);
});

collaborationRouter.post("/invitations/:id/accept", requireAuth, (req: Request, res: Response) => {
  const authUser = req.user!;
  const inviteId = parseInt(req.params.id, 10);
  const invite = invitations.find(i => i.id === inviteId);

  if (!invite) {
    return res.status(404).json({ message: "Invitation not found." });
  }

  const usernameLower = authUser.username.toLowerCase();
  const emailLower = authUser.email.toLowerCase();
  const target = invite.targetUsernameOrEmail.toLowerCase();

  if (target !== usernameLower && target !== emailLower && !isOwner(authUser)) {
    return res.status(403).json({ message: "This invitation is not addressed to your account." });
  }

  invite.status = "ACCEPTED";

  if (!collaborators[invite.projectId]) {
    collaborators[invite.projectId] = [];
  }

  const existingCollab = collaborators[invite.projectId].find(c => c.userId === authUser.id || c.username.toLowerCase() === usernameLower);
  if (!existingCollab) {
    const newCollab: Collaborator = {
      id: Date.now(),
      projectId: invite.projectId,
      userId: authUser.id,
      username: authUser.username,
      email: authUser.email,
      role: invite.role,
      status: "ACTIVE",
      addedAt: new Date().toISOString()
    };
    collaborators[invite.projectId].push(newCollab);
  }

  queuePersistence();
  res.json({ message: "Invitation accepted! You are now a collaborator on this project.", invite });
});

collaborationRouter.post("/invitations/:id/decline", requireAuth, (req: Request, res: Response) => {
  const authUser = req.user!;
  const inviteId = parseInt(req.params.id, 10);
  const invite = invitations.find(i => i.id === inviteId);

  if (!invite) {
    return res.status(404).json({ message: "Invitation not found." });
  }

  invite.status = "DECLINED";
  queuePersistence();
  res.json({ message: "Invitation declined.", invite });
});

// Alias for respond with { accept: boolean }
collaborationRouter.post("/invitations/:id/respond", requireAuth, (req: Request, res: Response) => {
  const authUser = req.user!;
  const inviteId = parseInt(req.params.id, 10);
  const invite = invitations.find(i => i.id === inviteId);

  if (!invite) return res.status(404).json({ message: "Invitation not found." });

  const { accept } = req.body;
  if (accept) {
    invite.status = "ACCEPTED";
    if (!collaborators[invite.projectId]) collaborators[invite.projectId] = [];
    const usernameLower = authUser.username.toLowerCase();
    const existing = collaborators[invite.projectId].find(c => c.userId === authUser.id || c.username.toLowerCase() === usernameLower);
    if (!existing) {
      collaborators[invite.projectId].push({
        id: Date.now(),
        projectId: invite.projectId,
        userId: authUser.id,
        username: authUser.username,
        email: authUser.email,
        role: invite.role,
        status: "ACTIVE",
        addedAt: new Date().toISOString()
      });
    }
    queuePersistence();
    return res.json({ message: "Invitation accepted", status: "ACCEPTED" });
  } else {
    invite.status = "DECLINED";
    queuePersistence();
    return res.json({ message: "Invitation declined", status: "DECLINED" });
  }
});

// ==========================================
// 2. PROJECT COLLABORATORS
// ==========================================
collaborationRouter.get("/projects/:projectId/collaborators", (req: Request, res: Response) => {
  const projId = parseInt(req.params.projectId, 10);
  const list = collaborators[projId] || [];
  res.json(list);
});

collaborationRouter.delete("/projects/:projectId/collaborators/:id", requireAuth, (req: Request, res: Response) => {
  const authUser = req.user!;
  const projId = parseInt(req.params.projectId, 10);
  const collabId = parseInt(req.params.id, 10);

  const project = projects.find(p => p.id === projId);
  if (!project) return res.status(404).json({ message: "Project not found." });

  const isAuthor = project.authorId === authUser.id || project.authorUsername.toLowerCase() === authUser.username.toLowerCase();
  if (!isAuthor && !isOwner(authUser)) {
    return res.status(403).json({ message: "Only the project author can remove collaborators." });
  }

  if (collaborators[projId]) {
    collaborators[projId] = collaborators[projId].filter(c => c.id !== collabId);
    queuePersistence();
  }

  res.status(204).send();
});

// ==========================================
// 3. PROJECT COMMENTS
// ==========================================
collaborationRouter.get("/projects/:projectId/comments", (req: Request, res: Response) => {
  const projId = parseInt(req.params.projectId, 10);
  const projectComments = comments.filter(c => c.projectId === projId);
  res.json(projectComments);
});

collaborationRouter.post("/comments", requireAuth, (req: Request, res: Response) => {
  const authUser = req.user!;
  const { projectId, content, sectionType } = req.body;

  const projId = parseInt(projectId, 10);
  const project = projects.find(p => p.id === projId);
  if (!project) return res.status(404).json({ message: "Project not found." });

  const cleanContent = (content || "").trim();
  if (!cleanContent) {
    return res.status(400).json({ message: "Comment content cannot be empty." });
  }

  const userRecord = users.find(u => u.id === authUser.id);

  const newComment: ProjectComment = {
    id: nextCommentId(),
    projectId: projId,
    authorId: authUser.id,
    authorUsername: authUser.username,
    authorEmail: authUser.email,
    authorAvatar: userRecord?.profileImage || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(authUser.username)}`,
    content: cleanContent,
    sectionType: sectionType || "GENERAL",
    createdAt: new Date().toISOString()
  };

  comments.push(newComment);
  queuePersistence();

  res.status(201).json(newComment);
});

collaborationRouter.delete("/comments/:id", requireAuth, (req: Request, res: Response) => {
  const authUser = req.user!;
  const commentId = parseInt(req.params.id, 10);
  const index = comments.findIndex(c => c.id === commentId);

  if (index === -1) {
    return res.status(404).json({ message: "Comment not found." });
  }

  const comment = comments[index];
  const project = projects.find(p => p.id === comment.projectId);

  const isCommentAuthor = comment.authorId === authUser.id || comment.authorUsername.toLowerCase() === authUser.username.toLowerCase();
  const isProjectAuthor = project && (project.authorId === authUser.id || project.authorUsername.toLowerCase() === authUser.username.toLowerCase());

  if (!isCommentAuthor && !isProjectAuthor && !isOwner(authUser)) {
    return res.status(403).json({ message: "Forbidden: You cannot delete this comment." });
  }

  comments.splice(index, 1);
  queuePersistence();

  res.status(204).send();
});
