import { useState } from "react";
import MovieSearch from "./MovieSearch";

export default function FanEditor({ onSubmit, loading }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isConnectedToMovie, setIsConnectedToMovie] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [relationType, setRelationType] = useState("ALTERNATE_ENDING");

  function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    onSubmit({
      title,
      content,
      isConnectedToMovie,
      mediaTitle: isConnectedToMovie ? (selectedMedia?.title || "") : "",
      mediaPoster: isConnectedToMovie ? (selectedMedia?.poster || selectedMedia?.poster_path || "") : "",
      mediaType: isConnectedToMovie ? (selectedMedia?.type || "") : "",
      relationType: isConnectedToMovie ? relationType : "ORIGINAL"
    });
    setTitle("");
    setContent("");
    setSelectedMedia(null);
  }

  return (
    <div className="card space-y-4">
      <h3 className="text-lg font-bold text-slate-100">Publish Fan Theory / Alternate Ending</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Title</label>
          <input
            type="text"
            className="input text-sm"
            placeholder="e.g. What if Tony Stark survived in Endgame?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3 space-y-3">
          <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              className="rounded border-slate-700 bg-slate-950 text-purple-500 focus:ring-purple-500"
              checked={isConnectedToMovie}
              onChange={(e) => setIsConnectedToMovie(e.target.checked)}
            />
            <span>This theory is connected to an existing movie/series</span>
          </label>

          {isConnectedToMovie && (
            <div className="pt-2 border-t border-slate-800/60 grid gap-3 sm:grid-cols-2 items-start">
              <MovieSearch selectedMedia={selectedMedia} onSelectMedia={setSelectedMedia} />

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Relationship / Theory Type
                </label>
                <select
                  className="input text-xs py-2 w-full"
                  value={relationType}
                  onChange={(e) => setRelationType(e.target.value)}
                >
                  <option value="ALTERNATE_ENDING">Alternate Ending / Timeline</option>
                  <option value="SEQUEL">Sequel Theory</option>
                  <option value="PREQUEL">Prequel / Origin Theory</option>
                  <option value="SPINOFF">Spinoff Concept</option>
                </select>
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Theory Content</label>
          <textarea
            className="input h-36 resize-none text-sm leading-relaxed"
            placeholder="Describe your alternate timeline or future prediction in detail..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="btn text-xs py-2 px-5"
          >
            {loading ? "Publishing..." : "Publish Theory"}
          </button>
        </div>
      </form>
    </div>
  );
}
