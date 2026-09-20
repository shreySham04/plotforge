import { Request, Response, NextFunction } from "express";

interface RateLimitRecord {
  timestamps: number[];
}

const userRequestMap = new Map<string, RateLimitRecord>();

// Clean up stale timestamps every 5 minutes to prevent memory leak
setInterval(() => {
  const cutoff = Date.now() - 60_000;
  for (const [key, record] of userRequestMap.entries()) {
    record.timestamps = record.timestamps.filter(t => t > cutoff);
    if (record.timestamps.length === 0) {
      userRequestMap.delete(key);
    }
  }
}, 5 * 60_000);

const MAX_REQUESTS_PER_MINUTE = 20;
const WINDOW_MS = 60_000;

export function aiRateLimit(req: Request, res: Response, next: NextFunction) {
  // Key by authenticated user ID or remote IP address
  const identifier = req.user?.id ? `user_${req.user.id}` : (req.ip || "unknown_client");
  const now = Date.now();

  let record = userRequestMap.get(identifier);
  if (!record) {
    record = { timestamps: [] };
    userRequestMap.set(identifier, record);
  }

  // Filter timestamps outside current window
  record.timestamps = record.timestamps.filter(t => t > now - WINDOW_MS);

  if (record.timestamps.length >= MAX_REQUESTS_PER_MINUTE) {
    res.setHeader("Retry-After", "60");
    return res.status(429).json({
      error: "RATE_LIMIT_EXCEEDED",
      message: "AI request rate limit exceeded. You are limited to 20 AI operations per minute. Please try again later."
    });
  }

  record.timestamps.push(now);

  // Request size validation
  const { prompt, storyContent, scriptContent, messages } = req.body || {};
  if (prompt && typeof prompt === "string" && prompt.length > 8000) {
    return res.status(400).json({
      error: "PAYLOAD_TOO_LARGE",
      message: "Prompt exceeds maximum allowed length of 8,000 characters."
    });
  }

  if (storyContent && typeof storyContent === "string" && storyContent.length > 50000) {
    return res.status(400).json({
      error: "PAYLOAD_TOO_LARGE",
      message: "Story content exceeds maximum allowed length of 50,000 characters."
    });
  }

  if (scriptContent && typeof scriptContent === "string" && scriptContent.length > 50000) {
    return res.status(400).json({
      error: "PAYLOAD_TOO_LARGE",
      message: "Script content exceeds maximum allowed length of 50,000 characters."
    });
  }

  if (Array.isArray(messages) && messages.length > 50) {
    return res.status(400).json({
      error: "PAYLOAD_TOO_LARGE",
      message: "Message history exceeds maximum allowed limit of 50 messages."
    });
  }

  next();
}
