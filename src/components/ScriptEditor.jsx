import { useState } from "react";
import { sectionLabel, screenplayTemplate } from "../utils/screenplay";

export default function ScriptEditor({ sectionNumber, text = "", onSectionChange, onTextChange, onSave, readOnly, saving, isExpanded, onToggleExpand }) {
  const [fontSize, setFontSize] = useState("text-sm");

  const lineCount = text ? text.split("\n").length : 0;
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  return (
    <div className="card flex flex-col h-full space-y-4 p-6 shadow-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/95 transition-all">
      {/* Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800/80 pb-3">
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">Scene</label>
          <input
            type="number"
            className="input w-20 py-1 px-2 text-center text-sm font-bold border-slate-300 dark:border-slate-700"
            min={1}
            value={sectionNumber}
            onChange={(e) => onSectionChange(Number(e.target.value))}
            disabled={readOnly}
          />
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{sectionLabel("SCRIPT", sectionNumber)}</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Font Size Selector */}
          <div className="flex items-center gap-1 rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700/60 text-xs">
            <span className="px-1.5 text-slate-500 font-medium">Text:</span>
            {[
              { label: "S", value: "text-xs" },
              { label: "M", value: "text-sm" },
              { label: "L", value: "text-base" }
            ].map((size) => (
              <button
                key={size.value}
                type="button"
                onClick={() => setFontSize(size.value)}
                className={`px-2 py-1 rounded-lg font-semibold transition ${
                  fontSize === size.value
                    ? "theme-text bg-[var(--theme-glow)] border border-[var(--theme-ring)] shadow-sm"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                {size.label}
              </button>
            ))}
          </div>

          {/* Expand / Full Width Toggle */}
          {onToggleExpand && (
            <button
              type="button"
              onClick={onToggleExpand}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              title={isExpanded ? "Show sidebar" : "Expand writing pad"}
            >
              <span>{isExpanded ? "📖 Sidebar" : "🔍 Full Width"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Spacious Screenplay Pad Textarea */}
      <div className="relative flex-1 min-h-[550px] md:min-h-[650px]">
        <textarea
          className={`w-full h-full min-h-[550px] md:min-h-[650px] resize-y rounded-xl border border-slate-200 dark:border-slate-800/90 bg-slate-950/80 p-5 md:p-6 ${fontSize} leading-relaxed font-mono text-emerald-400 dark:text-emerald-300 placeholder-slate-500 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus:outline-none transition-all shadow-inner`}
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder={screenplayTemplate()}
          readOnly={readOnly}
        />
      </div>

      {/* Footer Controls & Statistics */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800/60">
        <div className="flex items-center gap-4 font-mono text-[11px] text-slate-500 dark:text-slate-400">
          <span><strong>{lineCount.toLocaleString()}</strong> lines</span>
          <span>•</span>
          <span><strong>{wordCount.toLocaleString()}</strong> words</span>
        </div>

        <button
          className="btn text-xs py-2 px-5 font-bold shadow-teal-500/10"
          onClick={onSave}
          disabled={readOnly || saving}
        >
          {saving ? "💾 Saving..." : "💾 Save Scene"}
        </button>
      </div>
    </div>
  );
}
