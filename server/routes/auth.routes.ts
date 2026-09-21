import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { users, nextUserId, queuePersistence, passwordResetTokens } from "../data/store.js";
import { JWT_SECRET, JWT_EXPIRES_IN, OWNER_EMAIL } from "../config/auth.js";
import { requireAuth, getAuthUser, isOwner } from "../middleware/auth.js";
import { verifyGoogleToken } from "../services/googleAuthService.js";
import { User } from "../types/index.js";

export const authRouter = Router();

// ==========================================
// 1. REGISTRATION (Role Escalation Protected)
// ==========================================
authRouter.post("/register", (req: Request, res: Response) => {
  const { username, email, password } = req.body;
  const cleanUsername = (username || "").trim();
  const cleanEmail = (email || "").trim().toLowerCase();

  if (!cleanUsername || !cleanEmail || !password) {
    return res.status(400).json({ message: "Username, email, and password are required." });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters." });
  }

  const existing = users.find(
    u => u.username.toLowerCase() === cleanUsername.toLowerCase() || (u.email && u.email.toLowerCase() === cleanEmail)
  );
  if (existing) {
    return res.status(400).json({ message: "An account with this email or username already exists. Please log in." });
  }

  // Privilege Escalation Defense: Standard registration CANNOT set role
  const isDesignatedOwner = cleanEmail === OWNER_EMAIL;
  const assignedRole = isDesignatedOwner ? "OWNER" : "WRITER";

  const newUser: User = {
    id: nextUserId(),
    username: cleanUsername,
    email: cleanEmail,
    passwordHash: bcrypt.hashSync(password, 10),
    role: assignedRole,
    bio: isDesignatedOwner ? "Platform Owner & Super Administrator" : "Plotforge creative author",
    profileImage: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cleanUsername)}`,
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  queuePersistence();

  const token = jwt.sign(
    { id: newUser.id, username: newUser.username, email: newUser.email, role: newUser.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  res.status(201).json({
    token,
    userId: newUser.id,
    username: newUser.username,
    email: newUser.email,
    role: newUser.role,
    isOwner: isDesignatedOwner,
    profileImage: newUser.profileImage
  });
});

// ==========================================
// 2. LOGIN (Empty Password Bypass Protected)
// ==========================================
authRouter.post("/login", (req: Request, res: Response) => {
  const { username, email, password } = req.body;
  const loginName = (username || email || "").trim().toLowerCase();

  if (!loginName || !password) {
    return res.status(400).json({ message: "Username or email and password are required." });
  }

  const user = users.find(
    u => u.username.toLowerCase() === loginName || (u.email && u.email.toLowerCase() === loginName)
  );

  if (!user) {
    return res.status(404).json({ message: "No account found with these credentials. Please check or register." });
  }

  // Security: Never bypass password check if user has no password
  if (!user.passwordHash) {
    return res.status(400).json({
      message: "This account was registered via Google Sign-In. Please sign in with Google or reset your password."
    });
  }

  const isPasswordValid = bcrypt.compareSync(password, user.passwordHash);
  if (!isPasswordValid) {
    return res.status(401).json({ message: "Invalid credentials. Please verify your password." });
  }

  const isOwnerUser = user.email.toLowerCase() === OWNER_EMAIL || user.role === "OWNER" || user.role === "ADMIN";

  const token = jwt.sign(
    { id: user.id, username: user.username, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  res.json({
    token,
    userId: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    isOwner: isOwnerUser,
    profileImage: user.profileImage
  });
});

// ==========================================
// 3. GOOGLE AUTHENTICATION CONFIG & VERIFICATION
// ==========================================
authRouter.get("/google/url", (req: Request, res: Response) => {
  const host = req.get("x-forwarded-host") || req.get("host") || "localhost:3000";
  const protocol = req.protocol === "https" || req.get("x-forwarded-proto") === "https" ? "https" : "http";
  const redirectUri = `${protocol}://${host}/auth/google/callback`;
  const clientId = process.env.GOOGLE_CLIENT_ID || "472663517785-h2qpvdok8f6ir0pnpjk85qj3s946m00s.apps.googleusercontent.com";

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token%20id_token&scope=openid%20email%20profile&prompt=select_account&nonce=${Date.now()}`;

  res.json({
    clientId,
    redirectUri,
    authUrl
  });
});

authRouter.post("/google", async (req: Request, res: Response) => {
  const { credential, googleToken } = req.body;

  // Security Hardening: Token MUST be supplied and verified by Google
  const tokenToVerify = (typeof credential === "string" && credential.trim())
    ? credential.trim()
    : (typeof googleToken === "string" && googleToken.trim())
      ? googleToken.trim()
      : null;

  if (!tokenToVerify) {
    return res.status(401).json({
      message: "A valid Google credential ID token is required. Authentication rejected."
    });
  }

  const verified = await verifyGoogleToken(tokenToVerify);
  if (!verified || !verified.email) {
    return res.status(401).json({
      message: "Google credential verification failed. The provided token is invalid, expired, or unverified."
    });
  }

  // Identity is STRICTLY extracted from the verified Google cryptographic payload
  const verifiedEmail = verified.email.toLowerCase().trim();
  const verifiedName = verified.name || "";
  const verifiedPicture = verified.picture;

  const isOwnerUser = verifiedEmail === OWNER_EMAIL;
  let user = users.find(u => u.email && u.email.toLowerCase() === verifiedEmail);

  if (!user) {
    const baseUsername = (verifiedName || verifiedEmail.split("@")[0]).toLowerCase().replace(/[^a-z0-9_]/g, "") || "author";
    let finalUsername = baseUsername;
    let count = 1;
    while (users.some(u => u.username === finalUsername)) {
      finalUsername = `${baseUsername}${count++}`;
    }

    user = {
      id: nextUserId(),
      username: finalUsername,
      email: verifiedEmail,
      passwordHash: "",
      role: isOwnerUser ? "OWNER" : "WRITER",
      bio: isOwnerUser ? "Platform Owner & Super Administrator" : "Plotforge author (Google Authenticated)",
      profileImage: verifiedPicture || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(finalUsername)}`,
      googleAuth: true,
      createdAt: new Date().toISOString()
    };
    users.push(user);
    queuePersistence();
  } else {
    if (isOwnerUser) user.role = "OWNER";
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  res.json({
    token,
    userId: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    isOwner: isOwnerUser,
    profileImage: user.profileImage
  });
});

// ==========================================
// 4. CURRENT USER PROFILE
// ==========================================
authRouter.get("/me", requireAuth, (req: Request, res: Response) => {
  const authUser = req.user!;
  const user = users.find(u => u.id === authUser.id);
  if (!user) {
    return res.status(404).json({ message: "User record not found." });
  }

  const isOwnerUser = isOwner(authUser);

  res.json({
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    isOwner: isOwnerUser,
    bio: user.bio,
    theme: user.theme || "dark",
    themePreset: user.themePreset || "cyber-amber",
    colorAccent: user.colorAccent || "#f59e0b",
    profileImage: user.profileImage,
    aiPersona: user.aiPersona || "screenplay_editor"
  });
});

authRouter.put("/me", requireAuth, (req: Request, res: Response) => {
  const authUser = req.user!;
  const { username, email, bio, profileImage, theme, themePreset, colorAccent, aiPersona } = req.body;

  const user = users.find(u => u.id === authUser.id);
  if (!user) {
    return res.status(404).json({ message: "User not found." });
  }

  if (username && typeof username === "string") user.username = username.trim();
  if (email && typeof email === "string" && email.includes("@")) user.email = email.trim().toLowerCase();
  if (bio !== undefined) user.bio = bio;
  if (profileImage !== undefined) user.profileImage = profileImage;
  if (theme) user.theme = theme;
  if (themePreset) user.themePreset = themePreset;
  if (colorAccent) user.colorAccent = colorAccent;
  if (aiPersona) user.aiPersona = aiPersona;

  queuePersistence();

  res.json({
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    isOwner: isOwner(user),
    bio: user.bio,
    theme: user.theme,
    themePreset: user.themePreset,
    colorAccent: user.colorAccent,
    profileImage: user.profileImage,
    aiPersona: user.aiPersona
  });
});

// ==========================================
// 5. SECURE PASSWORD RESET (Hashed Token-based)
// ==========================================
authRouter.post("/forgot-password", (req: Request, res: Response) => {
  const { email } = req.body;
  const cleanEmail = (email || "").trim().toLowerCase();

  if (!cleanEmail) {
    return res.status(400).json({ message: "Email address is required." });
  }

  const user = users.find(u => u.email && u.email.toLowerCase() === cleanEmail);

  if (user) {
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = Date.now() + 30 * 60 * 1000; // 30 minutes
    passwordResetTokens.set(tokenHash, { userId: user.id, expiresAt });

    // In local development, log the simulated dispatch link to console for debugging
    if (process.env.NODE_ENV !== "production") {
      console.log(`[AUTH] Password reset link generated for ${user.email}: token=${rawToken}`);
    }
  }

  // Consistent message to prevent email enumeration; NEVER return raw token through API response
  res.json({
    message: "If an account with this email exists, password reset instructions have been sent to your inbox.",
    expiresInMinutes: 30
  });
});

authRouter.post("/reset-password", (req: Request, res: Response) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ message: "Reset token and new password are required." });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters." });
  }

  const rawToken = String(token).trim();
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

  const record = passwordResetTokens.get(tokenHash);
  if (!record || Date.now() > record.expiresAt) {
    if (record) passwordResetTokens.delete(tokenHash);
    return res.status(400).json({ message: "Reset token is invalid or has expired. Please request a new one." });
  }

  const user = users.find(u => u.id === record.userId);
  if (!user) {
    passwordResetTokens.delete(tokenHash);
    return res.status(404).json({ message: "User account not found." });
  }

  user.passwordHash = bcrypt.hashSync(newPassword, 10);
  passwordResetTokens.delete(tokenHash);
  queuePersistence();

  res.json({ message: "Password successfully reset. You may now log in with your new password." });
});
