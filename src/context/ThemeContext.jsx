import { createContext, useContext, useEffect, useState } from "react";
import { MOVIE_THEMES, COLOR_ACCENTS } from "../utils/themePresets";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("plotforge_theme") || "dark";
  });

  const [themePreset, setThemePreset] = useState(() => {
    return localStorage.getItem("plotforge_theme_preset") || "default";
  });

  const [colorAccent, setColorAccent] = useState(() => {
    return localStorage.getItem("plotforge_color_accent") || "cyan";
  });

  useEffect(() => {
    localStorage.setItem("plotforge_theme", theme);
    localStorage.setItem("plotforge_theme_preset", themePreset);
    localStorage.setItem("plotforge_color_accent", colorAccent);

    const root = document.documentElement;
    const body = document.body;

    // Find active movie theme config
    const activeMovie = MOVIE_THEMES.find((m) => m.id === themePreset) || MOVIE_THEMES[0];
    const activeAccent = COLOR_ACCENTS.find((c) => c.id === colorAccent) || COLOR_ACCENTS[7]; // default cyan

    // If a custom color accent was picked, override primary colors unless a pure movie universe was selected
    const primaryColor = themePreset !== "default" ? activeMovie.primary : activeAccent.hex;
    const primaryHover = themePreset !== "default" ? activeMovie.primaryHover : activeAccent.hoverHex;
    const primaryText = themePreset !== "default" ? activeMovie.primaryText : activeAccent.textHex;
    const primaryGlow = themePreset !== "default" ? activeMovie.glow : activeAccent.glow;
    const primaryBgDark = themePreset !== "default" ? activeMovie.bgDark : "#070b12";
    const primaryCardDark = themePreset !== "default" ? activeMovie.cardDark : "#0d1424";

    // Set CSS custom properties
    root.style.setProperty("--theme-primary", primaryColor);
    root.style.setProperty("--theme-primary-hover", primaryHover);
    root.style.setProperty("--theme-primary-text", primaryText);
    root.style.setProperty("--theme-glow", primaryGlow);
    root.style.setProperty("--theme-ring", primaryGlow);
    root.style.setProperty("--theme-bg-dark", primaryBgDark);
    root.style.setProperty("--theme-card-dark", primaryCardDark);

    // Set data attributes for easy CSS targeting
    root.setAttribute("data-theme-preset", themePreset);
    root.setAttribute("data-color-accent", colorAccent);

    if (theme === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
      body.style.backgroundColor = primaryBgDark;
      body.classList.add("text-slate-100");
      body.classList.remove("bg-slate-50", "text-slate-900");
    } else {
      root.classList.add("light");
      root.classList.remove("dark");
      body.style.backgroundColor = "#f8fafc";
      body.classList.add("bg-slate-50", "text-slate-900");
      body.classList.remove("text-slate-100");
    }
  }, [theme, themePreset, colorAccent]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const applyCustomTheme = ({ newTheme, newPreset, newAccent }) => {
    if (newTheme) setTheme(newTheme);
    if (newPreset) setThemePreset(newPreset);
    if (newAccent) setColorAccent(newAccent);
  };

  const currentMovieTheme = MOVIE_THEMES.find((m) => m.id === themePreset) || MOVIE_THEMES[0];
  const currentColorAccent = COLOR_ACCENTS.find((c) => c.id === colorAccent) || COLOR_ACCENTS[0];

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        toggleTheme,
        themePreset,
        setThemePreset,
        colorAccent,
        setColorAccent,
        applyCustomTheme,
        currentMovieTheme,
        currentColorAccent,
        movieThemesList: MOVIE_THEMES,
        colorAccentsList: COLOR_ACCENTS
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
