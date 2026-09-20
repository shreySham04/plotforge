import React, { useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Custom MarkdownRenderer for Chatbot RMD (Rich Markdown)
 * Formats headings, screenplay dialogue blocks, blockquotes, lists, tables,
 * and provides 1-click script copying and clean formatting.
 */
export default function MarkdownRenderer({ content, className = "" }) {
  const [copiedCodeIdx, setCopiedCodeIdx] = useState(null);

  const handleCopyBlock = (codeText, idx) => {
    navigator.clipboard.writeText(codeText);
    setCopiedCodeIdx(idx);
    setTimeout(() => setCopiedCodeIdx(null), 2000);
  };

  return (
    <div className={`markdown-body text-xs sm:text-sm leading-relaxed space-y-2.5 ${className}`}>
      <Markdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Headings
          h1: ({ node, ...props }) => (
            <h1 className="text-base sm:text-lg font-black text-amber-200 tracking-wide mt-3 mb-1.5 pb-1 border-b border-amber-500/30 flex items-center gap-1.5" {...props} />
          ),
          h2: ({ node, ...props }) => (
            <h2 className="text-sm sm:text-base font-bold text-amber-300 mt-2.5 mb-1 flex items-center gap-1.5" {...props} />
          ),
          h3: ({ node, ...props }) => (
            <h3 className="text-xs sm:text-sm font-bold text-amber-400 mt-2 mb-1" {...props} />
          ),
          h4: ({ node, ...props }) => (
            <h4 className="text-xs font-semibold text-slate-200 mt-1.5 mb-0.5 uppercase tracking-wider text-[11px]" {...props} />
          ),

          // Paragraphs
          p: ({ node, ...props }) => (
            <p className="my-1.5 leading-relaxed text-slate-200" {...props} />
          ),

          // Bold & Strong
          strong: ({ node, ...props }) => (
            <strong className="font-bold text-amber-300" {...props} />
          ),

          // Emphasis / Italic
          em: ({ node, ...props }) => (
            <em className="italic text-amber-100/90" {...props} />
          ),

          // Blockquotes (Cinematic dialogue / thought quotes)
          blockquote: ({ node, ...props }) => (
            <blockquote
              className="my-2.5 border-l-4 border-amber-500/70 bg-gradient-to-r from-amber-950/40 via-slate-900/40 to-transparent pl-3.5 pr-3 py-2 rounded-r-xl italic text-amber-100 font-serif shadow-sm text-xs sm:text-sm"
              {...props}
            />
          ),

          // Lists
          ul: ({ node, ...props }) => (
            <ul className="my-2 space-y-1.5 pl-4 list-disc marker:text-amber-400" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="my-2 space-y-1.5 pl-4 list-decimal marker:text-amber-400 marker:font-bold" {...props} />
          ),
          li: ({ node, ...props }) => (
            <li className="leading-relaxed text-slate-200 pl-0.5" {...props} />
          ),

          // Tables
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto my-3 rounded-xl border border-slate-700/80 bg-slate-950/60 shadow-md">
              <table className="w-full text-left text-xs border-collapse" {...props} />
            </div>
          ),
          thead: ({ node, ...props }) => (
            <thead className="bg-slate-800/90 text-amber-300 font-bold border-b border-slate-700" {...props} />
          ),
          tbody: ({ node, ...props }) => (
            <tbody className="divide-y divide-slate-800 text-slate-300" {...props} />
          ),
          tr: ({ node, ...props }) => (
            <tr className="hover:bg-slate-800/40 transition-colors" {...props} />
          ),
          th: ({ node, ...props }) => (
            <th className="p-2.5 font-bold uppercase tracking-wider text-[10px]" {...props} />
          ),
          td: ({ node, ...props }) => (
            <td className="p-2.5 align-top" {...props} />
          ),

          // Code blocks & screenplay snippets
          code: ({ node, inline, className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || "");
            const lang = match ? match[1] : "";
            const rawText = String(children).replace(/\n$/, "");

            if (inline) {
              return (
                <code
                  className="bg-slate-950/90 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30 text-[11px] font-mono font-medium"
                  {...props}
                >
                  {children}
                </code>
              );
            }

            const isScreenplay =
              lang === "fountain" ||
              lang === "screenplay" ||
              lang === "script" ||
              rawText.includes("INT.") ||
              rawText.includes("EXT.");

            const blockId = rawText.slice(0, 30);

            return (
              <div className="relative my-3 rounded-xl overflow-hidden border border-amber-500/40 bg-slate-950 shadow-xl group">
                {/* Code Header Bar */}
                <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900/90 border-b border-slate-800 text-[11px]">
                  <span className="font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <span>{isScreenplay ? "🎬" : "📝"}</span>
                    <span>{lang ? lang.toUpperCase() : isScreenplay ? "SCREENPLAY / FOUNTAIN" : "SNIPPET"}</span>
                  </span>

                  <button
                    type="button"
                    onClick={() => handleCopyBlock(rawText, blockId)}
                    className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 transition cursor-pointer"
                    title="Copy formatted screenplay snippet"
                  >
                    {copiedCodeIdx === blockId ? (
                      <>
                        <span className="text-emerald-400">✓</span>
                        <span className="text-emerald-300">Copied!</span>
                      </>
                    ) : (
                      <>
                        <span>📋</span>
                        <span>Copy Script</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Code / Screenplay Content */}
                <pre className={`p-3.5 overflow-x-auto text-xs leading-relaxed ${isScreenplay ? "font-mono text-teal-200 bg-slate-950" : "font-mono text-amber-100 bg-slate-950/80"}`}>
                  <code>{children}</code>
                </pre>
              </div>
            );
          },

          // Horizontal rule
          hr: ({ node, ...props }) => (
            <hr className="my-3 border-t border-amber-500/20" {...props} />
          ),

          // Links
          a: ({ node, ...props }) => (
            <a
              className="text-amber-400 hover:text-amber-300 underline underline-offset-2 transition-colors font-medium"
              target="_blank"
              rel="noreferrer"
              {...props}
            />
          )
        }}
      >
        {content}
      </Markdown>
    </div>
  );
}
