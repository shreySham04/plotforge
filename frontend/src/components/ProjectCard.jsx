import { Link } from "react-router-dom";
import RelationBadge from "./RelationBadge";
import SubjectTag from "./SubjectTag";

export default function ProjectCard({ project, onDelete, onShare, onExportPdf, onExportTxt, onEdit }) {
  const isOwner = project.accessRole === "OWNER";
  const canEdit = Boolean(project.canEdit);

  const relationLabel = (() => {
    if (!project.relationType || project.relationType === "NONE") return null;

    const prefix = project.relationType === "SEQUEL"
      ? "Sequel to"
      : project.relationType === "PREQUEL"
        ? "Prequel to"
        : "Spinoff of";

    if (project.relatedProjectTitle) {
      return `${prefix}: ${project.relatedProjectTitle}`;
    }
    if (project.externalMediaTitle) {
      return `${prefix}: ${project.externalMediaTitle}`;
    }
    if (project.externalMediaId) {
      return `${prefix}: TMDB #${project.externalMediaId}`;
    }
    return null;
  })();

  return (
    <div className="card transition duration-200 hover:-translate-y-0.5 hover:border-blue-500/60 hover:shadow-[0_10px_40px_rgba(59,130,246,0.2)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-100">{project.title}</h3>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <p className="text-xs uppercase tracking-wide text-blue-300">{project.type}</p>
            <SubjectTag subjectName={project.subjectName} />
            <RelationBadge relationType={project.relationType} />
          </div>
          <p className="mt-1 text-xs text-slate-400">Role: {project.accessRole}</p>
          <p className="mt-1 text-xs text-slate-400">Owner: {project.ownerUsername}</p>
          {relationLabel && <p className="mt-2 text-sm text-blue-200">{relationLabel}</p>}
          {project.linkedStoryTitle && (
            <p className="mt-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-200">
              Based on Story: {project.linkedStoryTitle}
            </p>
          )}
        </div>
        <Link to={`/project/${project.id}`} className="btn">
          Open
        </Link>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {canEdit && (
          <button className="rounded bg-slate-800 px-3 py-1 text-sm text-slate-200" onClick={onEdit}>
            Edit
          </button>
        )}
        <button className="rounded bg-slate-800 px-3 py-1 text-sm text-slate-200" onClick={onShare}>
          Share Link
        </button>
        <button className="rounded bg-slate-800 px-3 py-1 text-sm text-slate-200" onClick={onExportPdf}>
          Export PDF
        </button>
        <button className="rounded bg-slate-800 px-3 py-1 text-sm text-slate-200" onClick={onExportTxt}>
          Export TXT
        </button>
        {isOwner && (
          <button className="rounded bg-red-700 px-3 py-1 text-sm text-white" onClick={onDelete}>
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
