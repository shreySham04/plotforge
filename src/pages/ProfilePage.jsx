import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import CollaborationInvitationsCard from "../components/CollaborationInvitationsCard";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { extractApiError } from "../utils/errors";
import { AI_PERSONAS } from "../utils/aiPersonas";

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const {
    theme,
    setTheme,
    themePreset,
    setThemePreset,
    colorAccent,
    setColorAccent,
    currentMovieTheme,
    currentColorAccent,
    movieThemesList,
    colorAccentsList
  } = useTheme();

  const [username, setUsername] = useState(user?.username || "");
  const [email, setEmail] = useState(user?.email || "");
  const [aiPersona, setAiPersona] = useState(user?.aiPersona || "jack_sparrow");
  const [themeCategory, setThemeCategory] = useState("all");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [previewText, setPreviewText] = useState("PlotForge Studio");

  useEffect(() => {
    if (user) {
      if (user.username) setUsername(user.username);
      if (user.email) setEmail(user.email);
      if (user.aiPersona) setAiPersona(user.aiPersona);
      if (user.theme) setTheme(user.theme);
      if (user.themePreset) setThemePreset(user.themePreset);
      if (user.colorAccent) setColorAccent(user.colorAccent);
    }
  }, [user]);

  async function handleSave(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      if (updateProfile) {
        await updateProfile({
          username,
          email,
          aiPersona,
          theme,
          themePreset,
          colorAccent
        });
      }
      setMessage("✨ Profile, Movie Theme & AI Assistant preferences updated successfully!");
    } catch (err) {
      setError(extractApiError(err, "Failed to update profile preferences."));
    } finally {
      setLoading(false);
    }
  }

  const filteredMovieThemes = movieThemesList.filter((m) => {
    if (themeCategory === "all") return true;
    if (themeCategory === "scifi") return m.category.includes("Sci-Fi") || m.category.includes("Cyberpunk");
    if (themeCategory === "epic") return m.category.includes("Epic") || m.category.includes("Action") || m.category.includes("Adventure");
    if (themeCategory === "fantasy") return m.category.includes("Fantasy") || m.category.includes("Magic");
    if (themeCategory === "noir") return m.category.includes("Noir") || m.category.includes("Cult") || m.category.includes("Drama");
    return true;
  });

  const isDark = theme === "dark";
  const primaryColor = currentMovieTheme?.primary || currentColorAccent?.hex || "#14b8a6";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070b12] text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-300">
      <Navbar />

      <main className="mx-auto max-w-4xl px-4 py-10 flex-1 space-y-8">
        {/* Header banner */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800/80 pb-6">
          <div className="space-y-1">
            <div
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition-all"
              style={{
                backgroundColor: `${primaryColor}15`,
                color: primaryColor,
                border: `1px solid ${primaryColor}40`
              }}
            >
              <span>🎨</span> Personalized Studio Experience
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              Profile &amp; Visual Universe
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-xl">
              Customize your screenwriter identity, immerse in iconic movie atmospheres (The Matrix, Star Wars Sith Red, Blade Runner 2049, Interstellar), and choose your personal AI co-pilot.
            </p>
          </div>

          {/* Quick Active Theme Pill */}
          <div className="flex items-center gap-2.5 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-3 rounded-2xl shadow-sm">
            <span className="text-2xl">{currentMovieTheme.icon}</span>
            <div className="text-left">
              <span className="block text-[10px] uppercase font-bold text-slate-400">Current Theme</span>
              <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100">
                {currentMovieTheme.name}
              </span>
            </div>
            <div
              className="w-4 h-4 rounded-full shadow-sm ml-1"
              style={{ backgroundColor: primaryColor }}
              title={currentMovieTheme.name}
            />
          </div>
        </header>

        <CollaborationInvitationsCard />

        <form onSubmit={handleSave} className="space-y-8">
          {/* Section 1: Account Credentials */}
          <div className="card space-y-4">
            <div className="border-b border-slate-100 dark:border-slate-800/80 pb-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>👤</span> Writer Credentials
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Your public pen name and account details across PlotForge projects.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Writer Username
                </label>
                <input
                  type="text"
                  className="input text-sm"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. QuentinTarantino"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  className="input text-sm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="screenwriter@studio.com"
                  required
                />
              </div>
            </div>
          </div>

          {/* Section 2: Movie Universe Themes (Core Request) */}
          <div className="card space-y-5 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span>🎬</span> Movie Universe Themes
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Transform PlotForge into iconic cinematic worlds with customized background tones, glowing accents, and bespoke color grading.
                </p>
              </div>

              {/* Category Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: "all", label: "All Movies" },
                  { id: "scifi", label: "Sci-Fi" },
                  { id: "epic", label: "Epic / Action" },
                  { id: "fantasy", label: "Fantasy" },
                  { id: "noir", label: "Noir / Cult" }
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setThemeCategory(cat.id)}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition ${
                      themeCategory === cat.id
                        ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Movie Themes Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredMovieThemes.map((m) => {
                const isSelected = themePreset === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setThemePreset(m.id)}
                    className={`p-3.5 rounded-2xl border text-left transition-all relative flex flex-col justify-between gap-3 cursor-pointer group ${
                      isSelected
                        ? "ring-2 shadow-lg scale-[1.01]"
                        : "border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-950/60 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300 hover:scale-[1.005]"
                    }`}
                    style={
                      isSelected
                        ? {
                            borderColor: m.primary,
                            backgroundColor: isDark ? m.cardDark : "#ffffff",
                            boxShadow: `0 8px 25px -4px ${m.glow}`,
                            ringColor: m.primary
                          }
                        : {}
                    }
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl p-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 group-hover:scale-110 transition">
                          {m.icon}
                        </span>
                        <div>
                          <h4 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 leading-tight">
                            {m.name}
                          </h4>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {m.movie}
                          </span>
                        </div>
                      </div>

                      {isSelected ? (
                        <span
                          className="text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm"
                          style={{
                            backgroundColor: `${m.primary}25`,
                            color: m.primary,
                            border: `1px solid ${m.primary}50`
                          }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full animate-ping" style={{ backgroundColor: m.primary }} />
                          Active
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded-md">
                          {m.category.split("/")[0]}
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug line-clamp-2">
                      {m.tagline}
                    </p>

                    {/* Color Swatch Bar */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-900 text-[10px]">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-black/20 dark:border-white/20 shadow-sm"
                          style={{ backgroundColor: m.bgDark }}
                          title="Background Tone"
                        />
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-black/20 dark:border-white/20 shadow-sm"
                          style={{ backgroundColor: m.primary }}
                          title="Primary Accent"
                        />
                        <span className="text-[10px] font-mono text-slate-400">
                          {m.primary}
                        </span>
                      </div>
                      <span className="text-[10px] font-semibold opacity-80" style={{ color: m.primary }}>
                        {isSelected ? "Selected" : "Apply"} &rarr;
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Color Accents & Base Mode */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Color Accent Selector */}
            <div className="card space-y-4">
              <div className="border-b border-slate-100 dark:border-slate-800/80 pb-2.5">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span>🌈</span> Custom Color Accents
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Select a distinct neon or cinematic color tone (e.g. Red, Blue, Green, Purple).
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {colorAccentsList.map((c) => {
                  const isSelected = colorAccent === c.id && themePreset === "default";
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setColorAccent(c.id);
                        setThemePreset("default"); // Switch to custom color mode
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2 cursor-pointer ${
                        isSelected
                          ? "ring-2 shadow-md font-bold"
                          : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/60 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700"
                      }`}
                      style={
                        isSelected
                          ? {
                              borderColor: c.hex,
                              backgroundColor: `${c.hex}15`,
                              color: isDark ? "#ffffff" : "#0f172a"
                            }
                          : {}
                      }
                    >
                      <span
                        className="w-4 h-4 rounded-full shadow-sm flex-shrink-0"
                        style={{ backgroundColor: c.hex }}
                      />
                      <span className="text-[11px] truncate">{c.name.split(" ")[0]}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Base Mode & Live Interactive Sandbox */}
            <div className="card space-y-4">
              <div className="border-b border-slate-100 dark:border-slate-800/80 pb-2.5">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span>⚡</span> Base Mode &amp; Live Preview
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Toggle studio dark / light mode and inspect live component rendering.
                </p>
              </div>

              {/* Mode Toggle */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setTheme("dark")}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                    theme === "dark"
                      ? "border-slate-700 bg-slate-900 text-white shadow-md ring-2 ring-slate-700"
                      : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  🌙 Dark Cinema
                </button>
                <button
                  type="button"
                  onClick={() => setTheme("light")}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                    theme === "light"
                      ? "border-slate-300 bg-white text-slate-900 shadow-md ring-2 ring-slate-300"
                      : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  ☀️ Studio Light
                </button>
              </div>

              {/* Live UI Sandbox Widget */}
              <div
                className="p-3.5 rounded-xl border space-y-2.5 transition-all"
                style={{
                  backgroundColor: isDark ? currentMovieTheme.bgDark : "#f8fafc",
                  borderColor: `${primaryColor}40`,
                  boxShadow: `0 4px 18px -2px ${currentMovieTheme.glow}`
                }}
              >
                <div className="flex items-center justify-between">
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md"
                    style={{
                      backgroundColor: `${primaryColor}20`,
                      color: primaryColor
                    }}
                  >
                    Live Preview: {currentMovieTheme.name}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {primaryColor}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    className="input text-xs py-1.5"
                    value={previewText}
                    onChange={(e) => setPreviewText(e.target.value)}
                    placeholder="Type to test input focus..."
                  />
                  <button
                    type="button"
                    className="btn text-xs py-1.5 px-3 whitespace-nowrap"
                  >
                    Action
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: AI Co-pilot Movie Character Persona */}
          <div className="card space-y-4">
            <div className="border-b border-slate-100 dark:border-slate-800/80 pb-3">
              <label className="block text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>🤖</span> AI Screenplay Co-pilot Movie Character
              </label>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Choose an iconic cinematic personality to advise you while drafting screenplays and stories.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {AI_PERSONAS.map((persona) => {
                const isSelected = aiPersona === persona.id;
                return (
                  <button
                    key={persona.id}
                    type="button"
                    onClick={() => setAiPersona(persona.id)}
                    className={`p-3.5 rounded-2xl border text-left transition-all relative flex flex-col justify-between gap-2.5 cursor-pointer ${
                      isSelected
                        ? "border-amber-500 bg-amber-500/10 dark:bg-amber-500/15 text-slate-900 dark:text-slate-100 ring-2 ring-amber-500/50 shadow-md scale-[1.01]"
                        : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/60 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl p-1 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                          {persona.emoji}
                        </span>
                        <div>
                          <h4 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 leading-tight">
                            {persona.name}
                          </h4>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                            {persona.movie}
                          </p>
                        </div>
                      </div>
                      {isSelected && (
                        <span className="text-[10px] text-amber-500 dark:text-amber-400 font-extrabold bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30">
                          Active Co-pilot
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed italic bg-slate-100/70 dark:bg-slate-900/50 p-2 rounded-xl">
                      &quot;{persona.greeting("Your Story")}&quot;
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Feedback message / errors */}
          {message && (
            <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 shadow-sm animate-fadeIn">
              <span className="text-base">✅</span>
              <span>{message}</span>
            </div>
          )}
          {error && (
            <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs font-bold flex items-center gap-2 shadow-sm">
              <span className="text-base">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Submit Action Button */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200 dark:border-slate-800/80 pt-5">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              All theme changes apply in real-time and persist across devices.
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn text-sm py-3 px-8 font-extrabold w-full sm:w-auto cursor-pointer"
            >
              {loading ? "Saving Universe Preferences..." : "Save Preferences"}
            </button>
          </div>
        </form>
      </main>

      <Footer />
    </div>
  );
}
