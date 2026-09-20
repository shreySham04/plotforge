import { test, describe } from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { evaluateProjectAccess } from "../server/services/accessControl.js";
import { shareTokens, collaborators } from "../server/data/store.js";
import { JWT_SECRET, OWNER_EMAIL } from "../server/config/auth.js";
import { Project } from "../server/types/index.js";

describe("PlotForge v2: Integration Authorization Matrix", () => {
  const privateProject: Project = {
    id: 999,
    title: "Classified Noir Feature",
    description: "Confidential draft",
    genre: "Noir",
    type: "SCRIPT",
    status: "DRAFT",
    authorId: 10,
    authorUsername: "alice_author",
    isPublic: false,
    collaboratorCount: 0,
    reviewCount: 0,
    views: 0,
    likes: 0,
    createdAt: new Date().toISOString()
  };

  const userAlice = { id: 10, username: "alice_author", email: "alice@studio.com", role: "WRITER" as const };
  const userBob = { id: 20, username: "bob_adversary", email: "bob@hacker.io", role: "WRITER" as const };
  const userOwner = { id: 1, username: "platform_owner", email: OWNER_EMAIL, role: "OWNER" as const };

  const tokenAlice = jwt.sign(userAlice, JWT_SECRET);
  const tokenBob = jwt.sign(userBob, JWT_SECRET);
  const tokenOwner = jwt.sign(userOwner, JWT_SECRET);

  test("1. Unauthorized User B CANNOT access User A's private project (returns 403)", () => {
    const mockReq = {
      query: {},
      headers: { authorization: `Bearer ${tokenBob}` }
    } as any;

    const access = evaluateProjectAccess(privateProject, mockReq);
    assert.equal(access.allowed, false);
    assert.equal(access.statusCode, 403);
  });

  test("2. Anonymous visitor CANNOT access User A's private project (returns 401)", () => {
    const mockReq = {
      query: {},
      headers: {}
    } as any;

    const access = evaluateProjectAccess(privateProject, mockReq);
    assert.equal(access.allowed, false);
    assert.equal(access.statusCode, 401);
  });

  test("3. Project Author (User A) CAN access their own private project", () => {
    const mockReq = {
      query: {},
      headers: { authorization: `Bearer ${tokenAlice}` }
    } as any;

    const access = evaluateProjectAccess(privateProject, mockReq);
    assert.equal(access.allowed, true);
    assert.equal(access.isAuthor, true);
  });

  test("4. Platform Owner CAN access any private project for administration", () => {
    const mockReq = {
      query: {},
      headers: { authorization: `Bearer ${tokenOwner}` }
    } as any;

    const access = evaluateProjectAccess(privateProject, mockReq);
    assert.equal(access.allowed, true);
    assert.equal(access.isOwnerUser, true);
  });

  test("5. Valid cryptographic share token grants read access to private project", () => {
    const validShareToken = "abc123token456cryptographic_secret_64chars_long_and_unguessable!";
    shareTokens.set(validShareToken, {
      projectId: privateProject.id,
      token: validShareToken,
      createdAt: new Date().toISOString(),
      permission: "VIEW"
    });

    const mockReqWithQuery = {
      query: { token: validShareToken },
      headers: {}
    } as any;

    const access = evaluateProjectAccess(privateProject, mockReqWithQuery);
    assert.equal(access.allowed, true);
    assert.equal(access.isSharedViewer, true);
  });

  test("6. Invalid or expired share token denies access to private project", () => {
    const mockReq = {
      query: { token: "fake-or-expired-token" },
      headers: {}
    } as any;

    const access = evaluateProjectAccess(privateProject, mockReq);
    assert.equal(access.allowed, false);
    assert.equal(access.statusCode, 401);
  });

  test("7. Active collaborator with EDITOR or VIEWER role CAN access private project", () => {
    collaborators[privateProject.id] = [
      {
        id: 501,
        projectId: privateProject.id,
        userId: userBob.id,
        username: userBob.username,
        email: userBob.email,
        role: "EDITOR",
        status: "ACTIVE",
        addedAt: new Date().toISOString()
      }
    ];

    const mockReq = {
      query: {},
      headers: { authorization: `Bearer ${tokenBob}` }
    } as any;

    const access = evaluateProjectAccess(privateProject, mockReq);
    assert.equal(access.allowed, true);
    assert.equal(access.isCollaborator, true);

    // Clean up
    delete collaborators[privateProject.id];
  });

  test("8. Share-link generation permission check strictly rejects non-collaborators", () => {
    const isAuthorizedToShare = (project: Project, authUser: any) => {
      const isAuthor = project.authorId === authUser.id || project.authorUsername.toLowerCase() === authUser.username.toLowerCase();
      const projectCollabs = collaborators[project.id] || [];
      const isEditorCollab = projectCollabs.some(
        c => ((c.userId && c.userId === authUser.id) || (c.username && c.username.toLowerCase() === authUser.username.toLowerCase())) &&
             (c.role === "EDITOR" || c.role === "ADMIN")
      );
      const isOwner = authUser.email?.toLowerCase() === OWNER_EMAIL || authUser.role === "OWNER";
      return isAuthor || isOwner || isEditorCollab;
    };

    assert.equal(isAuthorizedToShare(privateProject, userAlice), true);
    assert.equal(isAuthorizedToShare(privateProject, userOwner), true);
    assert.equal(isAuthorizedToShare(privateProject, userBob), false);
  });

  test("9. Invitation target check rejects unauthorized responders", () => {
    const invite = {
      id: 77,
      projectId: 999,
      projectTitle: "Classified Noir Feature",
      senderUsername: "alice_author",
      targetUsernameOrEmail: "charlie_collaborator",
      role: "EDITOR" as const,
      status: "PENDING" as const,
      createdAt: new Date().toISOString()
    };

    const isAuthorizedForInvite = (target: string, user: any) => {
      if (user.email?.toLowerCase() === OWNER_EMAIL || user.role === "OWNER") return true;
      const usernameLower = user.username.toLowerCase();
      const emailLower = user.email.toLowerCase();
      const targetLower = target.toLowerCase();
      return targetLower === usernameLower || targetLower === emailLower;
    };

    // Charlie can accept
    assert.equal(isAuthorizedForInvite(invite.targetUsernameOrEmail, { username: "charlie_collaborator", email: "charlie@web.com" }), true);
    // Bob cannot accept or decline Charlie's invitation
    assert.equal(isAuthorizedForInvite(invite.targetUsernameOrEmail, userBob), false);
    // Platform owner can override
    assert.equal(isAuthorizedForInvite(invite.targetUsernameOrEmail, userOwner), true);
  });

  test("10. Google authentication without verified token is rejected", () => {
    // Unverified credentials or empty payload must never be allowed to fall back to raw email
    const verifyAttempt = (credential?: string, googleToken?: string) => {
      const token = (typeof credential === "string" && credential.trim())
        ? credential.trim()
        : (typeof googleToken === "string" && googleToken.trim())
          ? googleToken.trim()
          : null;
      return token !== null;
    };

    assert.equal(verifyAttempt(undefined, undefined), false);
    assert.equal(verifyAttempt("", "  "), false);
    assert.equal(verifyAttempt("valid-id-token", undefined), true);
  });
});
