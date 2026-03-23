import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import {
  createFanComment,
  deleteFanPost,
  getFanComments,
  getFanPostById,
  getMovieById,
  getTvById,
  likeFanPost
} from "../services/fanFutureService";
import { extractApiError } from "../utils/errors";

export default function FanFutureDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [mediaDetails, setMediaDetails] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadDetail() {
    setLoading(true);
    setError("");
    try {
      const currentPost = await getFanPostById(id);
      setPost(currentPost);

      const [detailData, commentData] = await Promise.all([
        currentPost.mediaType === "TV" ? getTvById(currentPost.mediaId) : getMovieById(currentPost.mediaId),
        getFanComments(currentPost.id)
      ]);

      setMediaDetails(detailData);
      setComments(commentData || []);
    } catch (err) {
      setError(extractApiError(err, "Could not load post details"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDetail();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function onLike() {
    if (!post) return;
    const updated = await likeFanPost(post.id);
    setPost(updated);
  }

  async function onComment(e) {
    e.preventDefault();
    if (!commentText.trim() || !post) return;

    const created = await createFanComment({ postId: post.id, text: commentText.trim() });
    setCommentText("");
    setComments((prev) => [created, ...prev]);
  }

  async function onDeletePost() {
    if (!post?.id) return;
    if (!window.confirm("Delete this fan future post?")) return;

    try {
      await deleteFanPost(post.id);
      navigate("/fanfuture");
    } catch (err) {
      setError(extractApiError(err, "Could not delete post"));
    }
  }

  if (loading) {
    return <div className="min-h-screen bg-base text-slate-100"><Navbar /><div className="mx-auto max-w-6xl px-4 py-6">Loading...</div></div>;
  }

  if (error || !post) {
    return <div className="min-h-screen bg-base text-slate-100"><Navbar /><div className="mx-auto max-w-6xl px-4 py-6 text-rose-400">{error || "Post not found"}</div></div>;
  }

  const poster = post.posterPath
    ? `https://image.tmdb.org/t/p/w500${post.posterPath}`
    : "https://via.placeholder.com/500x750?text=No+Poster";

  const relationLine = post.relationType === "ALTERNATE_ENDING"
    ? `Alternate Ending: ${post.mediaTitle}`
    : post.relationType === "SEQUEL"
      ? `Prediction for: ${post.mediaTitle}`
      : `Theory for: ${post.mediaTitle}`;

  return (
    <div className="min-h-screen bg-base text-slate-100">
      <Navbar />
      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[320px_1fr]">
        <aside className="card h-fit">
          <img src={poster} alt={post.mediaTitle} className="h-auto w-full rounded-lg object-cover" />
          <h2 className="mt-3 text-lg font-semibold">{post.mediaTitle}</h2>
          <p className="mt-2 text-sm text-slate-300">{mediaDetails?.overview || "No media overview available."}</p>
        </aside>

        <section className="space-y-6">
          <article className="card">
            <p className="text-xs uppercase tracking-wide text-blue-300">{post.mediaType}</p>
            <h1 className="mt-1 text-3xl font-bold">{post.title}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <p className="text-sm text-slate-300">{relationLine}</p>
            </div>
            <p className="mt-1 text-sm text-slate-400">By {post.authorUsername}</p>
            {post.issuesOrProblems && (
              <div className="mt-4 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-300">Issues / Problems Raised</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-amber-100">{post.issuesOrProblems}</p>
              </div>
            )}
            <div className="mt-4 whitespace-pre-wrap text-slate-200">{post.content}</div>
            <div className="mt-5 flex flex-wrap gap-2">
              <button className="btn" onClick={onLike}>Like Post</button>
              {post.canDelete && (
                <button className="rounded bg-red-700 px-4 py-2 text-sm font-semibold text-white" onClick={onDeletePost}>
                  Delete Post
                </button>
              )}
            </div>
          </article>

          <section className="card">
            <h3 className="text-xl font-semibold">Comments</h3>
            <form className="mt-3 flex gap-2" onSubmit={onComment}>
              <input
                className="input"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add your thoughts..."
              />
              <button className="btn" type="submit">Post</button>
            </form>

            <div className="mt-4 space-y-3">
              {comments.map((comment) => (
                <div key={comment.id} className="rounded-lg border border-slate-800 bg-slate-900 p-3">
                  <p className="text-sm font-semibold text-slate-200">{comment.username}</p>
                  <p className="mt-1 text-sm text-slate-300">{comment.text}</p>
                </div>
              ))}
              {comments.length === 0 && <p className="text-sm text-slate-400">No comments yet.</p>}
            </div>
          </section>
        </section>
      </main>
    </div>
  );
}
