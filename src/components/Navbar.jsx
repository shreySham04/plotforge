import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import PlotForgeLogo from "./PlotForgeLogo";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme, currentMovieTheme } = useTheme();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { label: "Home", path: "/home" },
    { label: "Story", path: "/stories" },
    { label: "Script", path: "/scripts" },
    { label: "Fan Future", path: "/fanfuture" },
    { label: "Fanconcept", path: "/fanconcept" },
    { label: "Review", path: "/reviews" },
    { label: "About", path: "/about" },
    { label: "Profile", path: "/profile" },
  ];

  const isDark = theme === "dark";
  const primaryColor = currentMovieTheme?.primary || "var(--theme-primary)";

  return (
    <header className={`relative z-30 w-full border-b backdrop-blur-md transition-colors duration-300 ${
      isDark
        ? "border-slate-800/80 bg-slate-950/95 text-slate-100"
        : "border-slate-200 bg-white/95 text-slate-900 shadow-sm"
    }`}>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        {/* Brand logo & tagline */}
        <Link to="/" className="flex items-center group transition active:scale-95">
          <PlotForgeLogo size="sm" variant="full" animate={true} />
        </Link>

        {/* Center navigation links */}
        <nav className="hidden xl:flex items-center gap-2 text-xs font-semibold">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.label}
                to={item.path}
                className={`transition-all px-2.5 py-1.5 rounded-lg ${
                  isActive
                    ? "font-bold shadow-sm"
                    : isDark
                      ? "text-slate-300 hover:bg-slate-900"
                      : "text-slate-600 hover:bg-slate-100"
                }`}
                style={
                  isActive
                    ? {
                        color: primaryColor,
                        backgroundColor: `${primaryColor}18`,
                        border: `1px solid ${primaryColor}40`
                      }
                    : undefined
                }
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User profile, Theme Toggle & actions */}
        <div className="flex items-center gap-2.5">
          {/* Light / Dark Mode Switcher */}
          <button
            onClick={toggleTheme}
            className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-semibold transition active:scale-95 ${
              isDark
                ? "border-slate-800 bg-slate-900 text-amber-300 hover:border-slate-700 hover:bg-slate-800"
                : "border-slate-200 bg-slate-100 text-slate-700 hover:border-slate-300 hover:bg-slate-200"
            }`}
            title={`Switch to ${isDark ? "Light" : "Dark"} Mode`}
            aria-label="Toggle dark/light theme"
          >
            {isDark ? (
              <>
                <svg className="h-4 w-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <span className="hidden sm:inline text-[11px]">Light</span>
              </>
            ) : (
              <>
                <svg className="h-4 w-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
                <span className="hidden sm:inline text-[11px]">Dark</span>
              </>
            )}
          </button>

          {user ? (
            <>
              <Link
                to="/profile"
                className={`hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold transition ${
                  isDark ? "text-slate-300 hover:text-teal-300" : "text-slate-700 hover:text-teal-600"
                }`}
              >
                <span>{user.username || user.email}</span>
                {(user.isOwner || user.role === "OWNER") && (
                  <span className="rounded bg-amber-500/20 border border-amber-500/40 px-1.5 py-0.5 text-[10px] font-extrabold text-amber-300 flex items-center gap-0.5">
                    👑 Owner
                  </span>
                )}
              </Link>
              <button
                className="btn text-xs py-1.5 px-3.5"
                onClick={logout}
              >
                Logout
              </button>
            </>
          ) : (
            <div className="flex items-center gap-1.5">
              <Link
                to="/login"
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition ${
                  isDark ? "text-slate-300 hover:text-white hover:bg-slate-900" : "text-slate-700 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                Log In
              </Link>
              <Link
                to="/register"
                className="btn text-xs py-1.5 px-3.5"
              >
                Sign Up
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen((v) => !v)}
            className={`xl:hidden rounded-lg border p-2 ${
              isDark
                ? "border-slate-800 bg-slate-900 text-slate-300 hover:text-white"
                : "border-slate-200 bg-slate-100 text-slate-700 hover:text-slate-900"
            }`}
            aria-label="Toggle mobile menu"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile dropdown navigation */}
      {mobileMenuOpen && (
        <div className={`xl:hidden border-t px-4 py-3 space-y-1.5 ${
          isDark ? "border-slate-800 bg-slate-950" : "border-slate-200 bg-white"
        }`}>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.label}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`block rounded-lg px-3 py-2 text-xs font-semibold transition ${
                  isActive
                    ? "font-bold shadow-sm"
                    : isDark
                      ? "text-slate-300 hover:bg-slate-900 hover:text-white"
                      : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                }`}
                style={
                  isActive
                    ? {
                        color: primaryColor,
                        backgroundColor: `${primaryColor}18`,
                        border: `1px solid ${primaryColor}40`
                      }
                    : undefined
                }
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}

