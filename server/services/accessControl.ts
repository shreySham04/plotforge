import { Request } from "express";
import { Project } from "../types/index.js";
import { collaborators, shareTokens } from "../data/store.js";
import { getAuthUser, isOwner } from "../middleware/auth.js";

export interface AccessResult {
  allowed: boolean;
  statusCode: number;
  reason?: string;
  isAuthor: boolean;
  isCollaborator: boolean;
  isOwnerUser: boolean;
  isSharedViewer: boolean;
}

/**
 * Authoritative evaluation of project visibility and read access.
 * Enforces:
 * 1. Public projects or valid cryptographic share tokens are accessible.
 * 2. Private projects require authenticated author, active collaborator, or platform owner.
 */
export function evaluateProjectAccess(project: Project, req: Request): AccessResult {
  const token = (req.query.token as string) || (req.headers["x-share-token"] as string);
  let isSharedViewer = false;
  if (token && typeof token === "string") {
    const tokenData = shareTokens.get(token.trim());
    if (tokenData && tokenData.projectId === project.id) {
      isSharedViewer = true;
    }
  }

  const authUser = getAuthUser(req);
  const isOwnerUser = isOwner(authUser);
  const isAuthor = Boolean(
    authUser &&
    (project.authorId === authUser.id || project.authorUsername.toLowerCase() === authUser.username.toLowerCase())
  );

  const projectCollabs = collaborators[project.id] || [];
  const isCollaborator = Boolean(
    authUser &&
    projectCollabs.some(
      c => (c.userId && c.userId === authUser.id) || (c.username && c.username.toLowerCase() === authUser.username.toLowerCase())
    )
  );

  // If public or verified share token
  if (project.isPublic !== false || isSharedViewer) {
    return {
      allowed: true,
      statusCode: 200,
      isAuthor,
      isCollaborator,
      isOwnerUser,
      isSharedViewer
    };
  }

  // Private project: Unauthenticated requests rejected with 401
  if (!authUser) {
    return {
      allowed: false,
      statusCode: 401,
      reason: "Authentication required to access this private project.",
      isAuthor: false,
      isCollaborator: false,
      isOwnerUser: false,
      isSharedViewer: false
    };
  }

  // Private project: Authorized user check
  if (isAuthor || isCollaborator || isOwnerUser) {
    return {
      allowed: true,
      statusCode: 200,
      isAuthor,
      isCollaborator,
      isOwnerUser,
      isSharedViewer
    };
  }

  // Private project: Unauthorized user rejected with 403
  return {
    allowed: false,
    statusCode: 403,
    reason: "Forbidden: You do not have permission to view or export this private project.",
    isAuthor: false,
    isCollaborator: false,
    isOwnerUser: false,
    isSharedViewer: false
  };
}
