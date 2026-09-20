import { Link } from "react-router-dom";
import PlotForgeLogo from "./PlotForgeLogo";

export default function Hero() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800/80 bg-gradient-to-b from-white via-slate-50 to-slate-100 dark:from-slate-900/90 dark:via-slate-900/60 dark:to-slate-950 p-8 sm:p-12 md:p-14 text-center shadow-md dark:shadow-2xl backdrop-blur-xl transition-colors">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-amber-500/10 via-teal-500/5 to-transparent pointer-events-none" />
      
      <div className="relative z-10 mx-auto max-w-3xl space-y-6">
        {/* Animated Brand Emblem */}
        <div className="flex justify-center pb-2">
          <PlotForgeLogo variant="emblem" size={130} showTagline={false} animate={true} />
        </div>

        <span className="theme-pill">
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: "var(--theme-primary)" }} />
          The Collaborative Storytelling Ecosystem
        </span>

        <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white sm:text-5xl md:text-6xl leading-tight font-serif">
          Forge Stories. Build Worlds. <br />
          <span className="theme-text font-sans">
            Create Legends.
          </span>
        </h1>

        <p className="text-base text-slate-600 dark:text-slate-300 sm:text-lg max-w-2xl mx-auto leading-relaxed">
          PlotForge brings writers, creators, screenwriters, and fans together. Write long-form stories, draft screenplays, publish alternate movie endings, share visual fan concepts, and review media in real time.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Link
            to="/stories"
            className="btn text-sm font-bold py-3 px-6"
          >
            Start Writing Stories
          </Link>
          <Link
            to="/scripts"
            className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/80 px-6 py-3 text-sm font-bold text-slate-800 dark:text-slate-100 hover:border-slate-400 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95 transition"
          >
            Draft Screenplays
          </Link>
          <Link
            to="/fanfuture"
            className="rounded-xl border border-[var(--theme-ring)] bg-[var(--theme-glow)] px-6 py-3 text-sm font-bold theme-text hover:opacity-90 active:scale-95 transition"
          >
            Explore Fan Theories
          </Link>
        </div>

        {/* Featured Genre Tags */}
        <div className="pt-8 flex flex-wrap justify-center items-center gap-2 text-xs">
          <span className="text-slate-500 dark:text-slate-400 font-semibold mr-2">Popular Genres:</span>
          {["Fantasy", "Sci-Fi", "Mystery", "Thriller", "Romance", "Horror", "Action"].map((genre) => (
            <Link
              key={genre}
              to={`/stories?genre=${genre}`}
              className="rounded-full bg-slate-100 dark:bg-slate-800/80 px-3 py-1 text-slate-700 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-300 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/50 transition"
            >
              #{genre}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
