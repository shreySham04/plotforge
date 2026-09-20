export default function RelationBadge({ relationType }) {
  if (!relationType) return null;

  const styles = {
    SEQUEL: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    PREQUEL: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    SPINOFF: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
    ALTERNATE_ENDING: "bg-rose-500/20 text-rose-300 border-rose-500/30"
  };

  const styleClass = styles[relationType] || "bg-slate-800 text-slate-300 border-slate-700";

  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${styleClass}`}>
      {relationType.replace("_", " ")}
    </span>
  );
}
