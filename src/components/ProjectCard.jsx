import { Link } from "react-router-dom";
import RelationBadge from "./RelationBadge";
import SubjectTag from "./SubjectTag";
import { useAuth } from "../context/AuthContext";
import { getProjectGenres } from "../utils/genres";

export default function ProjectCard({ project, onDelete, onShare, onExportPdf, onExportTxt }) {
  const { user } = useAuth();
  const isOwner =
    project.accessRole === "OWNER" ||
    !project.accessRole ||
    user?.isOwner ||
    user?.role === "OWNER" ||
    user?.role === "ADMIN";

  const projectGenres = getProjectGenres(project);

  return (
    <div className="card space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{project.title}</h3>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded px-2 py-0.5 text-[10px] font-extrabold uppercase theme-text bg-[var(--theme-glow)] border border-[var(--theme-ring)]">
              {project.type}
            </span>
            {project.isPublic ? (
              <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-300">
                PUBLIC
              </span>
            ) : (
              <span className="rounded bg-slate-200 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-400">
                PRIVATE
              </span>
            )}
            <RelationBadge relationType={project.relationType} />
          </div>
        </div>

        <Link
          to={`/project/${project.id}`}
          className="btn text-xs py-1.5 px-3.5 shrink-0"
        >
          Open
        </Link>
      </div>

      {projectGenres.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {projectGenres.map((g) => (
            <SubjectTag key={g} label={g} />
          ))}
        </div>
      )}

      {project.mediaTitle && (
        <div className="flex items-center gap-2.5 rounded-lg bg-slate-100 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 p-2 text-xs">
          {project.mediaPoster && (
            <img
              src={project.mediaPoster}
              alt={project.mediaTitle}
              className="w-8 h-11 object-cover rounded border border-slate-300 dark:border-slate-700/60 shrink-0"
            />
          )}
          <div className="min-w-0 flex-1">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Connected Media</span>
            <span className="text-slate-800 dark:text-slate-200 font-semibold truncate block">{project.mediaTitle}</span>
          </div>
        </div>
      )}

      <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 flex flex-wrap gap-1.5">
        <button
          className="rounded-lg bg-slate-200 dark:bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700 transition"
          onClick={onShare}
        >
          Share
        </button>
        <button
          className="rounded-lg bg-slate-200 dark:bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700 transition"
          onClick={onExportPdf}
        >
          PDF
        </button>
        <button
          className="rounded-lg bg-slate-200 dark:bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700 transition"
          onClick={onExportTxt}
        >
          TXT
        </button>
        {isOwner && (
          <button
            className="rounded-lg bg-rose-100 dark:bg-rose-950/80 hover:bg-rose-200 dark:hover:bg-rose-900 border border-rose-300 dark:border-rose-800/50 px-2.5 py-1 text-[11px] font-semibold text-rose-700 dark:text-rose-300 transition ml-auto"
            onClick={onDelete}
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
