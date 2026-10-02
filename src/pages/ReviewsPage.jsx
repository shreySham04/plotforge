import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import MovieSearch from "../components/MovieSearch";
import AuthModal from "../components/AuthModal";
import { useAuth } from "../context/AuthContext";
import {
  getReviews,
  createReview,
  deleteReview,
  likeReview
} from "../services/reviewService";
import { safeArray } from "../utils/data";

export default function ReviewsPage() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [myOnly, setMyOnly] = useState(false);
  const [selectedMovieFilter, setSelectedMovieFilter] = useState("ALL");
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Form State
  const [reviewTitle, setReviewTitle] = useState("");
  const [rating, setRating] = useState(9);
  const [content, setContent] = useState("");
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [movieQuery, setMovieQuery] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  // Load reviews from API
  async function loadReviews(isMyOnly = myOnly) {
    setLoading(true);
    try {
      const data = await getReviews(0, 50, isMyOnly);
      setReviews(safeArray(data));
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReviews(myOnly);
  }, [myOnly]);

  // Compute calculated movie averages across all community reviews
  const movieStats = useMemo(() => {
    const map = {};
    for (const r of reviews) {
      const rawTitle = (r.mediaTitle || r.movieTitle || "General Media").trim();
      if (!rawTitle) continue;
      const key = rawTitle.toLowerCase();
      if (!map[key]) {
        map[key] = {
          key,
          title: rawTitle,
          sum: 0,
          count: 0,
          ratings: [],
          poster:
            r.mediaPoster ||
            r.poster ||
            r.poster_path ||
            "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=300",
          genre: r.genre || "General"
        };
      }
      const val = Number(r.rating) || 0;
      map[key].sum += val;
      map[key].count += 1;
      map[key].ratings.push(val);
      if (!map[key].poster && (r.mediaPoster || r.poster)) {
        map[key].poster = r.mediaPoster || r.poster;
      }
    }

    const list = Object.values(map).map((item) => ({
      ...item,
      average: (item.sum / item.count).toFixed(1),
      averageNum: Number((item.sum / item.count).toFixed(1)),
      isMultiReview: item.count >= 2
    }));

    // Sort by count descending, then by average descending
    list.sort((a, b) => b.count - a.count || b.averageNum - a.averageNum);

    return {
      byKey: map,
      list
    };
  }, [reviews]);

  // Live consensus check for the movie currently being reviewed in the form
  const activeMovieKey = (selectedMedia?.title || movieQuery || "").trim().toLowerCase();
  const currentMovieConsensus = activeMovieKey ? movieStats.byKey[activeMovieKey] : null;

  // Filter reviews for display
  const displayedReviews = useMemo(() => {
    return reviews.filter((r) => {
      // 1. My Reviews filter
      if (myOnly) {
        if (!user) return false;
        const isMine =
          r.isMine ||
          r.authorUsername?.toLowerCase() === user.username?.toLowerCase() ||
          r.authorEmail?.toLowerCase() === user.email?.toLowerCase() ||
          r.author?.toLowerCase() === user.username?.toLowerCase();
        if (!isMine) return false;
      }

      // 2. Movie filter
      if (selectedMovieFilter && selectedMovieFilter !== "ALL") {
        const rawTitle = (r.mediaTitle || r.movieTitle || "").trim().toLowerCase();
        if (rawTitle !== selectedMovieFilter.toLowerCase()) return false;
      }

      return true;
    });
  }, [reviews, myOnly, selectedMovieFilter, user]);

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (!user) {
      setAuthModalOpen(true);
      return;
    }

    const resolvedMovie = (selectedMedia?.title || movieQuery || "").trim();
    if (!resolvedMovie) {
      setFormError("Please enter or select a movie or series title.");
      return;
    }

    if (!reviewTitle.trim()) {
      setFormError("Please enter a review headline.");
      return;
    }

    if (!content.trim()) {
      setFormError("Please write a detailed critique.");
      return;
    }

    setSubmitting(true);

    const resolvedPoster =
      selectedMedia?.poster ||
      selectedMedia?.poster_path ||
      (/transformer/i.test(resolvedMovie)
        ? "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=400"
        : "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=300");

    const payload = {
      reviewTitle: reviewTitle.trim(),
      movieTitle: resolvedMovie,
      mediaTitle: resolvedMovie,
      mediaPoster: resolvedPoster,
      poster: resolvedPoster,
      rating: Number(rating),
      content: content.trim(),
      genre: selectedMedia?.type || "Movie Critique"
    };

    try {
      const created = await createReview(payload);
      setReviews((prev) => [created, ...prev]);
      setFormSuccess(
        `Critique for "${resolvedMovie}" published successfully! Movie average updated.`
      );
      setReviewTitle("");
      setContent("");
      setSelectedMedia(null);
      setMovieQuery("");
      setRating(9);
    } catch (err) {
      // Fallback local insertion if network issue
      const localRev = {
        id: `rev-${Date.now()}`,
        ...payload,
        author: user.username || "You",
        authorUsername: user.username || "You",
        isMine: true,
        likes: 0,
        createdAt: new Date().toISOString()
      };
      setReviews((prev) => [localRev, ...prev]);
      setFormSuccess(`Critique for "${resolvedMovie}" published!`);
      setReviewTitle("");
      setContent("");
      setSelectedMedia(null);
      setMovieQuery("");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleLike(reviewId) {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    try {
      const res = await likeReview(reviewId);
      setReviews((prev) =>
        prev.map((r) => (r.id === reviewId ? { ...r, likes: res.likes, liked: res.liked } : r))
      );
    } catch {
      // Optimistic toggle fallback
      setReviews((prev) =>
        prev.map((r) =>
          r.id === reviewId
            ? { ...r, likes: (r.likes || 0) + (r.liked ? -1 : 1), liked: !r.liked }
            : r
        )
      );
    }
  }

  async function handleDelete(id) {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    try {
      await deleteReview(id);
    } catch {
      // Handled locally
    }
    setReviews((prev) => prev.filter((r) => r.id !== id));
  }

  // Count user's own reviews
  const myReviewsCount = useMemo(() => {
    if (!user) return 0;
    return reviews.filter(
      (r) =>
        r.isMine ||
        r.authorUsername?.toLowerCase() === user.username?.toLowerCase() ||
        r.authorEmail?.toLowerCase() === user.email?.toLowerCase() ||
        r.author?.toLowerCase() === user.username?.toLowerCase()
    ).length;
  }, [reviews, user]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070b12] text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 py-8 flex-1 space-y-8">
        <header className="space-y-1">
          <div className="theme-pill">
            <span>⭐</span> Reviews &amp; Critiques
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Media &amp; Project Reviews
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Critique movies, TV series, or community narrative releases with structured 1-10 star
            ratings. When multiple people review the same movie, the community average is
            automatically calculated.
          </p>
        </header>

        {/* Guest Preview Mode Banner */}
        {!user && (
          <div className="rounded-2xl theme-bg-subtle p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">⭐</span>
              <div>
                <p className="font-bold text-slate-900 dark:text-white text-sm">Guest Preview Mode</p>
                <p className="text-slate-600 dark:text-slate-300/80">
                  You are browsing public community movie reviews and calculated averages. Log in to
                  publish critiques and track your personal reviews.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link
                to="/login"
                className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-1.5 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                Log In
              </Link>
              <Link to="/register" className="btn text-xs py-1.5 px-3.5">
                Sign Up
              </Link>
            </div>
          </div>
        )}

        {/* Write a Review Section */}
        <section className="card space-y-4 shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>✍️</span> Write a Review
            </h2>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              Structured 1-10 scale
            </span>
          </div>

          {/* Form error / success notices */}
          {formError && (
            <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 p-3 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
              <span>⚠️</span>
              <span>{formError}</span>
            </div>
          )}

          {formSuccess && (
            <div className="rounded-xl bg-teal-500/10 border border-teal-500/30 p-3 text-xs text-teal-700 dark:text-teal-300 flex items-center gap-2">
              <span>✓</span>
              <span>{formSuccess}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Review Headline <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  className="input text-sm"
                  placeholder="e.g. Masterpiece in narrative tension and character development"
                  value={reviewTitle}
                  onChange={(e) => setReviewTitle(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Rating (1 to 10)
                </label>
                <select
                  className="input text-sm font-bold text-rose-600 dark:text-rose-400 bg-white dark:bg-slate-900"
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                >
                  {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((num) => (
                    <option key={num} value={num}>
                      ★ {num} / 10
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Movie / Series Search Component */}
            <MovieSearch
              selectedMedia={selectedMedia}
              onSelectMedia={setSelectedMedia}
              query={movieQuery}
              onQueryChange={setMovieQuery}
            />

            {/* Dynamic Community Average Indicator for Selected Movie */}
            {currentMovieConsensus && (
              <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-3 text-xs text-amber-700 dark:text-amber-300 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-base">📊</span>
                  <div>
                    <span className="font-bold">
                      Current Community Average for "{currentMovieConsensus.title}":
                    </span>{" "}
                    <span className="font-black text-rose-600 dark:text-rose-400">
                      ★ {currentMovieConsensus.average} / 10
                    </span>{" "}
                    <span className="text-slate-500 dark:text-slate-400">
                      (from {currentMovieConsensus.count}{" "}
                      {currentMovieConsensus.count === 1 ? "review" : "reviews"})
                    </span>
                  </div>
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider rounded bg-amber-500/20 px-2 py-0.5">
                  Multi-Review Average
                </span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Detailed Critique <span className="text-rose-500">*</span>
              </label>
              <textarea
                className="input h-28 text-xs resize-none leading-relaxed"
                placeholder="Discuss plot structure, character depth, pacing, cinematography, or thematic resonance..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Your rating directly influences the calculated movie average score.
              </span>
              <button
                type="submit"
                disabled={submitting}
                className="btn text-xs py-2 px-5 bg-rose-600 hover:bg-rose-500 text-white font-bold flex items-center gap-2 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <span className="animate-spin text-sm">⏳</span> Publishing...
                  </>
                ) : (
                  <>Publish Review</>
                )}
              </button>
            </div>
          </form>
        </section>

        {/* Calculated Movie Averages Showcase Bar */}
        {movieStats.list.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <span>🎬</span> Calculated Movie Averages
              </h2>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Aggregated across multiple community reviews
              </span>
            </div>

            <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-thin">
              <button
                type="button"
                onClick={() => setSelectedMovieFilter("ALL")}
                className={`rounded-xl px-3 py-2 text-xs font-bold transition shrink-0 flex items-center gap-1.5 border ${
                  selectedMovieFilter === "ALL"
                    ? "bg-rose-600 text-white border-rose-600 shadow-sm"
                    : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                }`}
              >
                <span>⭐</span> All Movies ({reviews.length})
              </button>

              {movieStats.list.map((m) => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() =>
                    setSelectedMovieFilter(selectedMovieFilter === m.title ? "ALL" : m.title)
                  }
                  className={`rounded-xl px-3 py-2 text-xs font-bold transition shrink-0 flex items-center gap-2.5 border ${
                    selectedMovieFilter.toLowerCase() === m.key
                      ? "bg-rose-600 text-white border-rose-600 shadow-md"
                      : "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                  }`}
                >
                  <img
                    src={m.poster}
                    alt={m.title}
                    className="w-5 h-7 object-cover rounded shadow-sm shrink-0"
                  />
                  <div className="text-left">
                    <div className="truncate max-w-[140px]">{m.title}</div>
                    <div className="text-[10px] flex items-center gap-1 opacity-90">
                      <span className="text-amber-400 font-black">★ {m.average}</span>
                      <span>•</span>
                      <span>
                        {m.count} {m.count === 1 ? "review" : "reviews"}
                      </span>
                    </div>
                  </div>
                  {m.isMultiReview && (
                    <span className="rounded bg-amber-500/20 text-amber-500 dark:text-amber-300 text-[9px] uppercase px-1 py-0.5 font-black">
                      Consensus
                    </span>
                  )}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Filter Toggle & Section Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 gap-3">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <span>💬</span> Community Critiques
            </h2>
            {selectedMovieFilter !== "ALL" && (
              <span className="rounded-lg bg-rose-500/10 border border-rose-500/30 px-2 py-0.5 text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                Filtered: {selectedMovieFilter}
                <button
                  type="button"
                  onClick={() => setSelectedMovieFilter("ALL")}
                  className="hover:text-rose-300 ml-1 font-bold"
                  title="Clear movie filter"
                >
                  ✕
                </button>
              </span>
            )}
          </div>

          {/* Show My Reviews Only Switch */}
          <div className="flex items-center gap-2">
            <label className="relative inline-flex items-center cursor-pointer select-none">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={myOnly}
                onChange={(e) => setMyOnly(e.target.checked)}
              />
              <div className="w-9 h-5 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-600"></div>
              <span className="ml-2 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <span>Show my reviews only</span>
                {user && (
                  <span className="rounded-full bg-slate-200 dark:bg-slate-800 px-1.5 py-0.2 text-[10px] font-bold text-slate-600 dark:text-slate-400">
                    {myReviewsCount}
                  </span>
                )}
              </span>
            </label>
          </div>
        </div>

        {/* When My Reviews Only is checked but user is not logged in */}
        {myOnly && !user && (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-6 text-center space-y-3">
            <span className="text-3xl">🔒</span>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Log In to View Your Reviews
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 max-w-md mx-auto">
              You have toggled "Show my reviews only", but you are currently browsing as a guest.
              Sign in or create an account to view and manage your personal critiques.
            </p>
            <div className="flex items-center justify-center gap-2.5 pt-1">
              <Link
                to="/login"
                className="btn text-xs py-1.5 px-4 bg-rose-600 hover:bg-rose-500 font-bold"
              >
                Sign In
              </Link>
              <button
                type="button"
                onClick={() => setMyOnly(false)}
                className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
              >
                Show All Community Critiques
              </button>
            </div>
          </div>
        )}

        {/* When My Reviews Only is checked, user is logged in, but has 0 reviews */}
        {myOnly && user && displayedReviews.length === 0 && !loading && (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-8 text-center space-y-3">
            <span className="text-3xl">✍️</span>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              No Personal Reviews Yet
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto">
              You haven't written any critiques yet under username{" "}
              <strong className="text-rose-500">{user.username}</strong>. Use the form above to
              write your first movie critique!
            </p>
            <button
              type="button"
              onClick={() => setMyOnly(false)}
              className="text-xs font-bold text-rose-500 hover:text-rose-400 underline pt-1"
            >
              Browse all community reviews instead →
            </button>
          </div>
        )}

        {/* Reviews List */}
        <section className="grid gap-4 md:grid-cols-2">
          {loading && (
            <p className="text-xs text-slate-500 dark:text-slate-400 col-span-full py-4 text-center">
              Loading reviews and calculating movie averages...
            </p>
          )}

          {!loading && displayedReviews.length === 0 && (!myOnly || user) && (
            <div className="col-span-full py-8 text-center text-xs text-slate-500 dark:text-slate-400 space-y-2">
              <p>No critiques found matching your filter.</p>
              {selectedMovieFilter !== "ALL" && (
                <button
                  type="button"
                  onClick={() => setSelectedMovieFilter("ALL")}
                  className="font-bold text-rose-500 hover:underline"
                >
                  Show all movies
                </button>
              )}
            </div>
          )}

          {safeArray(displayedReviews).map((r) => {
            const posterUrl =
              r.mediaPoster ||
              r.poster ||
              r.poster_path ||
              "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=300";

            // Lookup the calculated average for this movie
            const movieKey = (r.mediaTitle || r.movieTitle || "General Media").trim().toLowerCase();
            const stat = movieStats.byKey[movieKey];
            const avgRating = stat
              ? stat.average
              : r.movieAverage
              ? Number(r.movieAverage).toFixed(1)
              : Number(r.rating).toFixed(1);
            const reviewCount = stat ? stat.count : r.movieReviewCount || 1;
            const isMultiReviewer = reviewCount >= 2;

            const isAuthor =
              user &&
              (r.isMine ||
                r.authorUsername?.toLowerCase() === user.username?.toLowerCase() ||
                r.authorEmail?.toLowerCase() === user.email?.toLowerCase() ||
                r.author?.toLowerCase() === user.username?.toLowerCase());

            const canDelete =
              isAuthor || user?.isOwner || user?.role === "OWNER" || user?.role === "ADMIN";

            return (
              <article
                key={r.id}
                className="card flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700/80 transition-colors shadow-sm"
              >
                <div className="flex gap-3.5">
                  <img
                    src={posterUrl}
                    alt={r.mediaTitle || r.movieTitle || "Movie Poster"}
                    className="w-16 h-24 sm:w-20 sm:h-28 object-cover rounded-lg shadow-md border border-slate-200 dark:border-slate-800 shrink-0"
                  />

                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 line-clamp-2 leading-snug">
                        {r.reviewTitle || `Critique of ${r.mediaTitle || r.movieTitle}`}
                      </h3>

                      {/* Reviewer's individual rating */}
                      <span
                        className="rounded-md bg-rose-500/20 border border-rose-500/30 px-2 py-0.5 text-xs font-black text-rose-700 dark:text-rose-300 shrink-0"
                        title="Reviewer's rating for this critique"
                      >
                        ★ {r.rating} / 10
                      </span>
                    </div>

                    {/* Movie title and calculated community average */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
                        <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1">
                          🎬 {r.mediaTitle || r.movieTitle || "Movie"}
                        </span>
                        <span className="text-slate-400">•</span>
                        <span className="text-slate-500 dark:text-slate-400">
                          By{" "}
                          <span className="text-rose-600 dark:text-rose-400 font-semibold">
                            {r.author || r.authorUsername || "Reviewer"}
                          </span>
                        </span>
                      </div>

                      {/* Movie Average Badge */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="inline-flex items-center gap-1 rounded bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300">
                          <span>📊 Movie Avg:</span>
                          <span className="font-black text-rose-600 dark:text-rose-400">
                            ★ {avgRating} / 10
                          </span>
                          <span className="text-slate-500 dark:text-slate-400 font-normal">
                            ({reviewCount} {reviewCount === 1 ? "review" : "reviews"})
                          </span>
                        </span>

                        {isMultiReviewer && (
                          <span className="rounded bg-teal-500/15 border border-teal-500/30 px-1.5 py-0.5 text-[9px] uppercase font-black text-teal-700 dark:text-teal-300">
                            Multi-Reviewer Consensus
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed line-clamp-4 mt-1.5">
                      {r.content || r.comment}
                    </p>
                  </div>
                </div>

                <div className="pt-2 mt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                  {/* Like button */}
                  <button
                    type="button"
                    onClick={() => handleToggleLike(r.id)}
                    className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition"
                  >
                    <span>{r.liked ? "❤️" : "🤍"}</span>
                    <span className="font-semibold">{r.likes || 0}</span>
                  </button>

                  {/* Delete button if permitted */}
                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => handleDelete(r.id)}
                      className="text-[10px] font-bold text-rose-600 dark:text-rose-400 hover:text-rose-500 hover:underline"
                    >
                      Delete Review
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </section>
      </main>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        title="Sign In Required to Post Reviews"
        description="You are browsing PlotForge as a guest. Please sign up or log in to write critiques and influence movie average ratings."
      />

      <Footer />
    </div>
  );
}
