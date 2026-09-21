import { Router, Request, Response } from "express";
import {
  reviews,
  fanPosts,
  fanConcepts,
  users,
  nextReviewId,
  nextFanPostId,
  nextFanConceptId,
  queuePersistence
} from "../data/store.js";
import { requireAuth, isOwner } from "../middleware/auth.js";
import { Review, FanPost, FanConcept } from "../types/index.js";

export const socialRouter = Router();

// Per-user vote & like trackers to prevent script inflation / duplicate spamming
const userReviewLikes = new Map<number, Set<number>>();
const userPostUpvotes = new Map<number, Set<number>>();
const userConceptUpvotes = new Map<number, Set<number>>();

// Sliding-window rate limiter for engagement actions (max 30 per minute per user)
const engagementTimestamps = new Map<number, number[]>();

function checkEngagementRateLimit(userId: number): boolean {
  const now = Date.now();
  const windowMs = 60_000;
  const maxActions = 30;

  let timestamps = engagementTimestamps.get(userId) || [];
  timestamps = timestamps.filter(t => t > now - windowMs);

  if (timestamps.length >= maxActions) {
    return false;
  }

  timestamps.push(now);
  engagementTimestamps.set(userId, timestamps);
  return true;
}

// ==========================================
// 1. REVIEWS
// ==========================================
socialRouter.get("/reviews", (req: Request, res: Response) => {
  res.json(reviews);
});

socialRouter.post("/reviews", requireAuth, (req: Request, res: Response) => {
  const authUser = req.user!;
  const { movieTitle, rating, content, genre } = req.body;

  if (!movieTitle || !content) {
    return res.status(400).json({ message: "Movie title and review content are required." });
  }

  const userRecord = users.find(u => u.id === authUser.id);

  const newReview: Review = {
    id: nextReviewId(),
    author: authUser.username,
    authorUsername: authUser.username,
    authorEmail: authUser.email,
    authorImage: userRecord?.profileImage || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(authUser.username)}`,
    movieTitle: (movieTitle || "").trim(),
    rating: Number(rating) || 5,
    content: (content || "").trim(),
    genre: genre || "General",
    likes: 0,
    createdAt: new Date().toISOString()
  };

  reviews.unshift(newReview);
  queuePersistence();
  res.status(201).json(newReview);
});

socialRouter.post(["/reviews/:id/like", "/reviews/:id/likes"], requireAuth, (req: Request, res: Response) => {
  const userId = req.user!.id;

  if (!checkEngagementRateLimit(userId)) {
    return res.status(429).json({ message: "Too many engagement actions. Please wait a minute." });
  }

  const reviewId = parseInt(req.params.id, 10);
  const review = reviews.find(r => r.id === reviewId);
  if (!review) return res.status(404).json({ message: "Review not found." });

  let userLikes = userReviewLikes.get(reviewId);
  if (!userLikes) {
    userLikes = new Set<number>();
    userReviewLikes.set(reviewId, userLikes);
  }

  let liked = false;
  if (userLikes.has(userId)) {
    // Toggle off existing like
    userLikes.delete(userId);
    review.likes = Math.max(0, (review.likes || 0) - 1);
    liked = false;
  } else {
    // Add new like
    userLikes.add(userId);
    review.likes = (review.likes || 0) + 1;
    liked = true;
  }

  queuePersistence();
  res.json({ liked, likes: review.likes });
});

socialRouter.delete("/reviews/:id", requireAuth, (req: Request, res: Response) => {
  const authUser = req.user!;
  const reviewId = parseInt(req.params.id, 10);
  const index = reviews.findIndex(r => r.id === reviewId);

  if (index === -1) return res.status(404).json({ message: "Review not found." });

  const rev = reviews[index];
  const isAuthor = rev.authorUsername?.toLowerCase() === authUser.username.toLowerCase() || rev.author?.toLowerCase() === authUser.username.toLowerCase();

  // Strict authorization: author or owner only (NO bypass!)
  if (!isAuthor && !isOwner(authUser)) {
    return res.status(403).json({ message: "Forbidden: Only the author or platform owner can delete this review." });
  }

  reviews.splice(index, 1);
  userReviewLikes.delete(reviewId);
  queuePersistence();
  res.status(204).send();
});

// ==========================================
// 2. FAN FUTURE / CONCEPT PITCHES
// ==========================================
socialRouter.get(["/fanfuture", "/fan-future"], (req: Request, res: Response) => {
  res.json(fanPosts);
});

socialRouter.post(["/fanfuture", "/fan-future"], requireAuth, (req: Request, res: Response) => {
  const authUser = req.user!;
  const { title, franchise, category, synopsis, cast, tags } = req.body;

  if (!title || !synopsis) {
    return res.status(400).json({ message: "Title and synopsis are required." });
  }

  const userRecord = users.find(u => u.id === authUser.id);

  const newPost: FanPost = {
    id: nextFanPostId(),
    title: (title || "").trim(),
    author: authUser.username,
    authorUsername: authUser.username,
    authorEmail: authUser.email,
    authorImage: userRecord?.profileImage || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(authUser.username)}`,
    franchise: franchise || "Original",
    category: category || "Sequel Pitch",
    synopsis: (synopsis || "").trim(),
    cast: cast || "",
    upvotes: 0,
    tags: Array.isArray(tags) ? tags : [],
    createdAt: new Date().toISOString()
  };

  fanPosts.unshift(newPost);
  queuePersistence();
  res.status(201).json(newPost);
});

socialRouter.post(
  ["/fanfuture/:id/upvote", "/fan-future/:id/like", "/fan-future/:id/upvote"],
  requireAuth,
  (req: Request, res: Response) => {
    const userId = req.user!.id;

    if (!checkEngagementRateLimit(userId)) {
      return res.status(429).json({ message: "Too many engagement actions. Please wait a minute." });
    }

    const postId = parseInt(req.params.id, 10);
    const post = fanPosts.find(p => p.id === postId);
    if (!post) return res.status(404).json({ message: "Post not found." });

    let userUpvotes = userPostUpvotes.get(postId);
    if (!userUpvotes) {
      userUpvotes = new Set<number>();
      userPostUpvotes.set(postId, userUpvotes);
    }

    let upvoted = false;
    if (userUpvotes.has(userId)) {
      userUpvotes.delete(userId);
      post.upvotes = Math.max(0, (post.upvotes || 0) - 1);
      upvoted = false;
    } else {
      userUpvotes.add(userId);
      post.upvotes = (post.upvotes || 0) + 1;
      upvoted = true;
    }

    queuePersistence();
    res.json({ upvoted, upvotes: post.upvotes, likes: post.upvotes });
  }
);

socialRouter.delete(["/fanfuture/:id", "/fan-future/:id"], requireAuth, (req: Request, res: Response) => {
  const authUser = req.user!;
  const postId = parseInt(req.params.id, 10);
  const index = fanPosts.findIndex(p => p.id === postId);

  if (index === -1) return res.status(404).json({ message: "Post not found." });

  const post = fanPosts[index];
  const isAuthor = post.authorUsername?.toLowerCase() === authUser.username.toLowerCase() || post.author?.toLowerCase() === authUser.username.toLowerCase();

  if (!isAuthor && !isOwner(authUser)) {
    return res.status(403).json({ message: "Forbidden: Only the author or platform owner can delete this post." });
  }

  fanPosts.splice(index, 1);
  userPostUpvotes.delete(postId);
  queuePersistence();
  res.status(204).send();
});

// ==========================================
// 3. FAN CONCEPTS
// ==========================================
socialRouter.get(["/fanconcepts", "/fan-concepts"], (req: Request, res: Response) => {
  res.json(fanConcepts);
});

socialRouter.post(["/fanconcepts", "/fan-concepts"], requireAuth, (req: Request, res: Response) => {
  const authUser = req.user!;
  const { title, universe, type, description } = req.body;

  if (!title || !description) {
    return res.status(400).json({ message: "Title and description are required." });
  }

  const userRecord = users.find(u => u.id === authUser.id);

  const newConcept: FanConcept = {
    id: nextFanConceptId(),
    title: (title || "").trim(),
    author: authUser.username,
    authorUsername: authUser.username,
    authorEmail: authUser.email,
    authorImage: userRecord?.profileImage || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(authUser.username)}`,
    universe: universe || "Original",
    type: type || "Character Concept",
    description: (description || "").trim(),
    upvotes: 0,
    createdAt: new Date().toISOString()
  };

  fanConcepts.unshift(newConcept);
  queuePersistence();
  res.status(201).json(newConcept);
});

socialRouter.post(
  ["/fanconcepts/:id/upvote", "/fan-concepts/:id/rate", "/fan-concepts/:id/upvote"],
  requireAuth,
  (req: Request, res: Response) => {
    const userId = req.user!.id;

    if (!checkEngagementRateLimit(userId)) {
      return res.status(429).json({ message: "Too many engagement actions. Please wait a minute." });
    }

    const conceptId = parseInt(req.params.id, 10);
    const concept = fanConcepts.find(c => c.id === conceptId);
    if (!concept) return res.status(404).json({ message: "Concept not found." });

    let userUpvotes = userConceptUpvotes.get(conceptId);
    if (!userUpvotes) {
      userUpvotes = new Set<number>();
      userConceptUpvotes.set(conceptId, userUpvotes);
    }

    let upvoted = false;
    if (userUpvotes.has(userId)) {
      userUpvotes.delete(userId);
      concept.upvotes = Math.max(0, (concept.upvotes || 0) - 1);
      upvoted = false;
    } else {
      userUpvotes.add(userId);
      concept.upvotes = (concept.upvotes || 0) + 1;
      upvoted = true;
    }

    queuePersistence();
    res.json({ upvoted, upvotes: concept.upvotes });
  }
);

socialRouter.delete(["/fanconcepts/:id", "/fan-concepts/:id"], requireAuth, (req: Request, res: Response) => {
  const authUser = req.user!;
  const conceptId = parseInt(req.params.id, 10);
  const index = fanConcepts.findIndex(c => c.id === conceptId);

  if (index === -1) return res.status(404).json({ message: "Concept not found." });

  const concept = fanConcepts[index];
  const isAuthor = concept.authorUsername?.toLowerCase() === authUser.username.toLowerCase() || concept.author?.toLowerCase() === authUser.username.toLowerCase();

  if (!isAuthor && !isOwner(authUser)) {
    return res.status(403).json({ message: "Forbidden: Only the author or platform owner can delete this concept." });
  }

  fanConcepts.splice(index, 1);
  userConceptUpvotes.delete(conceptId);
  queuePersistence();
  res.status(204).send();
});
