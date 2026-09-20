export default function SubjectTag({ label }) {
  if (!label) return null;

  return (
    <span className="inline-flex items-center rounded-md border border-[var(--theme-ring)] bg-[var(--theme-glow)] px-2 py-0.5 text-[10px] font-semibold theme-text">
      #{label}
    </span>
  );
}
