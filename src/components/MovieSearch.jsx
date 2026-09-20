import { useState } from "react";
import { searchTmdbMedia } from "../services/tmdbService";
import { safeArray } from "../utils/data";

export default function MovieSearch({ onSelectMedia, selectedMedia }) {
  const [results, setResults] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  async function handleSearch(e) {
    const val = e.target.value;
    setQuery(val);
    if (!val.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    setOpen(true);
    try {
      const data = await searchTmdbMedia(val);
      setResults(safeArray(data));
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  function handlePick(item) {
    onSelectMedia(item);
    setQuery(item.title);
    setOpen(false);
  }

  function handleCustomPick() {
    if (!query.trim()) return;
    const customItem = {
      id: `custom-${Date.now()}`,
      title: query.trim(),
      type: "MOVIE",
      year: new Date().getFullYear(),
      poster: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=300",
      poster_path: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=300"
    };
    onSelectMedia(customItem);
    setOpen(false);
  }

  const safeResultsList = safeArray(results);

  return (
    <div className="relative space-y-2">
      <label className="block text-xs font-semibold text-slate-300">
        Connected Movie / Series (TMDB Search)
      </label>
      
      {selectedMedia ? (
        <div className="flex items-center justify-between rounded-xl border border-rose-500/40 bg-slate-900/90 p-2.5 text-xs shadow-md">
          <div className="flex items-center gap-3">
            <img
              src={
                selectedMedia.poster ||
                selectedMedia.poster_path ||
                "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=300"
              }
              alt={selectedMedia.title}
              className="w-10 h-14 object-cover rounded shadow border border-slate-700/80 shrink-0"
            />
            <div>
              <div className="font-bold text-rose-300 text-sm">{selectedMedia.title}</div>
              <div className="flex items-center gap-2 mt-1">
                <span className="rounded bg-rose-500/20 border border-rose-500/30 px-1.5 py-0.5 text-[10px] uppercase font-bold text-rose-200">
                  {selectedMedia.type || "MEDIA"}
                </span>
                <span className="text-slate-400 text-[11px] font-medium">{selectedMedia.year || "2024"}</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            className="text-slate-400 hover:text-rose-400 text-xs font-bold px-2 py-1 rounded hover:bg-slate-800 transition-colors"
            onClick={() => onSelectMedia(null)}
          >
            Change
          </button>
        </div>
      ) : (
        <div className="relative">
          <input
            type="text"
            className="input text-xs"
            placeholder="Search movie or TV show title..."
            value={query}
            onChange={handleSearch}
          />

          {open && (
            <div className="absolute z-50 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-slate-700/80 bg-slate-900/95 p-1.5 shadow-2xl backdrop-blur-md space-y-1">
              {loading && <p className="p-3 text-xs text-slate-400">Searching TMDB media...</p>}
              
              {!loading && safeResultsList.map((item) => {
                const posterImg =
                  item.poster ||
                  item.poster_path ||
                  "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=300";
                return (
                  <div
                    key={item.id || item.title}
                    onClick={() => handlePick(item)}
                    className="flex items-center gap-3 rounded-lg p-2 text-xs hover:bg-slate-800/90 cursor-pointer text-slate-200 transition-colors"
                  >
                    <img
                      src={posterImg}
                      alt={item.title}
                      className="w-9 h-12 object-cover rounded shadow border border-slate-700/60 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-100 truncate">{item.title}</div>
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mt-0.5">
                        <span className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-300 font-medium">{item.type || "MOVIE"}</span>
                        <span>• {item.year || "2024"}</span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {!loading && query.trim() && (
                <div
                  onClick={handleCustomPick}
                  className="p-2 border-t border-slate-800 text-xs text-rose-400 hover:text-rose-300 hover:bg-slate-800/60 rounded-lg cursor-pointer flex items-center gap-2 font-medium"
                >
                  <span className="text-sm">🎬</span>
                  <span>Use custom title "{query.trim()}"</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
