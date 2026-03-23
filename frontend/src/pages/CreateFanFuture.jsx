import { useMemo, useState } from "react";
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import FanEditor from "../components/FanEditor";
import MovieSearch from "../components/MovieSearch";
import { createFanPost } from "../services/fanFutureService";
import { extractApiError } from "../utils/errors";

export default function CreateFanFuture() {
  const navigate = useNavigate();
  const location = useLocation();
  const preselected = location.state?.selectedMedia || null;

  const [selectedMedia, setSelectedMedia] = useState(preselected);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [issuesOrProblems, setIssuesOrProblems] = useState("");
  const [relationType, setRelationType] = useState("THEORY");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const mediaType = useMemo(() => {
    if (!selectedMedia) return null;
    return selectedMedia.media_type === "tv" ? "TV" : "MOVIE";
  }, [selectedMedia]);

  async function onSubmit(e) {
    e.preventDefault();

    if (!selectedMedia) {
      setError("Please select a movie or TV show first");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const created = await createFanPost({
        title,
        content,
        mediaId: selectedMedia.id,
        mediaTitle: selectedMedia.title || selectedMedia.name,
        posterPath: selectedMedia.poster_path,
        mediaType,
        relationType,
        issuesOrProblems: issuesOrProblems.trim() || null
      });
      navigate(`/fanfuture/${created.id}`);
    } catch (err) {
      setError(extractApiError(err, "Could not create fan future post"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-base text-slate-100">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-6">
        <section className="card mb-6">
          <h1 className="text-2xl font-bold">Create Fan Future Post</h1>
          <p className="mt-1 text-sm text-slate-300">Write your prediction, theory, or alternate ending for any movie or TV show.</p>
        </section>

        <MovieSearch selectedMedia={selectedMedia} onSelect={setSelectedMedia} />

        <form className="card mt-6 space-y-3" onSubmit={onSubmit}>
          <input
            className="input"
            placeholder="Post title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <div className="grid gap-3 md:grid-cols-2">
            <select className="input" value={relationType} onChange={(e) => setRelationType(e.target.value)}>
              <option value="THEORY">THEORY</option>
              <option value="SEQUEL">PREDICTION</option>
              <option value="ALTERNATE_ENDING">ALTERNATE ENDING</option>
            </select>
          </div>
          <textarea
            className="input min-h-[110px]"
            placeholder="Any issues/problems with the series or movie you want to address in your idea?"
            value={issuesOrProblems}
            onChange={(e) => setIssuesOrProblems(e.target.value)}
            maxLength={1500}
          />
          <FanEditor value={content} onChange={setContent} placeholder="What happens in your fan-made future timeline?" />
          {error && <p className="text-sm text-rose-400">{error}</p>}
          <div className="flex justify-end">
            <button className="btn" type="submit" disabled={saving}>
              {saving ? "Publishing..." : "Publish Fan Future"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
