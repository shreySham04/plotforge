export default function MovieCard({ item, selected = false, onSelect }) {
  const title = item.title || item.name || "Untitled";
  const year = (item.release_date || item.first_air_date || "").slice(0, 4);
  const poster = item.poster_path
    ? `https://image.tmdb.org/t/p/w342${item.poster_path}`
    : "https://via.placeholder.com/342x513?text=No+Poster";
  const type = item.media_type === "tv" ? "TV" : "MOVIE";

  return (
    <button
      type="button"
      onClick={() => onSelect?.(item)}
      className={`overflow-hidden rounded-xl border text-left transition ${
        selected
          ? "border-blue-400 bg-slate-800"
          : "border-slate-800 bg-slate-900/70 hover:border-slate-600"
      }`}
    >
      <img src={poster} alt={title} className="h-56 w-full object-cover" />
      <div className="p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-300">{type}</p>
        <h4 className="mt-1 line-clamp-1 text-sm font-semibold text-slate-100">{title}</h4>
        {year && <p className="text-xs text-slate-400">{year}</p>}
        <p className="mt-2 line-clamp-3 text-xs text-slate-300">{item.overview || "No overview available."}</p>
      </div>
    </button>
  );
}
