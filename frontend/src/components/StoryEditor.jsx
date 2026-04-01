import { sectionLabel } from "../utils/screenplay";

export default function StoryEditor({ sectionNumber, text, onSectionChange, onTextChange, onSave, readOnly, saving }) {
  return (
    <div className="card flex h-full flex-col">
      <div className="mb-3 flex items-center gap-2">
        <label className="text-sm text-slate-400">Chapter</label>
        <input
          type="number"
          className="input max-w-28"
          min={1}
          value={sectionNumber}
          onChange={(e) => onSectionChange(Number(e.target.value))}
          disabled={readOnly}
        />
        <span className="text-xs text-slate-500">{sectionLabel("STORY", sectionNumber)}</span>
      </div>
      <textarea
        className="input h-[60vh] flex-1 resize-none"
        value={text}
        onChange={(e) => onTextChange(e.target.value)}
        placeholder="Write your chapter here..."
        readOnly={readOnly}
      />
      <button className="btn mt-3 self-end" onClick={onSave} disabled={readOnly || saving}>
        {saving ? "Saving..." : "Save Chapter"}
      </button>
    </div>
  );
}
