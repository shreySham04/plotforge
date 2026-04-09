const STORAGE_KEY = "plotforge.fanconcepts.v1";

function safeParse(value, fallback) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function readStore() {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  const parsed = safeParse(raw, []);
  return Array.isArray(parsed) ? parsed : [];
}

function writeStore(items) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function toPresentation(item, username) {
  const ratingsByUser = item.ratingsByUser || {};
  const ratingValues = Object.values(ratingsByUser).filter((value) => Number.isFinite(value));
  const ratingCount = ratingValues.length;
  const averageRating = ratingCount
    ? ratingValues.reduce((sum, value) => sum + value, 0) / ratingCount
    : 0;

  return {
    ...item,
    ratingCount,
    averageRating,
    userRating: username ? ratingsByUser[username] ?? null : null
  };
}

export function getFanConcepts({ type = "ALL", username = "" } = {}) {
  const items = readStore()
    .filter((item) => (type === "ALL" ? true : item.type === type))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map((item) => toPresentation(item, username));

  return items;
}

export function createFanConcept(payload) {
  const items = readStore();
  const next = {
    id: String(Date.now()),
    type: payload.type,
    title: payload.title,
    mediaTitle: payload.mediaTitle,
    description: payload.description,
    assetDataUrl: payload.assetDataUrl,
    authorUsername: payload.authorUsername,
    createdAt: new Date().toISOString(),
    ratingsByUser: {}
  };

  items.push(next);
  writeStore(items);
  return next;
}

export function rateFanConcept(id, rating, username) {
  if (!username) {
    throw new Error("You must be logged in to rate this fan concept");
  }

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new Error("Rating must be between 1 and 5");
  }

  const items = readStore();
  const index = items.findIndex((item) => item.id === id);

  if (index === -1) {
    throw new Error("Fan concept not found");
  }

  const item = items[index];
  const ratingsByUser = { ...(item.ratingsByUser || {}) };
  ratingsByUser[username] = rating;

  const updated = {
    ...item,
    ratingsByUser
  };

  items[index] = updated;
  writeStore(items);
  return updated;
}
