import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET, OWNER_EMAIL } from "../config/auth.js";
import { AuthUser } from "../types/index.js";

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function getAuthUser(req: Request): AuthUser | null {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") return null;

  try {
    const decoded = jwt.verify(parts[1], JWT_SECRET) as any;
    if (!decoded || !decoded.id) return null;

    const isOwnerUser = decoded.role === "OWNER" || decoded.role === "ADMIN";

    return {
      id: Number(decoded.id),
      username: decoded.username || "",
      email: decoded.email || "",
      role: decoded.role || "WRITER",
      isOwner: isOwnerUser
    };
  } catch {
    return null;
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ message: "Authentication required. Please log in to continue." });
  }
  req.user = user;
  next();
}

export function isOwner(user: AuthUser | null | undefined): boolean {
  if (!user) return false;
  return user.role === "OWNER" || user.role === "ADMIN";
}

export function requireOwner(req: Request, res: Response, next: NextFunction) {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ message: "Authentication required." });
  }
  if (!isOwner(user)) {
    return res.status(403).json({ message: "Forbidden: Platform administrator access required." });
  }
  req.user = user;
  next();
}
