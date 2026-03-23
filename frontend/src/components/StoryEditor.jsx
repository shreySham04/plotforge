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
      <div
        key={sectionNumber}
        className="input h-[60vh] flex-1 overflow-auto"
        contentEditable={!readOnly}
        suppressContentEditableWarning
        onInput={(e) => onTextChange(e.currentTarget.innerText)}
        dangerouslySetInnerHTML={{ __html: text }}
      >
      </div>
      <button className="btn mt-3 self-end" onClick={onSave} disabled={readOnly || saving}>
        {saving ? "Saving..." : "Save Chapter"}
      </button>
    </div>
  );
}
