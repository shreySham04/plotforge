import { Link } from "react-router-dom";

export default function Hero() {
  return (
    <section className="relative overflow-hidden rounded-[2.5rem] border border-teal-400/30 bg-slate-950 px-6 py-16 shadow-[0_0_80px_rgba(20,184,166,0.18)] md:px-12 md:py-24">
      <div className="pointer-events-none absolute -top-24 left-10 h-64 w-64 rounded-full bg-teal-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 right-8 h-72 w-72 rounded-full bg-indigo-400/20 blur-3xl" />

      <div className="relative grid gap-10 md:grid-cols-[1.1fr_0.9fr] md:items-center">
        <div className="animate-fade-up">
          <p className="mb-4 text-xs uppercase tracking-[0.35em] text-teal-200">Cinema playground</p>
          <h1 className="hero-title text-5xl text-slate-50 md:text-7xl">
            PlotForge
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-slate-200 md:text-xl">
            Forge stories. Build worlds. Create legends.
          </p>
          <p className="mt-4 max-w-2xl text-sm text-slate-300 md:text-base">
            A social creative space for movie lovers to draft scripts, pitch fan futures, and share cinematic universes.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link to="/stories" className="btn rounded-xl px-6 py-3">
              Start Writing
            </Link>
            <Link
              to="/stories"
              className="rounded-xl border border-slate-600 bg-slate-900/90 px-6 py-3 font-semibold text-slate-100 transition hover:scale-105 hover:border-teal-400 hover:text-teal-200"
            >
              Explore Stories
            </Link>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="card-elevated rounded-2xl border border-slate-700/70 p-5">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Featured</p>
            <h2 className="mt-3 text-2xl font-semibold text-slate-100">Weekend prompt</h2>
            <p className="mt-2 text-sm text-slate-300">Write a 60-second scene where the hero must choose between fame and truth.</p>
            <div className="mt-5 flex items-center gap-3 text-xs text-slate-400">
              <span className="rounded-full border border-teal-400/40 px-3 py-1 text-teal-200">Challenge</span>
            </div>
          </div>
          <div className="card-elevated rounded-2xl border border-slate-700/70 px-4 py-4 text-center">
            <p className="text-sm text-slate-300">Live stats will appear here once real data is available.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
