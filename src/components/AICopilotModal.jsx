import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { getPersonaById } from "../utils/aiPersonas";
import MarkdownRenderer from "./MarkdownRenderer";

function renderPersonaIntro(personaKey, persona, projectTitle, onSkip) {
  if (personaKey === "cersei_lannister" || personaKey === "tyrion_lannister") {
    return (
      <div
        onClick={onSkip}
        className="relative flex flex-col items-center justify-center p-8 overflow-hidden min-h-[360px] bg-gradient-to-b from-red-950 via-slate-950 to-amber-950 rounded-2xl border border-amber-500/40 shadow-2xl cursor-pointer select-none group"
      >
        <div className="absolute top-4 text-xs font-black tracking-widest text-amber-300 uppercase bg-amber-500/20 px-3.5 py-1 rounded-full border border-amber-500/30 flex items-center gap-1.5">
          <span>👑</span> {persona.name}&apos;s Royal Toast
        </div>

        {/* Two Big Wine Glasses Doing Cheers Clink Animation */}
        <div className="relative flex items-center justify-center my-8 gap-2">
          {/* Left Glass */}
          <div className="text-7xl sm:text-8xl animate-cheers-left filter drop-shadow-[0_0_25px_rgba(245,158,11,0.8)]">
            🍷
          </div>

          {/* Clink Burst Effect in Center */}
          <div className="absolute z-10 flex flex-col items-center justify-center animate-clink-burst">
            <span className="text-3xl sm:text-4xl font-black text-amber-300 drop-shadow-[0_0_15px_rgba(245,158,11,1)] tracking-widest">
              CHEERS! 🥂
            </span>
            <span className="text-2xl text-amber-400">✨ 💦 ✨</span>
          </div>

          {/* Right Glass */}
          <div className="text-7xl sm:text-8xl animate-cheers-right filter drop-shadow-[0_0_25px_rgba(245,158,11,0.8)]">
            🍷
          </div>
        </div>

        <p className="text-amber-200 text-sm font-serif italic text-center max-w-md animate-pulse leading-relaxed">
          {personaKey === "cersei_lannister"
            ? '"Pour a cup of arbor gold... When you play the game of stories, you win or your script dies."'
            : '"I drink and I know things... Let\'s pour some Arbor Red and craft clever dialogue."'}
        </p>

        <span className="absolute bottom-3 text-[11px] text-amber-400/60 font-semibold group-hover:text-amber-300 transition">
          Click anywhere to start chatting →
        </span>
      </div>
    );
  }

  if (personaKey === "tywin_lannister") {
    return (
      <div
        onClick={onSkip}
        className="relative flex flex-col items-center justify-center p-8 overflow-hidden min-h-[360px] bg-gradient-to-b from-amber-950 via-stone-900 to-black rounded-2xl border border-amber-500/50 shadow-2xl cursor-pointer select-none group"
      >
        <div className="absolute top-4 text-xs font-black tracking-widest text-amber-300 uppercase bg-amber-500/20 px-3.5 py-1 rounded-full border border-amber-500/30">
          🦁 Lord Tywin&apos;s Golden Lion Roar
        </div>

        <div className="relative flex items-center justify-center my-8 gap-4">
          <span className="text-7xl animate-bounce">⚔️</span>
          <span className="text-8xl animate-pulse filter drop-shadow-[0_0_30px_rgba(245,158,11,1)]">🦁</span>
          <span className="text-7xl animate-bounce" style={{ animationDelay: "150ms" }}>👑</span>
        </div>

        <p className="text-amber-200 text-sm font-serif italic text-center max-w-md leading-relaxed">
          &quot;A lion doesn&apos;t concern himself with the opinions of weak plotlines.&quot;
        </p>

        <span className="absolute bottom-3 text-[11px] text-amber-400/60 font-semibold group-hover:text-amber-300 transition">
          Click anywhere to start chatting →
        </span>
      </div>
    );
  }

  if (personaKey === "ramsay_bolton") {
    return (
      <div
        onClick={onSkip}
        className="relative flex flex-col items-center justify-center p-8 overflow-hidden min-h-[360px] bg-gradient-to-b from-slate-950 via-red-950 to-black rounded-2xl border border-red-600/60 shadow-2xl cursor-pointer select-none group"
      >
        <div className="absolute top-4 text-xs font-black tracking-widest text-red-400 uppercase bg-red-900/30 px-3.5 py-1 rounded-full border border-red-500/40">
          🗡️ Ramsay Bolton&apos;s Flaying Daggers
        </div>

        <div className="relative flex items-center justify-center my-8 gap-3">
          <span className="text-7xl animate-cheers-left">🗡️</span>
          <span className="text-4xl text-red-500 animate-pulse font-black">🩸 FLAY 🩸</span>
          <span className="text-7xl animate-cheers-right">🗡️</span>
        </div>

        <p className="text-red-200 text-sm italic text-center max-w-md leading-relaxed">
          &quot;If you think this story has a happy ending, you haven&apos;t been paying attention.&quot;
        </p>

        <span className="absolute bottom-3 text-[11px] text-red-400/60 font-semibold group-hover:text-red-300 transition">
          Click anywhere to start chatting →
        </span>
      </div>
    );
  }

  if (personaKey === "jon_snow") {
    return (
      <div
        onClick={onSkip}
        className="relative flex flex-col items-center justify-center p-8 overflow-hidden min-h-[360px] bg-gradient-to-b from-slate-900 via-stone-900 to-black rounded-2xl border border-slate-600/50 shadow-2xl cursor-pointer select-none group"
      >
        <div className="absolute top-4 text-xs font-black tracking-widest text-slate-200 uppercase bg-slate-800/60 px-3.5 py-1 rounded-full border border-slate-600/40">
          🐺 Jon Snow: Longclaw & Winter Storm
        </div>

        <div className="relative flex items-center justify-center my-8 gap-4">
          <span className="text-6xl animate-bounce">❄️</span>
          <span className="text-8xl animate-pulse filter drop-shadow-[0_0_20px_rgba(255,255,255,0.6)]">⚔️</span>
          <span className="text-6xl animate-bounce" style={{ animationDelay: "200ms" }}>🐺</span>
        </div>

        <p className="text-slate-200 text-sm font-serif italic text-center max-w-md leading-relaxed">
          &quot;Winter is coming... What dark storm must your heroes face in this script?&quot;
        </p>

        <span className="absolute bottom-3 text-[11px] text-slate-400/80 font-semibold group-hover:text-slate-200 transition">
          Click anywhere to start chatting →
        </span>
      </div>
    );
  }

  if (personaKey === "jack_sparrow") {
    return (
      <div
        onClick={onSkip}
        className="relative flex flex-col items-center justify-center p-8 overflow-hidden min-h-[360px] bg-gradient-to-b from-amber-950 via-indigo-950 to-slate-950 rounded-2xl border border-amber-400/40 shadow-2xl cursor-pointer select-none group"
      >
        <div className="absolute top-4 text-xs font-black tracking-widest text-amber-300 uppercase bg-amber-500/20 px-3.5 py-1 rounded-full border border-amber-500/30">
          🏴‍☠️ Captain Jack&apos;s Magical Compass
        </div>

        <div className="relative flex items-center justify-center my-8 gap-4">
          <span className="text-6xl animate-bounce">⚔️</span>
          <span className="text-8xl animate-compass-spin filter drop-shadow-[0_0_25px_rgba(245,158,11,0.8)]">🧭</span>
          <span className="text-6xl animate-bounce" style={{ animationDelay: "150ms" }}>🍾</span>
        </div>

        <div className="text-center space-y-1">
          <h3 className="text-xl font-black text-amber-300 tracking-wide">Yo Ho Ho! Drink Up Me Hearties!</h3>
          <p className="text-amber-200/90 text-xs italic">Me compass points directly to your screenplay&apos;s grand adventure...</p>
        </div>

        <span className="absolute bottom-3 text-[11px] text-amber-400/60 font-semibold group-hover:text-amber-300 transition">
          Click anywhere to start chatting →
        </span>
      </div>
    );
  }

  if (personaKey === "daenerys_targaryen") {
    return (
      <div
        onClick={onSkip}
        className="relative flex flex-col items-center justify-center p-8 overflow-hidden min-h-[360px] bg-gradient-to-b from-red-950 via-rose-950 to-black rounded-2xl border border-red-500/50 shadow-2xl cursor-pointer select-none group"
      >
        <div className="absolute top-4 text-xs font-black tracking-widest text-amber-300 uppercase bg-red-500/20 px-3.5 py-1 rounded-full border border-red-500/30">
          🐉 Mother of Dragons: Fire & Blood
        </div>

        <div className="relative flex items-center justify-center my-8 gap-4">
          <span className="text-7xl animate-bounce">🐉</span>
          <div className="absolute text-5xl font-black text-amber-300 animate-dragon-fire filter drop-shadow-[0_0_20px_rgba(239,68,68,1)]">
            🔥 DRACARYS! 🔥
          </div>
          <span className="text-7xl animate-bounce" style={{ animationDelay: "200ms" }}>🐉</span>
        </div>

        <p className="text-amber-200 text-sm font-serif italic text-center max-w-md leading-relaxed mt-4">
          &quot;I will break the wheel of boring storytelling with Fire and Blood!&quot;
        </p>

        <span className="absolute bottom-3 text-[11px] text-amber-400/60 font-semibold group-hover:text-amber-300 transition">
          Click anywhere to start chatting →
        </span>
      </div>
    );
  }

  // Fallback for all other characters
  return (
    <div
      onClick={onSkip}
      className="relative flex flex-col items-center justify-center p-8 overflow-hidden min-h-[360px] bg-gradient-to-b from-slate-900 via-amber-950/40 to-slate-950 rounded-2xl border border-amber-500/40 shadow-2xl cursor-pointer select-none group"
    >
      <div className="absolute top-4 text-xs font-black tracking-widest text-amber-300 uppercase bg-amber-500/20 px-3.5 py-1 rounded-full border border-amber-500/30 flex items-center gap-2">
        <span>{persona.emoji}</span> {persona.name} ({persona.badge})
      </div>

      <div className="relative flex items-center justify-center my-8">
        <span className="text-8xl animate-bounce filter drop-shadow-[0_0_25px_rgba(245,158,11,0.8)]">
          {persona.emoji}
        </span>
      </div>

      <p className="text-amber-100 text-sm italic text-center max-w-md leading-relaxed">
        &quot;{persona.greeting(projectTitle)}&quot;
      </p>

      <span className="absolute bottom-3 text-[11px] text-amber-400/60 font-semibold group-hover:text-amber-300 transition">
        Click anywhere to start chatting →
      </span>
    </div>
  );
}

// Quick Suggestion Chips for Screenwriters
const PROMPT_SUGGESTIONS = [
  { label: "✨ Brainstorm Plot Twist", prompt: "Brainstorm 3 mind-blowing plot twists for this storyline." },
  { label: "🎭 Punch Up Dialogue", prompt: "Give me sharp, punchy character dialogue exchanges for the current scene." },
  { label: "🎬 Next Scene Beat", prompt: "Draft the next dramatic screenplay scene beat with high emotional stakes." },
  { label: "⚔️ Heighten Stakes", prompt: "What dangerous obstacles or ticking clocks can we introduce right now?" }
];

export default function AICopilotModal({
  isOpen,
  onClose,
  projectTitle = "Current Project",
  storyContent = "",
  scriptContent = "",
  onApplyScriptEdit
}) {
  const { user, token } = useAuth();
  const persona = getPersonaById(user?.aiPersona);

  const [activeTab, setActiveTab] = useState("chat"); // 'chat' | 'sync'
  const [userPrompt, setUserPrompt] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [isAsking, setIsAsking] = useState(false);

  // Response Character Limit state (initialized from env / server)
  const defaultEnvChars = Number(import.meta.env.VITE_CHATBOT_MAX_CHARS) || 1200;
  const [maxChars, setMaxChars] = useState(defaultEnvChars);
  const [showCharConfig, setShowCharConfig] = useState(false);
  const [customCharInput, setCustomCharInput] = useState(defaultEnvChars);

  // Message View Mode: 'rich' (default RMD formatted) or 'plain' (Ctrl+Shift+V format)
  const [messageViewModes, setMessageViewModes] = useState({});
  const [copyFeedback, setCopyFeedback] = useState({});

  // Intro splash animation state
  const [showIntro, setShowIntro] = useState(true);

  // Fetch server config on open
  useEffect(() => {
    if (isOpen) {
      axios.get("/api/agent/copilot/config")
        .then((res) => {
          if (res.data?.defaultMaxChars) {
            setMaxChars(res.data.defaultMaxChars);
            setCustomCharInput(res.data.defaultMaxChars);
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  // Trigger intro animation whenever modal opens or persona changes
  useEffect(() => {
    if (isOpen) {
      setShowIntro(true);
      setChatMessages([
        {
          role: "assistant",
          content: persona.greeting(projectTitle)
        }
      ]);

      // Auto-hide intro overlay after 2.2 seconds
      const timer = setTimeout(() => {
        setShowIntro(false);
      }, 2200);

      return () => clearTimeout(timer);
    }
  }, [isOpen, user?.aiPersona, projectTitle]);

  // Auto-sync state
  const [syncInstruction, setSyncInstruction] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [proposedResult, setProposedResult] = useState(null);
  const [appliedSuccess, setAppliedSuccess] = useState(false);

  if (!isOpen) return null;

  // Toggle formatted Rich Markdown vs Clean Raw / Ctrl+Shift+V view
  const toggleViewMode = (idx) => {
    setMessageViewModes((prev) => ({
      ...prev,
      [idx]: prev[idx] === "plain" ? "rich" : "plain"
    }));
  };

  // 1-Click Copy as Clean Plain Text (Ctrl+Shift+V ready)
  const handleCopyPlainText = (text, idx) => {
    // Strip raw markdown markers for pristine paste-ready clean text
    const cleanText = text
      .replace(/^#{1,6}\s+/gm, "")
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/\*(.*?)\*/g, "$1")
      .replace(/`{1,3}([\s\S]*?)`{1,3}/g, "$1")
      .replace(/^>\s+/gm, "");

    navigator.clipboard.writeText(cleanText);
    setCopyFeedback((prev) => ({ ...prev, [idx]: "plain" }));
    setTimeout(() => {
      setCopyFeedback((prev) => ({ ...prev, [idx]: null }));
    }, 2000);
  };

  // Copy Raw Markdown
  const handleCopyRawMarkdown = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopyFeedback((prev) => ({ ...prev, [idx]: "raw" }));
    setTimeout(() => {
      setCopyFeedback((prev) => ({ ...prev, [idx]: null }));
    }, 2000);
  };

  const handleSendPrompt = async (e, forcedPrompt = null) => {
    if (e) e.preventDefault();
    const promptToSend = forcedPrompt || userPrompt;
    if (!promptToSend.trim() || isAsking) return;

    setUserPrompt("");
    const userMessage = { role: "user", content: promptToSend };
    const historyWithUser = [...chatMessages, userMessage];

    // Instantly append user message + active streaming assistant placeholder
    const assistantIndex = historyWithUser.length;
    setChatMessages([
      ...historyWithUser,
      {
        role: "assistant",
        content: "",
        isStreaming: true,
        charCount: 0,
        maxChars
      }
    ]);
    setIsAsking(true);

    try {
      const authToken = token || (typeof localStorage !== "undefined" ? localStorage.getItem("plotforge_auth_token") : "");
      const response = await fetch("/api/agent/copilot/stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
        },
        body: JSON.stringify({
          projectTitle,
          storyContent,
          scriptContent,
          prompt: promptToSend,
          messages: historyWithUser,
          aiPersona: user?.aiPersona || "jack_sparrow",
          maxChars
        })
      });

      if (!response.ok || !response.body) {
        throw new Error("Streaming endpoint unavailable, using fallback.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let accumulatedText = "";
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.replace("data: ", "").trim();
            if (!dataStr) continue;
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.chunk) {
                accumulatedText += parsed.chunk;
                setChatMessages((prev) => {
                  const updated = [...prev];
                  if (updated[assistantIndex]) {
                    updated[assistantIndex] = {
                      ...updated[assistantIndex],
                      content: accumulatedText,
                      charCount: accumulatedText.length,
                      isStreaming: !parsed.done
                    };
                  }
                  return updated;
                });
              }
              if (parsed.done) {
                setChatMessages((prev) => {
                  const updated = [...prev];
                  if (updated[assistantIndex]) {
                    updated[assistantIndex] = {
                      ...updated[assistantIndex],
                      content: accumulatedText || parsed.chunk || "No content generated.",
                      charCount: accumulatedText.length,
                      isStreaming: false
                    };
                  }
                  return updated;
                });
              }
            } catch (pErr) {
              console.warn("SSE chunk parse error:", pErr);
            }
          }
        }
      }

      if (!accumulatedText.trim()) {
        throw new Error("Empty stream");
      }
    } catch (err) {
      console.warn("Streaming failed, using fallback endpoint:", err);
      try {
        const res = await axios.post("/api/agent/copilot/suggest", {
          projectTitle,
          storyContent,
          scriptContent,
          prompt: promptToSend,
          messages: historyWithUser,
          aiPersona: user?.aiPersona || "jack_sparrow",
          maxChars
        });

        setChatMessages((prev) => {
          const updated = [...prev];
          updated[assistantIndex] = {
            role: "assistant",
            content: res.data.suggestion || "No suggestion generated.",
            charCount: res.data.charCount || res.data.suggestion?.length || 0,
            maxChars: res.data.maxChars || maxChars,
            isStreaming: false
          };
          return updated;
        });
      } catch (fallbackErr) {
        console.error("Co-pilot chat fallback error:", fallbackErr);
        setChatMessages((prev) => {
          const updated = [...prev];
          updated[assistantIndex] = {
            role: "assistant",
            content: "⚠️ Sorry, I encountered an issue connecting to the Co-pilot server.",
            isStreaming: false
          };
          return updated;
        });
      }
    } finally {
      setIsAsking(false);
    }
  };

  const handleRunScriptSync = async () => {
    setIsSyncing(true);
    setProposedResult(null);
    setAppliedSuccess(false);

    try {
      const res = await axios.post("/api/agent/copilot/sync-script", {
        projectTitle,
        storyContent,
        currentScriptContent: scriptContent,
        userInstruction: syncInstruction
      });

      if (res.data) {
        setProposedResult(res.data);
      }
    } catch (err) {
      console.error("Co-pilot sync error:", err);
      if (err.response?.data) {
        setProposedResult(err.response.data);
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const handleConsentApply = () => {
    if (proposedResult?.proposedScript && onApplyScriptEdit) {
      onApplyScriptEdit(proposedResult.proposedScript);
      setAppliedSuccess(true);
      setTimeout(() => setAppliedSuccess(false), 4000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-4xl rounded-2xl border border-slate-700/80 bg-slate-900 text-slate-100 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 sm:px-6 py-3.5 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 text-2xl shadow-sm">
              {persona.emoji}
            </div>
            <div>
              <h2 className="text-base font-bold text-amber-100 flex items-center gap-2">
                {persona.name}
                <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {persona.badge}
                </span>
              </h2>
              <p className="text-xs text-slate-400">Consulting for &quot;{projectTitle}&quot; ({persona.movie})</p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {/* Response Character Limit Pill Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowCharConfig(!showCharConfig)}
                className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition flex items-center gap-1.5 cursor-pointer ${
                  showCharConfig
                    ? "bg-teal-500/20 text-teal-300 border-teal-500/40"
                    : "bg-slate-800/90 text-slate-300 hover:text-amber-300 hover:bg-slate-800 border-slate-700"
                }`}
                title="Configure Chatbot Response Character Limit (env: CHATBOT_MAX_CHARS)"
              >
                <span>📏</span>
                <span>{maxChars.toLocaleString()} chars</span>
                <span className="text-[9px] text-slate-400">▼</span>
              </button>

              {/* Character Limit Dropdown Drawer */}
              {showCharConfig && (
                <div className="absolute right-0 mt-1.5 w-64 p-3 bg-slate-950 border border-slate-700 rounded-xl shadow-2xl z-30 space-y-2.5 animate-fade-in text-xs">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                    <span className="font-bold text-amber-300 text-[11px] uppercase tracking-wider">Response Length</span>
                    <span className="text-[10px] text-slate-400 font-mono">env: CHATBOT_MAX_CHARS</span>
                  </div>

                  {/* Presets */}
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setMaxChars(500);
                        setCustomCharInput(500);
                        setShowCharConfig(false);
                      }}
                      className={`px-2 py-1.5 rounded-lg text-center font-bold text-[10px] transition border ${
                        maxChars === 500
                          ? "bg-amber-500 text-slate-950 border-amber-400 font-black"
                          : "bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      ⚡ 500<br/><span className="text-[9px] font-normal opacity-80">Concise</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMaxChars(1200);
                        setCustomCharInput(1200);
                        setShowCharConfig(false);
                      }}
                      className={`px-2 py-1.5 rounded-lg text-center font-bold text-[10px] transition border ${
                        maxChars === 1200
                          ? "bg-amber-500 text-slate-950 border-amber-400 font-black"
                          : "bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      🎬 1,200<br/><span className="text-[9px] font-normal opacity-80">Standard</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMaxChars(2500);
                        setCustomCharInput(2500);
                        setShowCharConfig(false);
                      }}
                      className={`px-2 py-1.5 rounded-lg text-center font-bold text-[10px] transition border ${
                        maxChars === 2500
                          ? "bg-amber-500 text-slate-950 border-amber-400 font-black"
                          : "bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      📜 2,500<br/><span className="text-[9px] font-normal opacity-80">Deep Dive</span>
                    </button>
                  </div>

                  {/* Custom Slider / Input */}
                  <div className="pt-1.5 space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-300 font-medium">
                      <span>Custom Limit:</span>
                      <span className="font-mono text-amber-300 font-bold">{customCharInput} chars</span>
                    </div>
                    <input
                      type="range"
                      min="300"
                      max="4000"
                      step="100"
                      value={customCharInput}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setCustomCharInput(val);
                        setMaxChars(val);
                      }}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                    />
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setShowIntro(true)}
              className="text-[11px] font-bold text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-1 rounded-lg border border-amber-500/30 transition flex items-center gap-1 cursor-pointer"
              title="Replay Character Entrance Animation"
            >
              <span>🎬</span> Replay Intro
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              aria-label="Close modal"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/50 px-6 pt-2">
          <div className="flex">
            <button
              onClick={() => {
                setActiveTab("chat");
                setShowIntro(false);
              }}
              className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
                activeTab === "chat"
                  ? "border-amber-400 text-amber-300"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <span>💬</span> Consult {persona.name.split(" ")[0]}
            </button>
            <button
              onClick={() => {
                setActiveTab("sync");
                setShowIntro(false);
              }}
              className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
                activeTab === "sync"
                  ? "border-teal-400 text-teal-300"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <span>⚡</span> Auto-Sync Script
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-[10px] text-slate-400">
            <span className="flex items-center gap-1 bg-slate-800/80 px-2 py-0.5 rounded-full border border-slate-700">
              <span className="text-amber-400">✨</span> RMD Formatted &bull; Ctrl+Shift+V Copy
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {showIntro ? (
            renderPersonaIntro(user?.aiPersona || "jack_sparrow", persona, projectTitle, () => setShowIntro(false))
          ) : activeTab === "chat" ? (
            <div className="space-y-4 flex flex-col h-full min-h-[300px]">
              {/* Message List */}
              <div className="flex-1 space-y-4 overflow-y-auto pr-1 sm:pr-2 max-h-[400px]">
                {chatMessages.map((msg, idx) => {
                  const isUser = msg.role === "user";
                  const viewMode = messageViewModes[idx] || "rich";
                  const currentFeedback = copyFeedback[idx];

                  return (
                    <div
                      key={idx}
                      className={`flex flex-col ${
                        isUser ? "items-end" : "items-start"
                      }`}
                    >
                      {isUser ? (
                        <div className="max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed bg-amber-600 text-amber-950 font-semibold rounded-br-none shadow-md">
                          {msg.content}
                        </div>
                      ) : (
                        <div className="w-full max-w-[95%] sm:max-w-[90%] space-y-1.5 group">
                          {/* Character Avatar & Thought Header */}
                          <div className="flex items-center justify-between px-2 text-[11px] font-bold text-amber-300/90">
                            <div className="flex items-center gap-1.5">
                              <span className="text-base">{persona.emoji}</span>
                              <span className="text-amber-200">{persona.name}</span>
                              <span className="text-amber-400/60 font-normal">💭 thoughts:</span>
                            </div>

                            {/* Response Actions Toolbar */}
                            <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100 transition">
                              {/* Character Counter */}
                              <span className="text-[10px] text-slate-400 font-mono mr-1 hidden sm:inline-block">
                                {msg.content.length} chars
                              </span>

                              {/* Toggle Rich / Plain (Ctrl+Shift+V) View */}
                              <button
                                type="button"
                                onClick={() => toggleViewMode(idx)}
                                className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition flex items-center gap-1 cursor-pointer"
                                title="Toggle between Rich Formatted Markdown and Raw (Ctrl+Shift+V) Text View"
                              >
                                {viewMode === "rich" ? (
                                  <>
                                    <span>📋</span>
                                    <span>Plain View</span>
                                  </>
                                ) : (
                                  <>
                                    <span>✨</span>
                                    <span>Rich View</span>
                                  </>
                                )}
                              </button>

                              {/* 1-Click Clean Paste (Ctrl+Shift+V formatted) Copy */}
                              <button
                                type="button"
                                onClick={() => handleCopyPlainText(msg.content, idx)}
                                className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 transition flex items-center gap-1 cursor-pointer"
                                title="Copy as Clean Plain Text (Ctrl+Shift+V ready for any editor)"
                              >
                                {currentFeedback === "plain" ? (
                                  <>
                                    <span className="text-emerald-400">✓</span>
                                    <span className="text-emerald-300">Clean Copied!</span>
                                  </>
                                ) : (
                                  <>
                                    <span>📋</span>
                                    <span>Ctrl+Shift+V Copy</span>
                                  </>
                                )}
                              </button>

                              {/* Copy Raw Markdown */}
                              <button
                                type="button"
                                onClick={() => handleCopyRawMarkdown(msg.content, idx)}
                                className="px-1.5 py-0.5 rounded text-[10px] font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
                                title="Copy Raw Markdown format"
                              >
                                {currentFeedback === "raw" ? "✓ MD Copied" : ".md"}
                              </button>
                            </div>
                          </div>

                          {/* Main Thought Bubble Cloud / RMD Container */}
                          <div className="relative bg-slate-800/95 text-amber-50 border border-amber-500/30 rounded-3xl p-4 sm:p-5 shadow-xl backdrop-blur-md transition-all">
                            {msg.isStreaming && !msg.content ? (
                              <div className="flex items-center gap-3 py-1">
                                <span className="text-xl animate-spin">{persona.emoji}</span>
                                <div className="flex-1 text-xs sm:text-sm text-amber-200 font-medium animate-pulse">
                                  {persona.thinkingText || "Consulting Hollywood archives..."}
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: "0ms" }}></span>
                                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: "150ms" }}></span>
                                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: "300ms" }}></span>
                                </div>
                              </div>
                            ) : viewMode === "plain" ? (
                              <div className="space-y-1.5">
                                <div className="text-[10px] font-mono uppercase tracking-wider text-amber-400/80 bg-slate-900 px-2 py-0.5 rounded w-fit border border-amber-500/20">
                                  📋 Clean Plain Text (Ctrl+Shift+V Format)
                                </div>
                                <pre className="text-xs sm:text-sm font-mono text-slate-200 whitespace-pre-wrap leading-relaxed overflow-x-auto bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                                  {msg.content}
                                </pre>
                              </div>
                            ) : (
                              <div>
                                <MarkdownRenderer content={msg.content} />
                                {msg.isStreaming && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-amber-400 mt-2 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 animate-pulse">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
                                    Streaming response...
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Thought Bubble Trailing Stem Circles */}
                          <div className="flex flex-col gap-1 items-start pl-6 pt-0.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-slate-800 border border-amber-500/40 shadow-sm" />
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-800 border border-amber-500/30 shadow-sm ml-1" />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Animated Active Thinking Bubble Effect (when no message streaming yet) */}
                {isAsking && !chatMessages.some(m => m.isStreaming) && (
                  <div className="flex flex-col items-start space-y-1 animate-fadeIn">
                    <div className="flex items-center gap-1.5 px-2 text-[11px] font-bold text-amber-300/80">
                      <span className="text-sm animate-bounce">{persona.emoji}</span>
                      <span>{persona.name}</span>
                      <span className="text-amber-400 animate-pulse flex items-center gap-1">
                        💭 crafting response (under {maxChars.toLocaleString()} chars)...
                      </span>
                    </div>

                    {/* Glowing Animated Thought Bubble Cloud */}
                    <div className="relative bg-slate-800/90 border-2 border-amber-400/60 rounded-3xl p-4 text-xs sm:text-sm text-amber-200 flex items-center gap-3 shadow-2xl shadow-amber-500/10 backdrop-blur-sm animate-pulse">
                      <div className="relative flex items-center justify-center">
                        <span className="text-xl animate-spin">{persona.emoji}</span>
                        <span className="absolute -top-1 -right-1 text-xs animate-ping">💭</span>
                      </div>
                      <div className="flex-1 font-medium">
                        {persona.thinkingText}
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: "0ms" }}></span>
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: "150ms" }}></span>
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: "300ms" }}></span>
                      </div>
                    </div>

                    {/* Trailing Stem Dots */}
                    <div className="flex flex-col gap-1 items-start pl-6 pt-0.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-slate-800 border border-amber-400/60 animate-pulse shadow-sm" />
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-800 border border-amber-400/40 animate-ping shadow-sm ml-1" />
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Prompt Suggestions */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] scrollbar-none">
                <span className="text-slate-400 font-semibold shrink-0">💡 Quick:</span>
                {PROMPT_SUGGESTIONS.map((item, i) => (
                  <button
                    key={i}
                    type="button"
                    disabled={isAsking}
                    onClick={() => handleSendPrompt(null, item.prompt)}
                    className="shrink-0 px-2.5 py-1 rounded-full bg-slate-800 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 border border-slate-700 hover:border-amber-500/40 transition text-[11px] font-medium cursor-pointer"
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendPrompt} className="flex gap-2 pt-2 border-t border-slate-800">
                <input
                  type="text"
                  value={userPrompt}
                  onChange={(e) => setUserPrompt(e.target.value)}
                  placeholder={persona.placeholder}
                  className="input text-xs sm:text-sm border-amber-900/50 focus:border-amber-400 text-amber-100"
                />
                <button
                  type="submit"
                  disabled={isAsking || !userPrompt.trim()}
                  className="rounded-xl bg-amber-500 px-5 py-2.5 text-xs sm:text-sm font-bold text-slate-950 hover:bg-amber-400 disabled:opacity-50 transition cursor-pointer whitespace-nowrap shadow-md shadow-amber-500/20"
                >
                  {persona.buttonText}
                </button>
              </form>
            </div>
          ) : null}

          {activeTab === "sync" && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-teal-950/30 border border-teal-500/30 text-xs sm:text-sm text-teal-200 leading-relaxed">
                <p className="font-bold text-teal-300 mb-1">How Auto-Edit & Sync Works:</p>
                When you modify your Story outline, the Co-pilot agent scans the changes, drafts updated screenplay scenes in proper format, and presents them below for your explicit consent before applying them to your project script.
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300">
                  Optional User Instructions for Script Edits
                </label>
                <input
                  type="text"
                  value={syncInstruction}
                  onChange={(e) => setSyncInstruction(e.target.value)}
                  placeholder="e.g., Focus on incorporating the new confrontation in Chapter 2 into Act II dialogue."
                  className="input text-xs"
                />
              </div>

              <button
                type="button"
                onClick={handleRunScriptSync}
                disabled={isSyncing}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-slate-950 font-bold text-xs sm:text-sm shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSyncing ? (
                  <>
                    <span className="animate-spin text-slate-950">🌀</span>
                    <span>Analyzing Story & Draft Screenplay Edits...</span>
                  </>
                ) : (
                  <>
                    <span>⚡ Analyze Story & Propose Script Edits</span>
                  </>
                )}
              </button>

              {/* Proposed Result & Consent Panel */}
              {proposedResult && (
                <div className="space-y-4 pt-4 border-t border-slate-800 animate-fade-in">
                  <div className="p-4 rounded-xl bg-slate-800 border border-slate-700 space-y-2">
                    <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                      🔍 Analysis of Changes
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                      {proposedResult.analysis}
                    </p>

                    {proposedResult.diffHighlights?.length > 0 && (
                      <div className="pt-2">
                        <p className="text-[11px] font-bold text-slate-400 mb-1">Key Updates:</p>
                        <ul className="list-disc list-inside text-xs text-slate-300 space-y-1">
                          {proposedResult.diffHighlights.map((h, i) => (
                            <li key={i}>{h}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Script Preview Box */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">
                      Proposed Screenplay Draft
                    </label>
                    <textarea
                      readOnly
                      rows={8}
                      value={proposedResult.proposedScript}
                      className="w-full font-mono text-xs p-3 rounded-xl bg-slate-950 border border-slate-800 text-teal-300"
                    />
                  </div>

                  {/* Consent Action Bar */}
                  <div className="p-4 rounded-xl bg-slate-950 border border-teal-500/40 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold text-white">Approve Script Changes?</p>
                      <p className="text-[11px] text-slate-400">
                        This will update your screenplay text with the Co-pilot&apos;s proposed edits.
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setProposedResult(null)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition"
                      >
                        Decline
                      </button>
                      <button
                        type="button"
                        onClick={handleConsentApply}
                        className="px-4 py-2 rounded-xl bg-teal-400 text-slate-950 font-bold text-xs hover:bg-teal-300 transition shadow-md shadow-teal-500/20 cursor-pointer"
                      >
                        ✓ Consent & Apply Edits
                      </button>
                    </div>
                  </div>

                  {appliedSuccess && (
                    <div className="p-3 rounded-xl bg-emerald-950 border border-emerald-500/50 text-emerald-300 text-xs font-bold text-center">
                      ✓ Success! Script successfully updated with AI Co-pilot changes.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

