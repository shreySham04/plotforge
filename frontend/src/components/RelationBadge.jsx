const relationStyles = {
  NONE: "bg-slate-700/70 text-slate-200",
  SEQUEL: "bg-blue-600/30 text-blue-200 border border-blue-500/40",
  PREQUEL: "bg-amber-500/25 text-amber-200 border border-amber-400/40",
  SPINOFF: "bg-fuchsia-500/20 text-fuchsia-200 border border-fuchsia-400/40"
};

export default function RelationBadge({ relationType }) {
  const value = relationType || "NONE";
  if (value === "NONE") return null;

  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${relationStyles[value] || relationStyles.NONE}`}>
      {value}
    </span>
  );
}
