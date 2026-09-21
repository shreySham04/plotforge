import "dotenv/config";
import crypto from "crypto";

// Resolve JWT secret securely
let resolvedJwtSecret = process.env.JWT_SECRET;

if (!resolvedJwtSecret) {
  if (process.env.NODE_ENV === "production") {
    console.error("FATAL: JWT_SECRET environment variable is missing in production mode.");
    throw new Error("JWT_SECRET environment variable is required in production.");
  } else {
    // Generate a secure, unpredictable 256-bit secret for local runtime
    resolvedJwtSecret = crypto.randomBytes(32).toString("hex");
    console.warn("Notice: JWT_SECRET was not defined in .env. Generated a secure runtime key for this session.");
  }
}

export const JWT_SECRET = resolvedJwtSecret;

// Configurable Owner email via environment variable (never hardcoded in repository)
export const OWNER_EMAIL = (process.env.OWNER_EMAIL || "").trim().toLowerCase();

// Token expiration
export const JWT_EXPIRES_IN = "7d";
