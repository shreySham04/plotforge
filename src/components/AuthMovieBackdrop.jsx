import { useEffect, useState } from "react";
import { MOVIE_SLIDES } from "../data/slides";
import axios from "axios";
import apiClient from "../services/axios";

function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function AuthMovieBackdrop({ activeSlide, setActiveSlide, children }) {
  const [slides, setSlides] = useState(() => shuffleArray(MOVIE_SLIDES));
  const [imgErrorStage, setImgErrorStage] = useState({});
  const [tmdbImages, setTmdbImages] = useState({});

  const currentIndex = Math.min(activeSlide, slides.length - 1);
  const currentSlide = slides[currentIndex] || slides[0];

  // TMDB Dynamic Poster & Backdrop Fetcher
  useEffect(() => {
    let isMounted = true;
    const fetchTmdbForMovie = async (movieName) => {
      if (!movieName || tmdbImages[movieName]) return;
      try {
        const res = await axios.get(
          `https://api.themoviedb.org/3/search/multi?api_key=3fd2be6f0c70a2a598f084ddfb75487c&query=${encodeURIComponent(movieName)}`,
          { timeout: 4000 }
        );
        if (isMounted && res.data?.results?.length > 0) {
          const match = res.data.results.find((r) => r.backdrop_path || r.poster_path) || res.data.results[0];
          const backdrop = match.backdrop_path ? `https://image.tmdb.org/t/p/w1280${match.backdrop_path}` : null;
          const poster = match.poster_path ? `https://image.tmdb.org/t/p/w780${match.poster_path}` : null;
          if (backdrop || poster) {
            setTmdbImages((prev) => ({ ...prev, [movieName]: backdrop || poster }));
          }
        }
      } catch (err) {
        // Fallback
      }
    };

    if (currentSlide?.movie) {
      fetchTmdbForMovie(currentSlide.movie);
    }
    const nextIndex = (currentIndex + 1) % slides.length;
    if (slides[nextIndex]?.movie) {
      fetchTmdbForMovie(slides[nextIndex].movie);
    }

    return () => {
      isMounted = false;
    };
  }, [currentIndex, currentSlide?.movie, slides, tmdbImages]);

  // Automatic Background Rotation
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [slides.length, setActiveSlide]);

  // Click on background to change slide
  const handleBackdropClick = () => {
    setActiveSlide((prev) => (prev + 1) % slides.length);
  };

  // Helper to resolve current image URL through graceful fallback stages
  const getSlideImageUrl = (slide, idx) => {
    const stage = imgErrorStage[slide.id || idx] || 0;
    const sources = [
      slide.bgImage,
      tmdbImages[slide.movie],
      slide.poster,
      `https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1920&q=80` // Universal Cinema backdrop
    ].filter(Boolean);

    if (stage < sources.length) {
      return sources[stage];
    }
    return null; // All image sources failed
  };

  const handleImageError = (slide, idx) => {
    setImgErrorStage((prev) => {
      const currentStage = prev[slide.id || idx] || 0;
      return { ...prev, [slide.id || idx]: currentStage + 1 };
    });
  };

  // Agent 1: Option to fetch extra AI slide once on mount if desired
  useEffect(() => {
    let isMounted = true;
    const fetchBackgroundAISlide = async () => {
      try {
        const genres = ["Sci-Fi", "Romance", "Fantasy", "Crime", "Thriller", "Cyberpunk", "Drama"];
        const randomGenre = genres[Math.floor(Math.random() * genres.length)];
        const savedKey = localStorage.getItem("plotforge_gemini_api_key");
        const res = await apiClient.post("/agent/slides/generate", {
          genre: randomGenre,
          apiKey: savedKey || undefined
        });
        if (isMounted && res.data && res.data.quote) {
          setSlides((prev) => {
            if (prev.some((s) => s.quote === res.data.quote)) return prev;
            return [...prev, res.data];
          });
        }
      } catch (err) {
        // Silently handle background errors
      }
    };

    // Run once after 12 seconds
    const silentTimer = setTimeout(fetchBackgroundAISlide, 12000);
    return () => {
      isMounted = false;
      clearTimeout(silentTimer);
    };
  }, []);

  return (
    <main
      onClick={handleBackdropClick}
      className="relative flex-1 w-full min-h-[calc(100vh-64px)] overflow-hidden select-none bg-slate-950 cursor-pointer flex flex-col justify-center"
      title="Click anywhere to change movie backdrop"
    >
      {/* Full-screen background slides with poster images & rich gradients */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {slides.map((slide, idx) => {
          const isActive = idx === currentIndex;
          const imgSrc = getSlideImageUrl(slide, idx);

          return (
            <div
              key={slide.id || idx}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                isActive ? "opacity-100 z-10" : "opacity-0 z-0"
              }`}
            >
              {imgSrc ? (
                <img
                  src={imgSrc}
                  alt={slide.movie}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transform scale-105 transition-transform duration-10000"
                  onError={() => handleImageError(slide, idx)}
                />
              ) : (
                <div
                  className="w-full h-full bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 flex items-center justify-center relative overflow-hidden"
                  style={{
                    backgroundImage: `radial-gradient(circle at 50% 50%, ${slide.themeColor || "#3b82f6"}40, transparent 80%)`
                  }}
                >
                  <div className="text-center opacity-30 select-none space-y-2">
                    <span className="text-6xl sm:text-8xl font-black uppercase tracking-widest text-slate-100/20 block">
                      {slide.genre || "Cinema"}
                    </span>
                    <h3 className="text-3xl font-bold text-slate-300">{slide.movie}</h3>
                  </div>
                </div>
              )}

              {/* Gradient Vignette: Balanced edges to preserve image visibility while ensuring text contrast */}
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-950/20 to-slate-950/80" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-transparent to-slate-950/50" />
              <div
                className="absolute inset-0 opacity-20 mix-blend-overlay"
                style={{ backgroundColor: slide.themeColor || "#3b82f6" }}
              />
            </div>
          );
        })}
      </div>

      {/* Top Left Floating Overlay: Movie Dialogue & Quote Badge */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="absolute top-4 left-4 sm:top-6 sm:left-6 z-30 max-w-[280px] sm:max-w-xs md:max-w-sm lg:max-w-md pointer-events-auto"
      >
        <div className="p-3 sm:p-4 rounded-2xl bg-slate-950/70 border border-slate-700/60 backdrop-blur-xl shadow-2xl space-y-2 transition-all duration-500 hover:bg-slate-950/85">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-widest text-slate-950 px-2.5 py-0.5 rounded-full shadow-sm shrink-0"
                style={{ backgroundColor: currentSlide.themeColor || "#3b82f6" }}
              >
                {currentSlide.genre}
              </span>
              <span className="text-xs font-bold text-teal-400 truncate">{currentSlide.movie}</span>
            </div>
            <span className="text-[11px] text-slate-400 shrink-0">· {currentSlide.character}</span>
          </div>

          <p
            className="text-xs sm:text-sm font-serif italic font-semibold leading-relaxed tracking-wide text-white"
            style={{ textShadow: "0 2px 10px rgba(0,0,0,0.95)" }}
          >
            {currentSlide.quote}
          </p>
        </div>
      </div>

      {/* Main Content Layout - Right-Aligned Translucent Login / Register Panel */}
      <div className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-[calc(100vh-64px)] flex items-center justify-end">
        <section
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md p-6 sm:p-8 rounded-3xl bg-slate-950/75 backdrop-blur-xl border border-slate-700/60 shadow-2xl transition-all duration-300 hover:border-slate-600/80 my-auto"
        >
          {children}
        </section>
      </div>
    </main>
  );
}
