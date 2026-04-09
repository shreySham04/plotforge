import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { createFanConcept, getFanConcepts, rateFanConcept } from "../services/fanConceptService";

const TYPE_OPTIONS = [
  { label: "Upload Fanmade Poster", value: "POSTER" },
  { label: "Upload Fanmade Teaser/Trailer", value: "TRAILER" }
];

function getTypeLabel(type) {
  return type === "TRAILER" ? "Teaser/Trailer" : "Poster";
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}

function StarRating({ value, onSelect, disabled = false }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((score) => (
        <button
          key={score}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(score)}
          className={`rounded px-1 text-lg leading-none transition ${
            score <= value ? "text-amber-300" : "text-slate-500"
          } ${disabled ? "cursor-not-allowed opacity-60" : "hover:text-amber-200"}`}
          title={`Rate ${score} out of 5`}
        >
          {score <= value ? "★" : "☆"}
        </button>
      ))}
    </div>
  );
}

export default function FanConceptPage() {
  const { user } = useAuth();
  const [type, setType] = useState("POSTER");
  const [title, setTitle] = useState("");
  const [mediaTitle, setMediaTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assetDataUrl, setAssetDataUrl] = useState("");
  const [previewError, setPreviewError] = useState("");
  const [feedFilter, setFeedFilter] = useState("ALL");
  const [items, setItems] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const acceptedFileType = useMemo(
    () => (type === "POSTER" ? "image/*" : "video/*"),
    [type]
  );

  function loadItems(nextFilter = feedFilter) {
    const list = getFanConcepts({
      type: nextFilter,
      username: user?.username || ""
    });
    setItems(list);
  }

  useEffect(() => {
    loadItems(feedFilter);
  }, [feedFilter, user?.username]); // eslint-disable-line react-hooks/exhaustive-deps

  async function onFileChange(e) {
    setPreviewError("");
    const file = e.target.files?.[0];

    if (!file) {
      setAssetDataUrl("");
      return;
    }

    const maxBytes = 8 * 1024 * 1024;
    if (file.size > maxBytes) {
      setPreviewError("File must be 8MB or smaller");
      setAssetDataUrl("");
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setAssetDataUrl(dataUrl);
    } catch {
      setPreviewError("Could not process selected file");
      setAssetDataUrl("");
    }
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");

    if (!assetDataUrl) {
      setError("Please upload a file first");
      return;
    }

    setSaving(true);
    try {
      createFanConcept({
        type,
        title,
        mediaTitle,
        description,
        assetDataUrl,
        authorUsername: user?.username || "anonymous"
      });

      setTitle("");
      setMediaTitle("");
      setDescription("");
      setAssetDataUrl("");
      setPreviewError("");
      loadItems(feedFilter);
    } catch (err) {
      setError(err?.message || "Could not create fan concept");
    } finally {
      setSaving(false);
    }
  }

  function onRate(itemId, score) {
    try {
      rateFanConcept(itemId, score, user?.username || "");
      loadItems(feedFilter);
    } catch (err) {
      setError(err?.message || "Could not submit rating");
    }
  }

  return (
    <div className="min-h-screen bg-base text-slate-100">
      <Navbar />
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        <section className="rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/50 p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Fanconcept</p>
          <h1 className="mt-2 text-3xl font-bold">Upload Fanmade Posters And Trailers</h1>
          <p className="mt-2 max-w-3xl text-slate-300">
            Choose one format, upload your fan concept, and let the community rate it.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {TYPE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`rounded-md px-3 py-1 text-sm transition ${
                  type === option.value
                    ? "bg-cyan-600 text-white"
                    : "bg-slate-800 text-slate-200 hover:bg-slate-700"
                }`}
                onClick={() => setType(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </section>

        <form className="card space-y-3" onSubmit={onSubmit}>
          <h2 className="text-xl font-semibold">Create New Fan Concept</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-slate-300">Title</label>
              <input
                className="input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={160}
                placeholder={type === "POSTER" ? "Poster title" : "Trailer title"}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-300">Movie/Show Name</label>
              <input
                className="input"
                value={mediaTitle}
                onChange={(e) => setMediaTitle(e.target.value)}
                maxLength={160}
                placeholder="Example: Dune Part Three"
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm text-slate-300">
              {type === "POSTER" ? "Upload fanmade poster" : "Upload fanmade teaser/trailer"}
            </label>
            <input className="input" type="file" accept={acceptedFileType} onChange={onFileChange} required />
            <p className="mt-1 text-xs text-slate-400">Maximum file size: 8MB</p>
            {previewError && <p className="mt-1 text-sm text-rose-400">{previewError}</p>}
          </div>

          {assetDataUrl && (
            <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-3">
              <p className="mb-2 text-sm text-slate-300">Preview</p>
              {type === "POSTER" ? (
                <img src={assetDataUrl} alt="Uploaded poster preview" className="max-h-80 rounded-lg object-contain" />
              ) : (
                <video src={assetDataUrl} controls className="max-h-80 w-full rounded-lg bg-black" />
              )}
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm text-slate-300">Description</label>
            <textarea
              className="input min-h-[120px]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your fan concept idea"
              required
            />
          </div>

          {error && <p className="text-sm text-rose-400">{error}</p>}

          <div className="flex justify-end">
            <button className="btn" type="submit" disabled={saving}>
              {saving ? "Uploading..." : `Upload ${getTypeLabel(type)}`}
            </button>
          </div>
        </form>

        <section className="card">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold">Community Fanconcepts</h2>
            <select
              className="input max-w-[220px]"
              value={feedFilter}
              onChange={(e) => setFeedFilter(e.target.value)}
            >
              <option value="ALL">All Concepts</option>
              <option value="POSTER">Poster Uploads</option>
              <option value="TRAILER">Teaser/Trailer Uploads</option>
            </select>
          </div>

          {items.length === 0 ? (
            <p className="mt-4 text-sm text-slate-400">No fan concepts yet. Be the first one to upload.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {items.map((item) => (
                <article key={item.id} className="rounded-xl border border-slate-800 bg-slate-900/80 p-3">
                  <div className="grid gap-3 md:grid-cols-[220px_1fr]">
                    <div className="rounded-lg border border-slate-700 bg-slate-950/60 p-2">
                      {item.type === "POSTER" ? (
                        <img
                          src={item.assetDataUrl}
                          alt={item.title}
                          className="h-56 w-full rounded object-cover"
                        />
                      ) : (
                        <video src={item.assetDataUrl} controls className="h-56 w-full rounded bg-black" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-cyan-300">{getTypeLabel(item.type)}</p>
                      <h3 className="mt-1 text-lg font-semibold text-slate-100">{item.title}</h3>
                      <p className="text-sm text-slate-300">For: {item.mediaTitle}</p>
                      <p className="mt-2 whitespace-pre-wrap text-sm text-slate-200">{item.description}</p>

                      <div className="mt-3 flex flex-wrap items-center gap-4">
                        <div>
                          <p className="text-xs text-slate-400">Rate this</p>
                          <StarRating value={item.userRating || 0} onSelect={(score) => onRate(item.id, score)} />
                        </div>
                        <div className="text-sm text-amber-300">
                          Average: {item.averageRating ? item.averageRating.toFixed(1) : "0.0"}/5
                          <span className="ml-2 text-xs text-slate-400">({item.ratingCount} ratings)</span>
                        </div>
                      </div>

                      <div className="mt-3 text-xs text-slate-400">
                        <span>By {item.authorUsername}</span>
                        <span className="ml-3">{new Date(item.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
