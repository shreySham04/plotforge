import apiClient from "./axios";

// Popular TMDB fallback data for instant offline/mock rich search experience
const FALLBACK_MEDIA = [
  { id: 550, title: "Fight Club", type: "MOVIE", year: 1999, poster: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=300" },
  { id: 27205, title: "Inception", type: "MOVIE", year: 2010, poster: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=300" },
  { id: 157336, title: "Interstellar", type: "MOVIE", year: 2014, poster: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=300" },
  { id: 1399, title: "Game of Thrones", type: "SERIES", year: 2011, poster: "https://images.unsplash.com/photo-1514539079130-25950c84af65?w=300" },
  { id: 66732, title: "Stranger Things", type: "SERIES", year: 2016, poster: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=300" },
  { id: 299536, title: "Avengers: Infinity War", type: "MOVIE", year: 2018, poster: "https://images.unsplash.com/photo-1568832359672-e36cf5d74f54?w=300" },
  { id: 82856, title: "The Mandalorian", type: "SERIES", year: 2019, poster: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300" },
  { id: 438631, title: "Dune", type: "MOVIE", year: 2021, poster: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=300" }
];

export async function searchTmdbMedia(query) {
  if (!query || !query.trim()) return [];
  let rawList = [];
  try {
    const res = await apiClient.get("/tmdb/search", { params: { query } });
    if (Array.isArray(res.data)) rawList = res.data;
    else if (Array.isArray(res.data?.results)) rawList = res.data.results;
    else if (Array.isArray(res.data?.items)) rawList = res.data.items;
  } catch {
    const lower = query.toLowerCase();
    rawList = FALLBACK_MEDIA.filter(
      (m) => m.title.toLowerCase().includes(lower) || m.type.toLowerCase().includes(lower)
    );
  }

  return rawList.map((m) => {
    const poster =
      m.poster_path ||
      m.poster ||
      m.posterUrl ||
      "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=300";
    const title = m.title || m.name || "Untitled";
    const type = (m.type || m.media_type || (m.first_air_date ? "SERIES" : "MOVIE")).toUpperCase();
    const year =
      m.year ||
      (m.release_date || m.first_air_date || "").slice(0, 4) ||
      "2024";

    return {
      ...m,
      id: m.id || title,
      title,
      type,
      year,
      poster,
      poster_path: poster,
      posterUrl: poster
    };
  });
}
