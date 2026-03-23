import { useState } from "react";
import { searchMedia } from "../services/fanFutureService";
import { extractApiError } from "../utils/errors";
import MovieCard from "./MovieCard";

export default function MovieSearch({ selectedMedia, onSelect }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSearch(e) {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError("");
    try {
      const data = await searchMedia(query.trim());
      const filtered = (data.results || []).filter((item) => item.media_type === "movie" || item.media_type === "tv");
      setResults(filtered);
    } catch (err) {
      setError(extractApiError(err, "Failed to search TMDB"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="card">
      <h3 className="text-lg font-semibold text-slate-100">Find A Movie Or TV Show</h3>
      <form className="mt-3 flex gap-2" onSubmit={onSearch}>
        <input
          className="input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search e.g. Stranger Things, Breaking Bad..."
        />
        <button className="btn" type="submit" disabled={loading}>
          {loading ? "Searching..." : "Search"}
        </button>
      </form>
      {error && <p className="mt-2 text-sm text-rose-400">{error}</p>}

      {selectedMedia && (
        <div className="mt-3 rounded-lg border border-blue-500/50 bg-blue-500/10 p-2 text-sm text-blue-200">
          Selected: {selectedMedia.title || selectedMedia.name} ({selectedMedia.media_type === "tv" ? "TV" : "MOVIE"})
        </div>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {results.map((item) => (
          <MovieCard
            key={`${item.media_type}-${item.id}`}
            item={item}
            selected={selectedMedia?.id === item.id && selectedMedia?.media_type === item.media_type}
            onSelect={onSelect}
          />
        ))}
      </div>
    </section>
  );
}
