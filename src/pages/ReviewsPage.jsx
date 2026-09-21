import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import MovieSearch from "../components/MovieSearch";
import AuthModal from "../components/AuthModal";
import { useAuth } from "../context/AuthContext";
import { getReviews, createReview, deleteReview } from "../services/reviewService";
import { safeArray } from "../utils/data";

export default function ReviewsPage() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [myOnly, setMyOnly] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Form
  const [reviewTitle, setReviewTitle] = useState("");
  const [rating, setRating] = useState(8);
  const [content, setContent] = useState("");
  const [selectedMedia, setSelectedMedia] = useState(null);

  async function loadReviews() {
    setLoading(true);
    try {
      const data = await getReviews(0, 20, myOnly);
      setReviews(safeArray(data));
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReviews();
  }, [myOnly]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    if (!reviewTitle.trim() || !content.trim()) return;

    const payload = {
      reviewTitle,
      rating: Number(rating),
      content,
      mediaTitle: selectedMedia?.title || "General Media",
      mediaPoster: selectedMedia?.poster || selectedMedia?.poster_path || "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=300"
    };

    try {
      const newRev = await createReview(payload);
      setReviews((prev) => [newRev, ...prev]);
    } catch {
      setReviews((prev) => [{ id: `rev-${Date.now()}`, ...payload, author: user.username || "You", isMine: true }, ...prev]);
    }

    setReviewTitle("");
    setContent("");
    setSelectedMedia(null);
  }

  async function handleDelete(id) {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    try {
      await deleteReview(id);
    } catch {
      // local delete
    }
    setReviews((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070b12] text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 py-8 flex-1 space-y-8">
        <header className="space-y-1">
          <div className="theme-pill">
            <span>⭐</span> Reviews &amp; Critiques
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Media &amp; Project Reviews</h1>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Critique movies, TV series, or community narrative releases with structured 1-10 star ratings.
          </p>
        </header>

        {/* Guest Banner if not logged in */}
        {!user && (
          <div className="rounded-2xl theme-bg-subtle p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-800 dark:text-slate-200">
            <div className="flex items-center gap-2.5">
              <span className="text-lg">⭐</span>
              <div>
                <p className="font-bold text-slate-900 dark:text-white text-sm">Guest Preview Mode</p>
                <p className="text-slate-600 dark:text-slate-300/80">You can browse community movie & media reviews. Sign up or log in to publish your own critiques!</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link to="/login" className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-1.5 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                Log In
              </Link>
              <Link to="/register" className="btn text-xs py-1.5 px-3.5">
                Sign Up
              </Link>
            </div>
          </div>
        )}

        {/* Review Form */}
        <section className="card space-y-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Write a Review</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Review Headline</label>
                <input
                  type="text"
                  className="input text-sm"
                  placeholder="e.g. Masterpiece in narrative tension"
                  value={reviewTitle}
                  onChange={(e) => setReviewTitle(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Rating (1 to 10)</label>
                <select
                  className="input text-sm font-bold text-rose-600 dark:text-rose-400 dark:bg-slate-900"
                  value={rating}
                  onChange={(e) => setRating(e.target.value)}
                >
                  {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((num) => (
                    <option key={num} value={num}>★ {num} / 10</option>
                  ))}
                </select>
              </div>
            </div>

            <MovieSearch selectedMedia={selectedMedia} onSelectMedia={setSelectedMedia} />

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Detailed Critique</label>
              <textarea
                className="input h-28 text-xs resize-none leading-relaxed"
                placeholder="Discuss plot structure, character depth, pacing, or cinematography..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
              />
            </div>

            <div className="flex justify-end">
              <button type="submit" className="btn text-xs py-2 px-5 bg-rose-600 hover:bg-rose-500 font-bold">
                Publish Review
              </button>
            </div>
          </form>
        </section>

        {/* Filter Toggle */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Community Critiques</h2>

          <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              className="rounded border-slate-700 bg-slate-950 text-rose-500"
              checked={myOnly}
              onChange={(e) => setMyOnly(e.target.checked)}
            />
            <span>Show my reviews only</span>
          </label>
        </div>

        {/* Reviews List */}
        <section className="grid gap-4 md:grid-cols-2">
          {loading && <p className="text-xs text-slate-400 col-span-full">Loading reviews...</p>}

          {safeArray(reviews).map((r) => {
            const posterUrl =
              r.mediaPoster ||
              r.poster ||
              r.poster_path ||
              "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=300";
            return (
              <article key={r.id} className="card flex flex-col justify-between hover:border-slate-700/80 transition-colors">
                <div className="flex gap-3.5">
                  <img
                    src={posterUrl}
                    alt={r.mediaTitle || "Movie Poster"}
                    className="w-16 h-24 sm:w-20 sm:h-28 object-cover rounded-lg shadow-md border border-slate-800 shrink-0"
                  />

                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-bold text-slate-100 line-clamp-2 leading-snug">{r.reviewTitle}</h3>
                      <span className="rounded-md bg-rose-500/20 border border-rose-500/30 px-2 py-0.5 text-xs font-bold text-rose-300 shrink-0">
                        ★ {r.rating} / 10
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 flex items-center gap-1.5 flex-wrap">
                      <span className="text-slate-200 font-semibold flex items-center gap-1">
                        🎬 {r.mediaTitle || r.projectTitle || "Movie"}
                      </span>
                      <span>•</span>
                      <span>By <span className="text-rose-400 font-medium">{r.author || r.authorUsername || "Reviewer"}</span></span>
                    </p>

                    <p className="text-xs text-slate-300 leading-relaxed line-clamp-4 mt-1">{r.content || r.comment}</p>
                  </div>
                </div>

                {(r.isMine || user?.isOwner || user?.role === "OWNER" || user?.role === "ADMIN") && (
                  <div className="pt-2 mt-3 border-t border-slate-800/80 flex justify-end">
                    <button
                      onClick={() => handleDelete(r.id)}
                      className="text-[10px] font-bold text-rose-400 hover:text-rose-300 hover:underline"
                    >
                      Delete Review
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </section>
      </main>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        title="Sign In Required to Post Reviews"
        description="You are browsing PlotForge as a guest. Please sign up or log in to write and publish reviews."
      />

      <Footer />
    </div>
  );
}
