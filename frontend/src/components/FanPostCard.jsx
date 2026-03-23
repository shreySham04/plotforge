import { Link } from "react-router-dom";

export default function FanPostCard({ post }) {
  const poster = post.posterPath
    ? `https://image.tmdb.org/t/p/w342${post.posterPath}`
    : "https://via.placeholder.com/342x513?text=No+Poster";

  const relationLine = post.relationType === "ALTERNATE_ENDING"
    ? `Alternate Ending: ${post.mediaTitle}`
    : post.relationType === "SEQUEL"
      ? `Prediction for: ${post.mediaTitle}`
      : `Theory for: ${post.mediaTitle}`;

  return (
    <Link
      to={`/fanfuture/${post.id}`}
      className="grid gap-3 rounded-xl border border-slate-800 bg-slate-900/80 p-3 transition hover:border-blue-500/60 md:grid-cols-[96px_1fr]"
    >
      <img src={poster} alt={post.mediaTitle} className="h-36 w-full rounded-lg object-cover md:h-28 md:w-24" />
      <div>
        <p className="text-xs uppercase tracking-wide text-blue-300">{post.mediaType}</p>
        <h3 className="mt-1 text-lg font-semibold text-slate-100">{post.title}</h3>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <p className="text-sm text-slate-300">{relationLine}</p>
        </div>
        <p className="mt-2 line-clamp-2 text-sm text-slate-300">{post.content}</p>
        {post.issuesOrProblems && (
          <p className="mt-2 line-clamp-2 text-xs text-amber-200">
            Issues/Problems: {post.issuesOrProblems}
          </p>
        )}
        <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-400">
          <span>By {post.authorUsername}</span>
          <span>{post.commentCount || 0} comments</span>
        </div>
      </div>
    </Link>
  );
}
