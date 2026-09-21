import { useState } from "react";
import RelationBadge from "./RelationBadge";
import { addFanFutureComment, likeFanFuturePost } from "../services/fanFutureService";
import { useAuth } from "../context/AuthContext";

export default function FanPostCard({ post, onDelete }) {
  const { user } = useAuth();
  const [likes, setLikes] = useState(post.likesCount || post.likes || 0);
  const [hasLiked, setHasLiked] = useState(false);
  const [comments, setComments] = useState(post.comments || []);
  const [commentText, setCommentText] = useState("");
  const [showComments, setShowComments] = useState(false);

  const canDelete =
    user?.isOwner ||
    user?.role === "OWNER" ||
    user?.role === "ADMIN" ||
    post.isMine ||
    post.authorUsername === user?.username ||
    post.author === user?.username;

  async function handleLike() {
    if (hasLiked) return;
    try {
      await likeFanFuturePost(post.id);
      setLikes((prev) => prev + 1);
      setHasLiked(true);
    } catch {
      setLikes((prev) => prev + 1);
      setHasLiked(true);
    }
  }

  async function handleAddComment(e) {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      const newC = await addFanFutureComment(post.id, commentText);
      setComments((prev) => [...prev, newC]);
    } catch {
      setComments((prev) => [...prev, { id: Date.now(), text: commentText, author: "You" }]);
    }
    setCommentText("");
  }

  return (
    <article className="card space-y-3">
      <div className="flex gap-3">
        {post.mediaPoster && (
          <img
            src={post.mediaPoster}
            alt={post.mediaTitle || "Movie Poster"}
            className="w-12 h-16 object-cover rounded-md shadow border border-slate-700/80 shrink-0"
          />
        )}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-base font-bold text-slate-100 leading-snug">{post.title}</h4>
            <RelationBadge relationType={post.relationType || "ALTERNATE_ENDING"} />
          </div>
          <p className="text-xs text-slate-400">
            By <span className="text-purple-400 font-medium">{post.author || post.username || "FanCreator"}</span>
            {post.mediaTitle && (
              <span> • Ref: <span className="text-slate-200 font-semibold">{post.mediaTitle}</span></span>
            )}
          </p>
        </div>
      </div>

      <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">{post.content}</p>

      <div className="flex items-center gap-4 pt-2 border-t border-slate-800 text-xs">
        <button
          onClick={handleLike}
          className={`flex items-center gap-1.5 font-semibold transition ${
            hasLiked ? "text-rose-400" : "text-slate-400 hover:text-rose-400"
          }`}
        >
          <span>♥</span>
          <span>{likes} Likes</span>
        </button>

        <button
          onClick={() => setShowComments((v) => !v)}
          className="text-slate-400 hover:text-teal-400 font-semibold transition"
        >
          💬 {comments.length} Comments
        </button>

        {canDelete && (
          <button
            onClick={() => onDelete && onDelete(post.id)}
            className="text-rose-400 hover:text-rose-300 hover:underline font-bold transition ml-auto text-[10px]"
          >
            Delete Pitch
          </button>
        )}
      </div>

      {showComments && (
        <div className="space-y-3 pt-2 border-t border-slate-800/60">
          <form onSubmit={handleAddComment} className="flex gap-2">
            <input
              type="text"
              className="input text-xs py-1.5"
              placeholder="Write a reply or critique..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
            />
            <button type="submit" className="btn text-xs py-1.5 px-3">Reply</button>
          </form>

          <div className="space-y-2 max-h-48 overflow-auto">
            {comments.map((c, i) => (
              <div key={c.id || i} className="rounded-lg bg-slate-950/60 p-2 text-xs">
                <span className="font-bold text-teal-300">{c.author || c.username || "User"}: </span>
                <span className="text-slate-200">{c.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
