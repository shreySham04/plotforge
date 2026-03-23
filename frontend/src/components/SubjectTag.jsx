export default function SubjectTag({ subjectName }) {
  if (!subjectName) return null;

  return (
    <span className="inline-flex rounded-md border border-emerald-400/40 bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-200">
      {subjectName}
    </span>
  );
}
