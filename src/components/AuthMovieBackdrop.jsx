import { useEffect, useState, useCallback } from "react";
import { MOVIE_SLIDES } from "../data/slides";

export default function AuthMovieBackdrop({
  activeSlide: controlledActiveSlide,
  setActiveSlide: controlledSetActiveSlide,
  children
}) {
  const [internalActiveSlide, setInternalActiveSlide] = useState(0);
  const activeSlide = controlledActiveSlide !== undefined ? controlledActiveSlide : internalActiveSlide;
  const setActiveSlide = controlledSetActiveSlide || setInternalActiveSlide;

  const [slides] = useState(MOVIE_SLIDES);
  const [imgErrorStage, setImgErrorStage] = useState({});
  const [isPaused] = useState(false);
  const [viewMode, setViewMode] = useState("scene"); // 'scene' | 'poster'

  const currentIndex = ((activeSlide % slides.length) + slides.length) % slides.length;
  const currentSlide = slides[currentIndex] || slides[0];

  const handleNext = useCallback((e) => {
    if (e) e.stopPropagation();
    setActiveSlide((prev) => (prev + 1) % slides.length);
  }, [slides.length, setActiveSlide]);

  const handlePrev = useCallback((e) => {
    if (e) e.stopPropagation();
    setActiveSlide((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length, setActiveSlide]);

  // Keyboard navigation: Left/Right arrows change movies
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === " ") {
        e.preventDefault();
        setIsPaused((p) => !p);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleNext, handlePrev]);

  // Automatic Background Rotation with Pause support
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [slides.length, isPaused, setActiveSlide]);

  // Preload adjacent movie images for instantaneous crossfade transitions
  useEffect(() => {
    const nextIdx = (currentIndex + 1) % slides.length;
    const prevIdx = (currentIndex - 1 + slides.length) % slides.length;
    const targets = [slides[nextIdx], slides[prevIdx]].filter(Boolean);

    targets.forEach((slide) => {
      const primaryUrl = viewMode === "poster" ? slide.poster : slide.tmdbBackdrop;
      if (primaryUrl) {
        const img = new Image();
        img.src = `/api/tmdb/proxy-image?url=${encodeURIComponent(primaryUrl)}`;
      }
    });
  }, [currentIndex, slides, viewMode]);

  // Resolve genuine movie scene still or theatrical poster
  const getSlideImageUrl = (slide, idx) => {
    const stage = imgErrorStage[slide.id || idx] || 0;
    const proxiedBackdrop = slide.tmdbBackdrop
      ? `/api/tmdb/proxy-image?url=${encodeURIComponent(slide.tmdbBackdrop)}`
      : null;
    const proxiedPoster = slide.poster
      ? `/api/tmdb/proxy-image?url=${encodeURIComponent(slide.poster)}`
      : null;

    // Strictly official movie scene stills or movie posters (never random scenery)
    const sources =
      viewMode === "poster"
        ? [proxiedPoster, proxiedBackdrop, slide.poster, slide.tmdbBackdrop].filter(Boolean)
        : [proxiedBackdrop, proxiedPoster, slide.tmdbBackdrop, slide.poster].filter(Boolean);

    if (stage < sources.length) {
      return sources[stage];
    }
    return null;
  };

  const handleImageError = (slide, idx) => {
    setImgErrorStage((prev) => {
      const currentStage = prev[slide.id || idx] || 0;
      return { ...prev, [slide.id || idx]: currentStage + 1 };
    });
  };

  const posterThumbUrl = currentSlide.poster
    ? `/api/tmdb/proxy-image?url=${encodeURIComponent(currentSlide.poster)}`
    : null;

  return (
    <main
      onClick={handleNext}
      className="relative flex-1 w-full min-h-[calc(100vh-64px)] overflow-hidden select-none bg-slate-950 cursor-pointer flex flex-col justify-center"
      title="Click anywhere to change movie (or use arrow keys)"
    >
      {/* Full-screen authentic movie scene / poster backdrop */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {slides.map((slide, idx) => {
          const isActive = idx === currentIndex;
          // Render only active, previous, and next slides to conserve network bandwidth
          const isAdjacent =
            Math.abs(idx - currentIndex) <= 1 ||
            (currentIndex === 0 && idx === slides.length - 1) ||
            (currentIndex === slides.length - 1 && idx === 0);

          if (!isActive && !isAdjacent) return null;

          const imgSrc = getSlideImageUrl(slide, idx);

          return (
            <div
              key={slide.id || idx}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                isActive ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
              }`}
            >
              {imgSrc ? (
                <div className="relative w-full h-full overflow-hidden">
                  <img
                    src={imgSrc}
                    alt={`${slide.movie} - ${viewMode === "poster" ? "Movie Poster" : "Movie Scene"}`}
                    loading={isActive ? "eager" : "lazy"}
                    className={`w-full h-full transform transition-transform duration-10000 ${
                      viewMode === "poster"
                        ? "object-contain sm:object-cover scale-100"
                        : "object-cover scale-105"
                    } filter brightness-90 contrast-105`}
                    onError={() => handleImageError(slide, idx)}
                  />
                  {/* Subtle blurred backdrop behind portrait posters if in poster mode */}
                  {viewMode === "poster" && slide.poster && (
                    <div
                      className="absolute inset-0 -z-10 bg-cover bg-center filter blur-3xl opacity-40 scale-125"
                      style={{
                        backgroundImage: `url(/api/tmdb/proxy-image?url=${encodeURIComponent(slide.poster)})`
                      }}
                    />
                  )}
                </div>
              ) : (
                <div
                  className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden"
                  style={{
                    background: `radial-gradient(circle at 50% 40%, ${slide.themeColor || "#3b82f6"}30, #030712 85%)`
                  }}
                >
                  <div className="text-center opacity-40 select-none space-y-3 px-6">
                    <span
                      className="text-5xl sm:text-7xl font-black uppercase tracking-widest block"
                      style={{ color: slide.themeColor || "#38bdf8" }}
                    >
                      {slide.genre || "Cinema"}
                    </span>
                    <h3 className="text-3xl sm:text-4xl font-extrabold text-white tracking-wide">
                      {slide.movie}
                    </h3>
                  </div>
                </div>
              )}

              {/* Cinematic Vignette Layers */}
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/40 to-slate-950/85" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-slate-950/60" />
              <div
                className="absolute inset-0 opacity-10 mix-blend-color"
                style={{ backgroundColor: slide.themeColor || "#3b82f6" }}
              />
            </div>
          );
        })}
      </div>

      {/* Top Left Floating Controller & Movie Card (With Official Poster Thumbnail) */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="absolute top-4 left-4 sm:top-6 sm:left-6 z-30 max-w-[340px] sm:max-w-lg pointer-events-auto"
      >
        <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-950/85 border border-slate-700/80 backdrop-blur-xl shadow-2xl space-y-3 transition-all duration-300 hover:border-slate-600 hover:bg-slate-950/95">
          {/* Main Card Content: Official Poster Thumbnail + Movie Details */}
          <div className="flex items-start gap-3 min-w-0">
            {/* Theatrical Poster Thumbnail */}
            {posterThumbUrl && (
              <div
                onClick={() => setViewMode((m) => (m === "poster" ? "scene" : "poster"))}
                className="relative group shrink-0 w-12 sm:w-14 rounded-lg overflow-hidden border border-slate-700/80 shadow-md cursor-pointer transition-transform hover:scale-105"
                title={`Click to set background to ${viewMode === "poster" ? "Movie Scene" : "Theatrical Poster"}`}
              >
                <img
                  src={posterThumbUrl}
                  alt={`${currentSlide.movie} official poster`}
                  className="w-full h-auto aspect-[2/3] object-cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-[9px] font-bold text-white uppercase text-center px-0.5">
                  {viewMode === "poster" ? "Show Scene" : "Show Poster"}
                </div>
              </div>
            )}

            {/* Movie Title, Genre & Iconic Quote */}
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-2">
                <span
                  className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-slate-950 px-2 py-0.5 rounded-full shadow-sm shrink-0"
                  style={{ backgroundColor: currentSlide.themeColor || "#38bdf8" }}
                >
                  {currentSlide.genre}
                </span>
              </div>

              <h2 className="text-base sm:text-lg font-black tracking-tight text-white drop-shadow-md truncate">
                {currentSlide.movie}
              </h2>

              {/* Iconic Quote */}
              <p
                className="text-xs sm:text-[13px] font-serif italic font-medium leading-relaxed tracking-wide text-slate-200/90 pt-0.5"
                style={{ textShadow: "0 2px 10px rgba(0,0,0,0.9)" }}
              >
                {currentSlide.quote}
              </p>
            </div>
          </div>

          {/* Display Mode Bar */}
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span className="text-[11px] text-slate-400 font-medium">Display backdrop:</span>
            {/* View Mode Toggle: Scene Still vs Movie Poster */}
            <div className="flex items-center bg-slate-900/90 rounded-md border border-slate-700/60 p-0.5">
              <button
                type="button"
                onClick={() => setViewMode("scene")}
                className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                  viewMode === "scene"
                    ? "bg-teal-500/30 text-teal-300 font-semibold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                title="Display iconic movie scene still"
              >
                Scene
              </button>
              <button
                type="button"
                onClick={() => setViewMode("poster")}
                className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                  viewMode === "poster"
                    ? "bg-teal-500/30 text-teal-300 font-semibold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                title="Display official theatrical movie poster"
              >
                Poster
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Layout - Right-Aligned Translucent Login / Register Panel */}
      <div className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-[calc(100vh-64px)] flex items-center justify-end">
        <section
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md p-6 sm:p-8 rounded-3xl bg-slate-950/80 backdrop-blur-2xl border border-slate-700/70 shadow-2xl transition-all duration-300 hover:border-slate-600 my-auto"
        >
          {children}
        </section>
      </div>
    </main>
  );
}
