import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import MovieSearch from "../components/MovieSearch";
import { createReview, deleteReview, getReviews } from "../services/reviewService";
import { extractApiError } from "../utils/errors";

export default function ReviewsPage() {
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [title, setTitle] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState(8);
  const [mineOnly, setMineOnly] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const mediaType = useMemo(() => {
    if (!selectedMedia) return null;
    return selectedMedia.media_type === "tv" ? "TV" : "MOVIE";
  }, [selectedMedia]);

  async function loadReviews(mine = mineOnly) {
    setLoading(true);
    setError("");
    try {
      const data = await getReviews(mine);
      setReviews(data || []);
    } catch (err) {
      setError(extractApiError(err, "Could not load reviews"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReviews();
  }, [mineOnly]); // eslint-disable-line react-hooks/exhaustive-deps

  async function onSubmit(e) {
    e.preventDefault();

    if (!selectedMedia) {
      setError("Please select a movie or TV show to review");
      return;
    }

    setSaving(true);
    setError("");
    try {
      await createReview({
        title,
        reviewText,
        rating,
        mediaId: selectedMedia.id,
        mediaTitle: selectedMedia.title || selectedMedia.name,
        posterPath: selectedMedia.poster_path,
        mediaType
      });
      setTitle("");
      setReviewText("");
      setRating(8);
      setSelectedMedia(null);
      await loadReviews();
    } catch (err) {
      setError(extractApiError(err, "Could not create review"));
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id) {
    if (!window.confirm("Delete this review?")) return;
    try {
      await deleteReview(id);
      setReviews((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      setError(extractApiError(err, "Could not delete review"));
    }
  }

  return (
    <div className="min-h-screen bg-base text-slate-100">
      <Navbar />
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        <section className="card">
          <h1 className="text-2xl font-bold">Reviews</h1>
          <p className="mt-1 text-sm text-slate-300">Review any movie or series with your own rating and opinion.</p>
        </section>

        <MovieSearch selectedMedia={selectedMedia} onSelect={setSelectedMedia} />

        <form className="card space-y-3" onSubmit={onSubmit}>
          <input
            className="input"
            placeholder="Review title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={180}
            required
          />
          <div>
            <label className="mb-1 block text-sm text-slate-300">Rating (1-10)</label>
            <input
              className="input"
              type="number"
              min={1}
              max={10}
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
              required
            />
          </div>
          <textarea
            className="input min-h-[150px]"
            placeholder="Write your detailed review..."
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            required
          />
          {error && <p className="text-sm text-rose-400">{error}</p>}
          <div className="flex justify-end">
            <button className="btn" type="submit" disabled={saving}>
              {saving ? "Publishing..." : "Publish Review"}
            </button>
          </div>
        </form>

        <section className="card">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold">Community Reviews</h2>
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={mineOnly}
                onChange={(e) => setMineOnly(e.target.checked)}
              />
              Show only my reviews
            </label>
          </div>

          {loading ? (
            <p className="mt-4 text-sm text-slate-400">Loading reviews...</p>
          ) : reviews.length === 0 ? (
            <p className="mt-4 text-sm text-slate-400">No reviews yet.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {reviews.map((review) => {
                const poster = review.posterPath
                  ? `https://image.tmdb.org/t/p/w185${review.posterPath}`
                  : "https://via.placeholder.com/185x278?text=No+Poster";

                return (
                  <article key={review.id} className="rounded-xl border border-slate-800 bg-slate-900/80 p-3">
                    <div className="grid gap-3 md:grid-cols-[90px_1fr]">
                      <img src={poster} alt={review.mediaTitle} className="h-32 w-24 rounded object-cover" />
                      <div>
                        <p className="text-xs uppercase tracking-wide text-blue-300">{review.mediaType}</p>
                        <h3 className="mt-1 text-lg font-semibold text-slate-100">{review.title}</h3>
                        <p className="text-sm text-slate-300">For: {review.mediaTitle}</p>
                        <p className="mt-1 text-sm text-amber-300">Rating: {review.rating}/10</p>
                        <p className="mt-2 whitespace-pre-wrap text-sm text-slate-200">{review.reviewText}</p>
                        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                          <span>By {review.authorUsername}</span>
                          {review.createdAt && (
                            <span>{new Date(review.createdAt).toLocaleString()}</span>
                          )}
                          {review.canDelete && (
                            <button
                              type="button"
                              className="rounded bg-red-700 px-2 py-1 text-xs font-semibold text-white"
                              onClick={() => onDelete(review.id)}
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
