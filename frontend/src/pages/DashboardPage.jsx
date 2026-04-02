import { useEffect, useRef, useState } from "react";
import Navbar from "../components/Navbar";
import ProjectCard from "../components/ProjectCard";
import {
  createProject,
  deleteProject,
  exportProjectPdf,
  exportProjectTxt,
  getProjects,
  getShareLink,
  updateProject
} from "../services/projectService";
import { searchMedia } from "../services/fanFutureService";
import { createSubject, getSubjects } from "../services/subjectService";
import { useAuth } from "../context/AuthContext";
import { extractApiError } from "../utils/errors";

const GENRE_OPTIONS = [
  "Action",
  "Action & Adventure",
  "Adventure",
  "Animation",
  "Biography",
  "Comedy",
  "Crime",
  "Documentary",
  "Drama",
  "Family",
  "Fantasy",
  "History",
  "Horror",
  "Kids",
  "Music",
  "Musical",
  "Mystery",
  "News",
  "Reality",
  "Romance",
  "Sci-Fi",
  "Sci-Fi & Fantasy",
  "Soap",
  "Sport",
  "Talk",
  "Thriller",
  "TV Movie",
  "War",
  "War & Politics",
  "Western"
];

export default function DashboardPage({ mode = {} }) {
  const { user } = useAuth();
  const onlyType = mode.onlyType || null;
  const heading = mode.heading || "Create Project";
  const [projects, setProjects] = useState([]);
  const [allProjects, setAllProjects] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [page, setPage] = useState(0);
  const [pageInfo, setPageInfo] = useState({ totalPages: 1, hasNext: false, hasPrevious: false });
  const [subjectFilter, setSubjectFilter] = useState("");
  const [form, setForm] = useState({
    title: "",
    type: onlyType || "STORY",
    relationType: "SPINOFF",
    genrePrimary: "",
    genreSecondary: "",
    externalMediaId: "",
    externalMediaTitle: "",
    linkedStoryId: ""
  });
  const [isConnectedToMedia, setIsConnectedToMedia] = useState(false);
  const [tmdbQuery, setTmdbQuery] = useState("");
  const [tmdbResults, setTmdbResults] = useState([]);
  const [tmdbLoading, setTmdbLoading] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [genreEffect, setGenreEffect] = useState(null);
  const [effectParticles, setEffectParticles] = useState([]);
  const effectTimeoutRef = useRef(null);

  function pickGenreEffect(genre) {
    const normalized = (genre || "").toLowerCase();
    if (normalized.includes("horror")) return "bats";
    if (normalized.includes("romance")) return "hearts";
    if (normalized.includes("sci")) return "stars";
    if (normalized.includes("thriller") || normalized.includes("mystery")) return "fog";
    if (normalized.includes("action") || normalized.includes("war") || normalized.includes("sport")) return "sparks";
    return "fade";
  }

  function buildParticles(effectType) {
    const countByEffect = {
      bats: 15,
      hearts: 18,
      stars: 20,
      fog: 10,
      sparks: 20,
      fade: 14
    };
    const count = countByEffect[effectType] || 14;

    return Array.from({ length: count }, (_, index) => ({
      id: `${effectType}-${index}-${Date.now()}`,
      left: 4 + Math.random() * 92,
      delay: Math.random() * 260,
      duration: 700 + Math.random() * 900,
      size: effectType === "fog" ? 28 + Math.random() * 40 : 10 + Math.random() * 22,
      drift: -30 + Math.random() * 60
    }));
  }

  function triggerGenreEffect(primaryGenre, projectType) {
    const effectType = pickGenreEffect(primaryGenre);
    setEffectParticles(buildParticles(effectType));
    setGenreEffect({
      id: Date.now(),
      type: effectType,
      title: `${projectType} created`
    });

    if (effectTimeoutRef.current) {
      clearTimeout(effectTimeoutRef.current);
    }
    effectTimeoutRef.current = setTimeout(() => {
      setGenreEffect(null);
      setEffectParticles([]);
    }, 1800);
  }

  async function loadProjects(targetPage = page) {
    setLoading(true);
    setError("");
    try {
      const data = await getProjects(targetPage, 9, subjectFilter || undefined);
      const rawItems = data.items || [];
      setProjects(onlyType ? rawItems.filter((item) => item.type === onlyType) : rawItems);
      setPage(targetPage);
      setPageInfo({
        totalPages: data.totalPages || 1,
        hasNext: data.hasNext,
        hasPrevious: data.hasPrevious
      });
    } catch (err) {
      setError(extractApiError(err, "Could not load projects"));
    } finally {
      setLoading(false);
    }
  }

  async function loadReferenceData() {
    try {
      const [subjectData, projectData] = await Promise.all([
        getSubjects(),
        getProjects(0, 200)
      ]);
      setSubjects(subjectData || []);
      setAllProjects(projectData.items || []);
    } catch {
      setSubjects([]);
      setAllProjects([]);
    }
  }

  useEffect(() => {
    loadProjects(0);
    loadReferenceData();
  }, [subjectFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    return () => {
      if (effectTimeoutRef.current) {
        clearTimeout(effectTimeoutRef.current);
      }
    };
  }, []);

  function resetForm() {
    setForm({
      title: "",
      type: onlyType || "STORY",
      relationType: "SPINOFF",
      genrePrimary: "",
      genreSecondary: "",
      externalMediaId: "",
      externalMediaTitle: "",
      linkedStoryId: ""
    });
    setTmdbQuery("");
    setTmdbResults([]);
    setIsConnectedToMedia(false);
    setEditingProject(null);
  }

  function startEdit(project) {
    const sourceGenres = (project.subjectName || "")
      .split("/")
      .map((value) => value.trim())
      .filter(Boolean);

    setEditingProject(project);
    setForm({
      title: project.title || "",
      type: project.type || onlyType || "STORY",
      relationType: project.relationType && project.relationType !== "NONE" ? project.relationType : "SPINOFF",
      genrePrimary: sourceGenres[0] || "",
      genreSecondary: sourceGenres[1] || "",
      externalMediaId: project.externalMediaId ? String(project.externalMediaId) : "",
      externalMediaTitle: project.externalMediaTitle || "",
      linkedStoryId: project.linkedStoryId ? String(project.linkedStoryId) : ""
    });

    setIsConnectedToMedia(Boolean((project.externalMediaId || project.externalMediaTitle) && project.type === "STORY"));
    setTmdbQuery(project.externalMediaTitle || "");
    setTmdbResults([]);
  }

  async function resolveSubjectId(selectedGenres) {
    const normalized = (selectedGenres || [])
      .map((genre) => genre.trim())
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b))
      .join(" / ");

    if (!normalized) return null;

    const existing = subjects.find(
      (subject) => (subject.name || "").toLowerCase() === normalized.toLowerCase()
    );
    if (existing) return existing.id;

    try {
      const created = await createSubject({ name: normalized });
      return created?.id ?? null;
    } catch {
      const refreshed = await getSubjects();
      setSubjects(refreshed || []);
      const resolved = (refreshed || []).find(
        (subject) => (subject.name || "").toLowerCase() === normalized.toLowerCase()
      );
      if (resolved) return resolved.id;
      throw new Error("Could not create subject");
    }
  }

  async function onSearchTmdb(e) {
    if (e && typeof e.preventDefault === "function") {
      e.preventDefault();
    }
    if (!tmdbQuery.trim()) return;

    setTmdbLoading(true);
    setError("");
    try {
      const data = await searchMedia(tmdbQuery.trim());
      const results = (data.results || [])
        .filter((item) => item.media_type === "movie" || item.media_type === "tv")
        .slice(0, 8);
      setTmdbResults(results);
    } catch (err) {
      setError(extractApiError(err, "Could not search TMDB"));
    } finally {
      setTmdbLoading(false);
    }
  }

  async function onCreate(e) {
    e.preventDefault();
    setError("");
    try {
      const projectType = onlyType || form.type;
      const selectedGenres = [form.genrePrimary, form.genreSecondary]
        .map((genre) => genre.trim())
        .filter(Boolean)
        .filter((genre, index, array) => array.indexOf(genre) === index)
        .slice(0, 2);
      const subjectId = await resolveSubjectId(selectedGenres);

      const payload = {
        title: form.title,
        type: projectType,
        relationType: "NONE",
        subjectId,
        linkedStoryId: projectType === "SCRIPT" && form.linkedStoryId ? Number(form.linkedStoryId) : null
      };

      if (editingProject && projectType === "STORY" && !isConnectedToMedia && editingProject.relationType !== "NONE") {
        payload.relationType = editingProject.relationType;
        payload.relatedProjectId = editingProject.relatedProjectId || null;
        payload.externalMediaId = editingProject.externalMediaId || null;
        payload.externalMediaTitle = editingProject.externalMediaTitle || null;
      }

      if (projectType === "STORY" && isConnectedToMedia) {
        if (!form.externalMediaId) {
          setError("Select a movie/series from the dropdown");
          return;
        }

        payload.relationType = form.relationType || "SPINOFF";
        payload.externalMediaId = Number(form.externalMediaId);
        payload.externalMediaTitle = form.externalMediaTitle || null;
      }

      if (editingProject) {
        await updateProject(editingProject.id, payload);
      } else {
        await createProject(payload);
        triggerGenreEffect(form.genrePrimary || form.genreSecondary, projectType);
      }
      resetForm();
      await loadReferenceData();
      await loadProjects(0);
    } catch (err) {
      setError(extractApiError(err, "Could not create project"));
    }
  }

  async function onDelete(id) {
    await deleteProject(id);
    await loadReferenceData();
    await loadProjects(page);
  }

  async function onShare(id) {
    const link = await getShareLink(id);
    try {
      await navigator.clipboard.writeText(link);
      alert("Share link copied");
    } catch {
      window.prompt("Copy share link:", link);
    }
  }

  async function onExport(id) {
    await exportProjectPdf(id);
  }

  async function onExportTxt(id) {
    await exportProjectTxt(id);
  }

  const availableStories = allProjects.filter((item) => item.type === "STORY");

  return (
    <div className="min-h-screen bg-base text-slate-100">
      {genreEffect && (
        <div className={`genre-fx-overlay genre-fx-${genreEffect.type}`} key={genreEffect.id} aria-hidden="true">
          <div className="genre-fx-vignette" />
          {effectParticles.map((particle) => (
            <span
              key={particle.id}
              className="genre-fx-particle"
              style={{
                left: `${particle.left}%`,
                width: `${particle.size}px`,
                height: `${particle.size}px`,
                animationDelay: `${particle.delay}ms`,
                animationDuration: `${particle.duration}ms`,
                "--fx-drift": `${particle.drift}px`
              }}
            />
          ))}
          <div className="genre-fx-label">{genreEffect.title}</div>
        </div>
      )}
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-6">
        <section className="mb-6 rounded-xl border border-slate-700/70 bg-slate-900/70 p-4">
          <p className="text-sm text-slate-300">Logged in as</p>
          <p className="text-xl font-bold text-blue-300">{user?.username || "User"}</p>
        </section>
        <section className="card mb-6">
          <h2 className="mb-3 text-xl font-semibold">{heading}</h2>
          <form className="space-y-3" onSubmit={onCreate}>
            <div className="flex flex-wrap gap-3">
              <input
                className="input max-w-xl flex-1"
                placeholder="Project title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
              {!onlyType && (
                <select
                  className="input max-w-44"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value, linkedStoryId: "", externalMediaId: "", externalMediaTitle: "" })}
                >
                  <option value="STORY">STORY</option>
                  <option value="SCRIPT">SCRIPT</option>
                </select>
              )}
              <select
                className="input max-w-56"
                value={form.genrePrimary}
                onChange={(e) => setForm({ ...form, genrePrimary: e.target.value })}
                title="Select primary genre"
              >
                <option value="">Select Genre 1</option>
                {GENRE_OPTIONS.map((genre) => (
                  <option key={genre} value={genre}>{genre}</option>
                ))}
              </select>
              <select
                className="input max-w-56"
                value={form.genreSecondary}
                onChange={(e) => setForm({ ...form, genreSecondary: e.target.value })}
                title="Select secondary genre"
              >
                <option value="">Select Genre 2 (optional)</option>
                {GENRE_OPTIONS.filter((genre) => genre !== form.genrePrimary).map((genre) => (
                  <option key={genre} value={genre}>{genre}</option>
                ))}
              </select>
            </div>

            <p className="text-xs text-slate-400">
              Select up to 2 genres for your story.
            </p>

            {(onlyType || form.type) === "STORY" && (
              <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-3">
                <label className="mb-3 flex items-center gap-2 text-sm text-slate-300">
                  <input
                    type="checkbox"
                    checked={isConnectedToMedia}
                    onChange={(e) => {
                      const next = e.target.checked;
                      setIsConnectedToMedia(next);
                      if (!next) {
                        setForm({ ...form, externalMediaId: "", externalMediaTitle: "", relationType: "SPINOFF" });
                        setTmdbResults([]);
                        setTmdbQuery("");
                      }
                    }}
                  />
                  This story is connected to an existing movie/series
                </label>

                {isConnectedToMedia && (
                  <div className="space-y-2">
                    <div>
                      <label className="mb-1 block text-sm text-slate-300">Connection type</label>
                      <select
                        className="input max-w-44"
                        value={form.relationType}
                        onChange={(e) => setForm({ ...form, relationType: e.target.value })}
                      >
                        <option value="SEQUEL">SEQUEL</option>
                        <option value="PREQUEL">PREQUEL</option>
                        <option value="SPINOFF">SPINOFF</option>
                      </select>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <input
                        className="input max-w-xl flex-1"
                        placeholder="Search movie or series"
                        value={tmdbQuery}
                        onChange={(e) => setTmdbQuery(e.target.value)}
                      />
                      <button className="btn" type="button" disabled={tmdbLoading} onClick={onSearchTmdb}>
                        {tmdbLoading ? "Searching..." : "Search"}
                      </button>
                    </div>
                    <select
                      className="input max-w-xl"
                      value={form.externalMediaId}
                      onChange={(e) => {
                        const selected = tmdbResults.find((item) => String(item.id) === e.target.value);
                        setForm({
                          ...form,
                          externalMediaId: e.target.value,
                          externalMediaTitle: selected ? (selected.title || selected.name) : ""
                        });
                      }}
                    >
                      <option value="">Select movie/series</option>
                      {tmdbResults.map((item) => (
                        <option key={`${item.media_type}-${item.id}`} value={item.id}>
                          {(item.title || item.name)} ({item.media_type?.toUpperCase()})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            {(onlyType || form.type) === "SCRIPT" && (
              <div>
                <label className="mb-1 block text-sm text-slate-300">Link to existing story (optional)</label>
                <select
                  className="input max-w-xl"
                  value={form.linkedStoryId}
                  onChange={(e) => setForm({ ...form, linkedStoryId: e.target.value })}
                >
                  <option value="">No linked story</option>
                  {availableStories.map((story) => (
                    <option key={story.id} value={story.id}>{story.title}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex justify-end">
              <div className="flex gap-2">
                {editingProject && (
                  <button className="rounded bg-slate-800 px-4 py-2 text-sm text-slate-200" type="button" onClick={resetForm}>
                    Cancel
                  </button>
                )}
                <button className="btn" type="submit">{editingProject ? "Save Changes" : "Create"}</button>
              </div>
            </div>
          </form>

          <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-slate-800 pt-3">
            <label className="text-sm text-slate-300">Filter by genre</label>
            <select
              className="input max-w-64"
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
            >
              <option value="">All Genres</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>{subject.name}</option>
              ))}
            </select>
          </div>

          {error && <p className="mt-2 text-sm text-rose-400">{error}</p>}
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {loading && <div className="card col-span-full text-center text-slate-300">Loading projects...</div>}
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onEdit={() => startEdit(project)}
              onDelete={() => onDelete(project.id)}
              onShare={() => onShare(project.id)}
              onExportPdf={() => onExport(project.id)}
              onExportTxt={() => onExportTxt(project.id)}
            />
          ))}
        </section>

        <section className="mt-4 flex items-center justify-end gap-2">
          <button
            className="rounded bg-slate-800 px-3 py-1 text-sm text-slate-200 disabled:opacity-50"
            disabled={!pageInfo.hasPrevious}
            onClick={() => loadProjects(Math.max(0, page - 1))}
          >
            Previous
          </button>
          <span className="text-sm text-slate-300">Page {page + 1} / {Math.max(pageInfo.totalPages, 1)}</span>
          <button
            className="rounded bg-slate-800 px-3 py-1 text-sm text-slate-200 disabled:opacity-50"
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
