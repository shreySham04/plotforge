import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ProjectCard from "../components/ProjectCard";
import MovieSearch from "../components/MovieSearch";
import AICopilotModal from "../components/AICopilotModal";
import AuthModal from "../components/AuthModal";
import { useAuth } from "../context/AuthContext";
import {
  getProjects,
  createProject,
  deleteProject,
  getShareLink,
  exportPdf,
  exportTxt
} from "../services/projectService";
import { extractApiError } from "../utils/errors";
import { safeArray } from "../utils/data";
import { getPersonaById } from "../utils/aiPersonas";
import { ALL_GENRES, getProjectGenres } from "../utils/genres";

export default function StoriesPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL"); // ALL, PUBLIC, IN_PROGRESS, COMPLETED
  const [searchQuery, setSearchQuery] = useState("");

  const [title, setTitle] = useState("");
  const [genre1, setGenre1] = useState("Fantasy");
  const [genre2, setGenre2] = useState("Adventure");
  const [genre3, setGenre3] = useState("NONE");
  const [isPublic, setIsPublic] = useState(false);
  const [isConnectedToMovie, setIsConnectedToMovie] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [relationType, setRelationType] = useState("SEQUEL");

  async function loadStories() {
    setLoading(true);
    setError("");
    try {
      const data = await getProjects(0, 50);
      const list = safeArray(data);
      setProjects(list.filter((p) => p.type === "STORY"));
    } catch (err) {
      setError(extractApiError(err, "Could not load stories"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStories();
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    if (!title.trim()) return;
    try {
      const g3 = (genre3 && genre3 !== "NONE" && genre3 !== "None") ? genre3 : "";
      const subjectString = [genre1, genre2, g3].filter(Boolean).join(" / ");

      await createProject({
        title,
        type: "STORY",
        genre1,
        genre2,
        genre3: g3,
        subject: subjectString,
        isPublic,
        isConnectedToMovie,
        mediaTitle: isConnectedToMovie ? (selectedMedia?.title || "") : "",
        mediaPoster: isConnectedToMovie ? (selectedMedia?.poster || selectedMedia?.poster_path || "") : "",
        mediaType: isConnectedToMovie ? (selectedMedia?.type || "") : "",
        relationType: isConnectedToMovie ? relationType : "ORIGINAL"
      });
      setTitle("");
      setIsConnectedToMovie(false);
      setSelectedMedia(null);
      await loadStories();
    } catch (err) {
      setError(extractApiError(err, "Could not create story project"));
    }
  }

  async function handleDelete(id) {
    try {
      await deleteProject(id);
      await loadStories();
    } catch (err) {
      setError(extractApiError(err, "Could not delete story"));
    }
  }

  async function handleShare(id) {
    try {
      const link = await getShareLink(id);
      await navigator.clipboard.writeText(link);
      alert("Share link copied to clipboard!");
    } catch {
      alert("Could not generate share link");
    }
  }

  const filtered = safeArray(projects).filter((p) => {
    if (selectedSubject !== "ALL") {
      const pGenres = getProjectGenres(p);
      if (!pGenres.includes(selectedSubject) && p.subject !== selectedSubject) {
        return false;
      }
    }
    if (filterStatus === "PUBLIC" && !p.isPublic) return false;
    if (filterStatus === "COMPLETED" && !p.isCompleted) return false;
    if (filterStatus === "IN_PROGRESS" && p.isCompleted) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const pGenres = getProjectGenres(p).map((g) => g.toLowerCase());
      const titleMatch = p.title?.toLowerCase().includes(q);
      const genreMatch =
        pGenres.some((g) => g.includes(q)) ||
        p.genre1?.toLowerCase().includes(q) ||
        p.genre2?.toLowerCase().includes(q) ||
        p.genre3?.toLowerCase().includes(q) ||
        p.subject?.toLowerCase().includes(q);
      const mediaMatch = p.mediaTitle?.toLowerCase().includes(q);
      const tagMatch = Array.isArray(p.tags) ? p.tags.some((t) => t.toLowerCase().includes(q)) : false;

      return titleMatch || genreMatch || mediaMatch || tagMatch;
    }

    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070b12] text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 py-8 flex-1 space-y-8">
        <header className="space-y-2">
          <div className="theme-pill">
            <span>📖</span> Story Workspace
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Long-Form Story Projects</h1>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Create, outline, and write chapter-based creative stories with built-in subject tags and collaborative editing.
          </p>
        </header>

        {/* Guest Banner if not logged in */}
        {!user && (
          <div className="rounded-2xl theme-bg-subtle p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-800 dark:text-slate-200">
            <div className="flex items-center gap-2.5">
              <span className="text-lg">👋</span>
              <div>
                <p className="font-bold text-slate-900 dark:text-white text-sm">Guest Preview Mode</p>
                <p className="text-slate-600 dark:text-slate-300/80">You can browse and read all community stories below. Sign up or log in to create and write your own stories!</p>
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

        {/* Story Creation Form */}
        <section className="card space-y-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Create New Story</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Story Title</label>
              <input
                type="text"
                className="input text-sm"
                placeholder="e.g. Chronicles of Eldoria"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            {/* 3 Genre Selectors */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/40 p-3 space-y-2">
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="block text-[11px] font-bold theme-text mb-1">
                    🎯 Primary Genre <span className="text-rose-500">*</span>
                  </label>
                  <select
                    className="input text-xs py-2 w-full dark:bg-slate-900"
                    value={genre1}
                    onChange={(e) => setGenre1(e.target.value)}
                    required
                  >
                    {ALL_GENRES.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    🎨 Secondary Genre <span className="text-rose-500">*</span>
                  </label>
                  <select
                    className="input text-xs py-2 w-full dark:bg-slate-900"
                    value={genre2}
                    onChange={(e) => setGenre2(e.target.value)}
                    required
                  >
                    {ALL_GENRES.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    ✨ Tertiary Genre <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <select
                    className="input text-xs py-2 w-full dark:bg-slate-900"
                    value={genre3}
                    onChange={(e) => setGenre3(e.target.value)}
                  >
                    <option value="NONE">-- None (Optional) --</option>
                    {ALL_GENRES.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/60 p-3 space-y-3">
              <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                  checked={isConnectedToMovie}
                  onChange={(e) => setIsConnectedToMovie(e.target.checked)}
                />
                <span>This story is connected to an existing movie/series</span>
              </label>

              {isConnectedToMovie && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800/60 grid gap-3 sm:grid-cols-2 items-start">
                  <MovieSearch selectedMedia={selectedMedia} onSelectMedia={setSelectedMedia} />

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Relationship / Connection Type
                    </label>
                    <select
                      className="input text-xs py-2 w-full dark:bg-slate-900"
                      value={relationType}
                      onChange={(e) => setRelationType(e.target.value)}
                    >
                      <option value="SEQUEL">Sequel</option>
                      <option value="PREQUEL">Prequel</option>
                      <option value="SPINOFF">Spinoff</option>
                      <option value="ALTERNATE_ENDING">Alternate Timeline / Fan Concept</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                />
                <span>Publish to Public Stories list</span>
              </label>

              <button type="submit" className="btn text-xs py-2.5 px-6 font-bold cursor-pointer">
                Create Story
              </button>
            </div>
          </form>

          {error && <p className="text-xs text-rose-400">{error}</p>}
        </section>

        {/* Search Bar & Filters */}
        <section className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 p-3.5 rounded-2xl shadow-sm">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 text-sm">
              🔍
            </span>
            <input
              type="text"
              className="input text-xs pl-9 pr-8 py-2 w-full dark:bg-slate-950/80 border-slate-300 dark:border-slate-700/80 focus:border-teal-500 transition rounded-xl"
              placeholder="Search stories by title, genre, subject, or tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-200 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">Genre:</span>
              <select
                className="input text-xs py-2 dark:bg-slate-950/80 border-slate-300 dark:border-slate-700/80 rounded-xl"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
              >
                <option value="ALL">All Genres ({ALL_GENRES.length})</option>
                {ALL_GENRES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1">
              {["ALL", "PUBLIC", "IN_PROGRESS", "COMPLETED"].map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition ${
                    filterStatus === st
                      ? "bg-teal-400 text-slate-950"
                      : "bg-slate-800/70 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {st.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Stories Grid */}
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {loading && projects.length === 0 && (
            <div className="card col-span-full text-center text-xs text-slate-400 py-8">
              Loading stories...
            </div>
          )}
          {!loading && filtered.length === 0 && (
            <div className="card col-span-full text-center text-xs text-slate-400 py-8">
              No stories match your criteria. Create one above!
            </div>
          )}
          {filtered.map((proj) => (
            <ProjectCard
              key={proj.id}
              project={proj}
              onDelete={() => handleDelete(proj.id)}
              onShare={() => handleShare(proj.id)}
              onExportPdf={() => exportPdf(proj.id)}
              onExportTxt={() => exportTxt(proj.id)}
            />
          ))}
        </section>
      </main>

      {/* Floating AI Co-pilot Trigger Button */}
      {(() => {
        const persona = getPersonaById(user?.aiPersona);
        return (
          <button
            onClick={() => setCopilotOpen(true)}
            className={`fixed bottom-6 right-6 z-40 flex items-center gap-2.5 rounded-2xl ${persona.buttonBg} px-4 py-3 font-bold text-xs shadow-2xl hover:scale-105 active:scale-95 transition cursor-pointer border`}
            title={`Consult ${persona.name} for Story Advice`}
          >
            <span className="text-lg">{persona.emoji}</span>
            <span>{persona.buttonText}</span>
          </button>
        );
      })()}

      <AICopilotModal
        isOpen={copilotOpen}
        onClose={() => setCopilotOpen(false)}
        projectTitle="Stories Workspace"
      />

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        title="Sign In Required to Create Stories"
        description="You are browsing PlotForge as a guest. Please create an account or sign in to write, publish, and edit stories."
      />

      <Footer />
    </div>
  );
}
