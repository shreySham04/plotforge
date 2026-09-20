import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import ProjectCard from "../components/ProjectCard";
import MovieSearch from "../components/MovieSearch";
import CollaborationInvitationsCard from "../components/CollaborationInvitationsCard";
import { useAuth } from "../context/AuthContext";
import {
  createProject,
  deleteProject,
  exportProjectPdf,
  exportProjectTxt,
  getProjects,
  getShareLink
} from "../services/projectService";
import { extractApiError } from "../utils/errors";
import { safeArray } from "../utils/data";
import { ALL_GENRES, getProjectGenres } from "../utils/genres";

export default function DashboardPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [page, setPage] = useState(0);
  const [pageInfo, setPageInfo] = useState({ totalPages: 1, hasNext: false, hasPrevious: false });
  
  const [form, setForm] = useState({
    title: "",
    type: "STORY",
    genre1: "Fantasy",
    genre2: "Adventure",
    genre3: "NONE",
    isPublic: false,
    isConnectedToMovie: false,
    selectedMedia: null,
    relationType: "SEQUEL"
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenreFilter, setSelectedGenreFilter] = useState("ALL");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadProjects(targetPage = page) {
    setLoading(true);
    setError("");
    try {
      const data = await getProjects(targetPage, 9);
      setProjects(safeArray(data));
      setPage(targetPage);
      setPageInfo({
        totalPages: data.totalPages || 1,
        hasNext: data.hasNext !== undefined ? data.hasNext : (targetPage + 1 < (data.totalPages || 1)),
        hasPrevious: data.hasPrevious !== undefined ? data.hasPrevious : targetPage > 0
      });
    } catch (err) {
      setError(extractApiError(err, "Could not load projects"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProjects(0);
  }, []);

  async function onCreate(e) {
    e.preventDefault();
    setError("");
    try {
      const g3 = (form.genre3 && form.genre3 !== "NONE" && form.genre3 !== "None") ? form.genre3 : "";
      const subjectString = [form.genre1, form.genre2, g3].filter(Boolean).join(" / ");

      await createProject({
        title: form.title,
        type: form.type,
        genre1: form.genre1,
        genre2: form.genre2,
        genre3: g3,
        subject: subjectString,
        isPublic: form.isPublic,
        isConnectedToMovie: form.isConnectedToMovie,
        mediaTitle: form.isConnectedToMovie ? (form.selectedMedia?.title || "") : "",
        mediaPoster: form.isConnectedToMovie ? (form.selectedMedia?.poster || form.selectedMedia?.poster_path || "") : "",
        mediaType: form.isConnectedToMovie ? (form.selectedMedia?.type || "") : "",
        relationType: form.isConnectedToMovie ? form.relationType : "ORIGINAL"
      });
      setForm({
        title: "",
        type: "STORY",
        genre1: "Fantasy",
        genre2: "Adventure",
        genre3: "NONE",
        isPublic: false,
        isConnectedToMovie: false,
        selectedMedia: null,
        relationType: "SEQUEL"
      });
      await loadProjects(0);
    } catch (err) {
      setError(extractApiError(err, "Could not create project"));
    }
  }

  async function onDelete(id) {
    try {
      await deleteProject(id);
      await loadProjects(page);
    } catch (err) {
      setError(extractApiError(err, "Could not delete project"));
    }
  }

  async function onShare(id) {
    try {
      const link = await getShareLink(id);
      await navigator.clipboard.writeText(link);
      alert("Share link copied to clipboard!");
    } catch {
      alert("Could not copy share link.");
    }
  }

  async function onExport(id) {
    try {
      await exportProjectPdf(id);
    } catch (err) {
      setError(extractApiError(err, "Export PDF failed"));
    }
  }

  async function onExportTxt(id) {
    try {
      await exportProjectTxt(id);
    } catch (err) {
      setError(extractApiError(err, "Export TXT failed"));
    }
  }

  const filteredProjects = safeArray(projects).filter((p) => {
    // 1. Genre dropdown filter check
    if (selectedGenreFilter !== "ALL") {
      const pGenres = getProjectGenres(p);
      if (!pGenres.includes(selectedGenreFilter) && p.subject !== selectedGenreFilter && p.genre1 !== selectedGenreFilter) {
        return false;
      }
    }
    // 2. Search query input check
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
      const typeMatch = p.type?.toLowerCase().includes(q);
      const tagMatch = Array.isArray(p.tags) ? p.tags.some((t) => t.toLowerCase().includes(q)) : false;

      return titleMatch || genreMatch || mediaMatch || typeMatch || tagMatch;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070b12] text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8 flex-1 space-y-6">
        {/* Collaboration Requests Notification Card */}
        <CollaborationInvitationsCard onInvitationProcessed={() => loadProjects(0)} />

        {/* User banner card */}
        <section className="card p-5 space-y-1">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Logged in as</p>
          <h1 className="text-xl font-bold theme-text tracking-tight">
            {user?.username || user?.email || "Writer"}
          </h1>
        </section>

        {/* Create Project card matching exact screenshot structure */}
        <section className="card p-6 space-y-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Create Project</h2>
          
          <form className="space-y-4" onSubmit={onCreate}>
            <div className="grid gap-3 sm:grid-cols-12 items-center">
              <input
                className="input sm:col-span-8 text-sm"
                placeholder="Project title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
              <select
                className="input sm:col-span-4 text-sm dark:bg-slate-900"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                <option value="STORY">STORY</option>
                <option value="SCRIPT">SCRIPT</option>
              </select>
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
                    value={form.genre1}
                    onChange={(e) => setForm({ ...form, genre1: e.target.value })}
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
                    value={form.genre2}
                    onChange={(e) => setForm({ ...form, genre2: e.target.value })}
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
                    value={form.genre3}
                    onChange={(e) => setForm({ ...form, genre3: e.target.value })}
                  >
                    <option value="NONE">-- None (Optional) --</option>
                    {ALL_GENRES.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                <span>Make project public</span>
                <input
                  type="checkbox"
                  className="rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                  checked={form.isPublic}
                  onChange={(e) => setForm({ ...form, isPublic: e.target.checked })}
                />
              </label>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/60 p-3 space-y-3">
              <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                  checked={form.isConnectedToMovie}
                  onChange={(e) => setForm({ ...form, isConnectedToMovie: e.target.checked })}
                />
                <span>This story is connected to an existing movie/series</span>
              </label>

              {form.isConnectedToMovie && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800/60 grid gap-3 sm:grid-cols-2 items-start">
                  <MovieSearch
                    selectedMedia={form.selectedMedia}
                    onSelectMedia={(media) => setForm({ ...form, selectedMedia: media })}
                  />

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Relationship / Connection Type
                    </label>
                    <select
                      className="input text-xs py-2 w-full dark:bg-slate-900"
                      value={form.relationType}
                      onChange={(e) => setForm({ ...form, relationType: e.target.value })}
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

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="btn text-xs py-2.5 px-6 font-bold cursor-pointer"
              >
                Create Project
              </button>
            </div>
          </form>

          {error && <p className="text-xs text-rose-400 mt-2">{error}</p>}
        </section>

        {/* Search Bar & Genre Filter */}
        <section className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 p-3.5 rounded-2xl shadow-sm">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 text-sm">
              🔍
            </span>
            <input
              type="text"
              className="input text-xs pl-9 pr-8 py-2 w-full dark:bg-slate-950/80 border-slate-300 dark:border-slate-700/80 focus:border-teal-500 transition rounded-xl"
              placeholder="Search projects by title, genre, subject, or tag..."
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

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">Genre:</span>
            <select
              className="input text-xs py-2 dark:bg-slate-950/80 border-slate-300 dark:border-slate-700/80 rounded-xl"
              value={selectedGenreFilter}
              onChange={(e) => setSelectedGenreFilter(e.target.value)}
            >
              <option value="ALL">All Genres ({ALL_GENRES.length})</option>
              {ALL_GENRES.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
        </section>

        {/* Projects list */}
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {loading && projects.length === 0 && (
            <div className="card col-span-full text-center text-slate-300">Loading projects...</div>
          )}
          {!loading && filteredProjects.length === 0 && (
            <div className="card col-span-full text-center text-slate-400 py-8">
              No projects found. Create your first project above!
            </div>
          )}
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onDelete={() => onDelete(project.id)}
              onShare={() => onShare(project.id)}
              onExportPdf={() => onExport(project.id)}
              onExportTxt={() => onExportTxt(project.id)}
            />
          ))}
        </section>

        {/* Pagination matching screenshot */}
        <section className="flex items-center justify-end gap-3 pt-4">
          <button
            className="rounded-lg bg-slate-900 border border-slate-800 px-3.5 py-1.5 text-xs font-medium text-slate-300 disabled:opacity-40 hover:bg-slate-800 transition"
            disabled={!pageInfo.hasPrevious}
            onClick={() => loadProjects(Math.max(0, page - 1))}
          >
            Previous
          </button>
          <span className="text-xs text-slate-300 font-semibold">
            Page {page + 1}/{Math.max(pageInfo.totalPages, 1)}
          </span>
          <button
            className="rounded-lg bg-slate-900 border border-slate-800 px-3.5 py-1.5 text-xs font-medium text-slate-300 disabled:opacity-40 hover:bg-slate-800 transition"
            disabled={!pageInfo.hasNext}
            onClick={() => loadProjects(page + 1)}
          >
            Next
          </button>
        </section>
      </main>
    </div>
  );
}

