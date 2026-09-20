import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import MovieSearch from "../components/MovieSearch";
import AuthModal from "../components/AuthModal";
import { useAuth } from "../context/AuthContext";
import { getFanConcepts, createFanConcept, rateFanConcept, deleteFanConcept } from "../services/fanConceptService";
import { safeArray } from "../utils/data";

export default function FanConceptPage() {
  const { user } = useAuth();
  const [concepts, setConcepts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  
  // Creation state
  const [title, setTitle] = useState("");
  const [conceptUrl, setConceptUrl] = useState("");
  const [description, setDescription] = useState("");
  const [conceptType, setConceptType] = useState("POSTER"); // POSTER, TRAILER
  const [isConnectedToMovie, setIsConnectedToMovie] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [relationType, setRelationType] = useState("FAN_CONCEPT");

  async function loadConcepts() {
    setLoading(true);
    try {
      const data = await getFanConcepts(0, 20);
      setConcepts(safeArray(data));
    } catch {
      setConcepts([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadConcepts();
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    if (!title.trim() || !conceptUrl.trim()) return;

    const payload = {
      title,
      conceptUrl,
      description,
      conceptType,
      isConnectedToMovie,
      mediaTitle: isConnectedToMovie ? (selectedMedia?.title || "") : "",
      mediaPoster: isConnectedToMovie ? (selectedMedia?.poster || selectedMedia?.poster_path || "") : "",
      relationType: isConnectedToMovie ? relationType : "ORIGINAL"
    };

    try {
      const newConcept = await createFanConcept(payload);
      setConcepts((prev) => [newConcept, ...prev]);
    } catch {
      setConcepts((prev) => [
        { id: `fc-${Date.now()}`, ...payload, author: user.username || "You", rating: 10, ratingsCount: 1 },
        ...prev
      ]);
    }

    setTitle("");
    setConceptUrl("");
    setDescription("");
    setSelectedMedia(null);
  }

  async function handleRate(id, score) {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    try {
      await rateFanConcept(id, score);
    } catch {
      // update local
    }
    setConcepts((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const count = (c.ratingsCount || 0) + 1;
          const newAvg = Number((((c.rating || 0) * (count - 1) + score) / count).toFixed(1));
          return { ...c, rating: newAvg, ratingsCount: count };
        }
        return c;
      })
    );
  }

  async function handleDeleteConcept(id) {
    try {
      await deleteFanConcept(id);
      setConcepts((prev) => prev.filter((c) => c.id !== id));
    } catch {
      setConcepts((prev) => prev.filter((c) => c.id !== id));
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070b12] text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 py-8 flex-1 space-y-8">
        <header className="space-y-1">
          <div className="theme-pill">
            <span>🎨</span> Fan Concept Gallery
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Fan Posters &amp; Concept Art</h1>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Showcase your fan-made movie posters, concept trailers, character designs, and rate creative community submissions.
          </p>
        </header>

        {/* Guest Banner if not logged in */}
        {!user && (
          <div className="rounded-2xl theme-bg-subtle p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-800 dark:text-slate-200">
            <div className="flex items-center gap-2.5">
              <span className="text-lg">🎨</span>
              <div>
                <p className="font-bold text-slate-900 dark:text-white text-sm">Guest Preview Mode</p>
                <p className="text-slate-600 dark:text-slate-300/80">You can browse fan concept posters and key art. Sign up or log in to submit your artwork and rate concepts!</p>
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

        {/* Upload Form */}
        <section className="card space-y-4">
          <h2 className="text-lg font-bold text-slate-100">Upload Fan Concept</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Concept Title</label>
                <input
                  type="text"
                  className="input text-sm"
                  placeholder="e.g. Batman Beyond 2039 Poster"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Concept Type</label>
                <select
                  className="input text-sm"
                  value={conceptType}
                  onChange={(e) => setConceptType(e.target.value)}
                >
                  <option value="POSTER">Fan Poster / Key Art</option>
                  <option value="TRAILER">Trailer / Video Link</option>
                  <option value="CHARACTER">Character Design</option>
                </select>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3 space-y-3">
              <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-amber-500"
                  checked={isConnectedToMovie}
                  onChange={(e) => setIsConnectedToMovie(e.target.checked)}
                />
                <span>This concept is connected to an existing movie/series</span>
              </label>

              {isConnectedToMovie && (
                <div className="pt-2 border-t border-slate-800/60 grid gap-3 sm:grid-cols-2 items-start">
                  <MovieSearch selectedMedia={selectedMedia} onSelectMedia={setSelectedMedia} />

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-300">
                      Relationship / Concept Type
                    </label>
                    <select
                      className="input text-xs py-2 w-full"
                      value={relationType}
                      onChange={(e) => setRelationType(e.target.value)}
                    >
                      <option value="FAN_CONCEPT">Fan Concept / Key Art</option>
                      <option value="SEQUEL">Sequel Concept</option>
                      <option value="PREQUEL">Prequel Concept</option>
                      <option value="SPINOFF">Spinoff Art</option>
                      <option value="ALTERNATE_ENDING">Alternate Timeline</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Image or Video Embed URL</label>
              <input
                type="url"
                className="input text-sm"
                placeholder="https://images.unsplash.com/photo-..."
                value={conceptUrl}
                onChange={(e) => setConceptUrl(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Description & Process Notes</label>
              <textarea
                className="input h-20 text-xs resize-none"
                placeholder="Share your inspiration, software used, or lore explanation..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="flex justify-end">
              <button type="submit" className="btn text-xs py-2 px-5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold">
                Submit Fan Concept
              </button>
            </div>
          </form>
        </section>

        {/* Community Feed */}
        <section className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Community Showcase</h2>

          {loading && <p className="text-xs text-slate-400">Loading fan concepts...</p>}

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {safeArray(concepts).map((c) => (
              <div key={c.id} className="card space-y-3 overflow-hidden flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-950 border border-slate-800">
                    <img
                      src={c.conceptUrl}
                      alt={c.title}
                      className="w-full h-full object-cover hover:scale-105 transition duration-500"
                      onError={(e) => {
                        e.target.src = "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=600";
                      }}
                    />
                    <span className="absolute top-2 right-2 rounded-full bg-slate-950/80 px-2.5 py-0.5 text-[10px] font-bold uppercase text-amber-300 border border-amber-500/30">
                      {c.conceptType}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-100">{c.title}</h3>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>By <span className="text-amber-400 font-medium">{c.author || "Creator"}</span></span>
                    {c.mediaTitle && (
                      <span className="flex items-center gap-1.5 text-slate-300 font-medium bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                        {c.mediaPoster && (
                          <img src={c.mediaPoster} alt={c.mediaTitle} className="w-3.5 h-5 object-cover rounded" />
                        )}
                        <span>{c.mediaTitle}</span>
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300 line-clamp-2">{c.description}</p>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-amber-400 font-bold text-sm">★ {c.rating || "8.5"}</span>
                    <span className="text-[10px] text-slate-400 ml-1">({c.ratingsCount || 10})</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-slate-400">Rate:</span>
                      {[8, 9, 10].map((score) => (
                        <button
                          key={score}
                          onClick={() => handleRate(c.id, score)}
                          className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold hover:bg-amber-400 hover:text-slate-950 transition"
                        >
                          {score}
                        </button>
                      ))}
                    </div>

                    {(c.isMine || c.authorUsername === user?.username || c.author === user?.username || user?.isOwner || user?.email?.toLowerCase() === "shreyansh.ssharma@gmail.com") && (
                      <button
                        onClick={() => handleDeleteConcept(c.id)}
                        className="text-[10px] font-bold text-rose-400 hover:text-rose-300 hover:underline"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        title="Sign In Required for Fan Concepts"
        description="You are browsing PlotForge as a guest. Please sign up or log in to submit your fan concept art and rate community artwork."
      />

      <Footer />
    </div>
  );
}
