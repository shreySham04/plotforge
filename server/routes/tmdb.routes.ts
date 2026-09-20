import { Router, Request, Response } from "express";
import axios from "axios";

export const tmdbRouter = Router();

// In-memory cache for TMDB queries
interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}
const cache = new Map<string, CacheEntry<any>>();

function getCached<T>(key: string): T | null {
  const item = cache.get(key);
  if (!item) return null;
  if (Date.now() > item.expiresAt) {
    cache.delete(key);
    return null;
  }
  return item.value;
}

function setCache<T>(key: string, value: T, ttlMs: number): void {
  cache.set(key, { value, expiresAt: Date.now() + ttlMs });
}

// Curated cinematic reference titles
const curatedMedia = [
  {
    id: 9991,
    title: "War 2",
    name: "War 2",
    poster_path: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=300&auto=format&fit=crop&q=80",
    overview: "High-octane spy thriller packed with globe-trotting espionage and tactical confrontation.",
    release_date: "2025-08-14",
    first_air_date: "2025-08-14",
    media_type: "movie",
    vote_average: 8.8
  },
  {
    id: 550,
    title: "Fight Club",
    name: "Fight Club",
    poster_path: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=300&auto=format&fit=crop&q=80",
    overview: "An insomniac office worker and a devil-may-care soap maker form an underground fight club that evolves into much more.",
    release_date: "1999-10-15",
    first_air_date: "1999-10-15",
    media_type: "movie",
    vote_average: 8.4
  },
  {
    id: 157336,
    title: "Interstellar",
    name: "Interstellar",
    poster_path: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=300&auto=format&fit=crop&q=80",
    overview: "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival.",
    release_date: "2014-11-05",
    first_air_date: "2014-11-05",
    media_type: "movie",
    vote_average: 8.6
  },
  {
    id: 27205,
    title: "Inception",
    name: "Inception",
    poster_path: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=300&auto=format&fit=crop&q=80",
    overview: "A thief who steals corporate secrets through dream-sharing technology is tasked with planting an idea into the mind of a CEO.",
    release_date: "2010-07-15",
    first_air_date: "2010-07-15",
    media_type: "movie",
    vote_average: 8.3
  },
  {
    id: 1399,
    title: "Game of Thrones",
    name: "Game of Thrones",
    poster_path: "https://images.unsplash.com/photo-1514539079130-25950c84af65?w=300&auto=format&fit=crop&q=80",
    overview: "Nine noble families fight for control over the lands of Westeros, while an ancient enemy returns.",
    release_date: "2011-04-17",
    first_air_date: "2011-04-17",
    media_type: "tv",
    vote_average: 8.4
  }
];

// Search Media
tmdbRouter.get("/search", async (req: Request, res: Response) => {
  const query = String(req.query.query || "").trim();
  const cacheKey = `search_${query.toLowerCase()}`;
  const cached = getCached(cacheKey);
  if (cached) return res.json(cached);

  const apiKey = process.env.TMDB_API_KEY;

  if (apiKey) {
    try {
      const endpoint = query
        ? `https://api.themoviedb.org/3/search/multi?api_key=${apiKey}&query=${encodeURIComponent(query)}`
        : `https://api.themoviedb.org/3/trending/all/week?api_key=${apiKey}`;

      const response = await axios.get(endpoint, { timeout: 4000 });
      const results = (response.data.results || []).map((m: any) => ({
        id: m.id,
        title: m.title || m.name || "Untitled",
        name: m.name || m.title || "Untitled",
        poster_path: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=300&auto=format&fit=crop&q=80",
        overview: m.overview || "No synopsis available.",
        release_date: m.release_date || m.first_air_date || "",
        first_air_date: m.first_air_date || m.release_date || "",
        media_type: m.media_type || (m.first_air_date ? "tv" : "movie"),
        vote_average: m.vote_average || 7.0
      }));

      const payload = { results };
      setCache(cacheKey, payload, 10 * 60 * 1000);
      return res.json(payload);
    } catch (err: any) {
      console.warn("Notice: TMDB API live lookup failed, using curated catalog:", err?.message);
    }
  }

  // Fallback to curated titles
  if (!query) {
    const payload = { results: curatedMedia };
    setCache(cacheKey, payload, 30 * 60 * 1000);
    return res.json(payload);
  }

  const lower = query.toLowerCase();
  const filtered = curatedMedia.filter(m =>
    (m.title && m.title.toLowerCase().includes(lower)) ||
    (m.overview && m.overview.toLowerCase().includes(lower))
  );

  const payload = { results: filtered.length > 0 ? filtered : curatedMedia };
  setCache(cacheKey, payload, 30 * 60 * 1000);
  res.json(payload);
});

// Movie Details
tmdbRouter.get("/movie/:id", async (req: Request, res: Response) => {
  const idStr = req.params.id;
  const cacheKey = `movie_${idStr}`;
  const cached = getCached(cacheKey);
  if (cached) return res.json(cached);

  const apiKey = process.env.TMDB_API_KEY;
  if (apiKey) {
    try {
      const response = await axios.get(`https://api.themoviedb.org/3/movie/${idStr}?api_key=${apiKey}`, { timeout: 4000 });
      const m = response.data;
      const payload = {
        id: m.id,
        title: m.title || m.original_title,
        name: m.title,
        poster_path: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=300&auto=format&fit=crop&q=80",
        overview: m.overview,
        release_date: m.release_date,
        media_type: "movie",
        vote_average: m.vote_average
      };
      setCache(cacheKey, payload, 60 * 60 * 1000);
      return res.json(payload);
    } catch (err: any) {
      console.warn("Notice: TMDB movie lookup failed:", err?.message);
    }
  }

  const fallback = curatedMedia.find(m => String(m.id) === idStr) || curatedMedia[0];
  setCache(cacheKey, fallback, 60 * 60 * 1000);
  res.json(fallback);
});

// TV Details
tmdbRouter.get("/tv/:id", async (req: Request, res: Response) => {
  const idStr = req.params.id;
  const cacheKey = `tv_${idStr}`;
  const cached = getCached(cacheKey);
  if (cached) return res.json(cached);

  const apiKey = process.env.TMDB_API_KEY;
  if (apiKey) {
    try {
      const response = await axios.get(`https://api.themoviedb.org/3/tv/${idStr}?api_key=${apiKey}`, { timeout: 4000 });
      const m = response.data;
      const payload = {
        id: m.id,
        title: m.name || m.original_name,
        name: m.name,
        poster_path: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : "https://images.unsplash.com/photo-1514539079130-25950c84af65?w=300&auto=format&fit=crop&q=80",
        overview: m.overview,
        release_date: m.first_air_date,
        media_type: "tv",
        vote_average: m.vote_average
      };
      setCache(cacheKey, payload, 60 * 60 * 1000);
      return res.json(payload);
    } catch (err: any) {
      console.warn("Notice: TMDB TV lookup failed:", err?.message);
    }
  }

  const fallback = curatedMedia.find(m => String(m.id) === idStr) || curatedMedia[4];
  setCache(cacheKey, fallback, 60 * 60 * 1000);
  res.json(fallback);
});
