import { Link } from "react-router-dom";

export default function Hero() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-blue-500/30 bg-slate-950 px-6 py-16 text-center shadow-[0_0_80px_rgba(37,99,235,0.15)] md:px-12 md:py-24">
      <div className="pointer-events-none absolute -top-24 left-1/2 h-60 w-60 -translate-x-1/2 rounded-full bg-blue-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 right-8 h-52 w-52 rounded-full bg-cyan-500/20 blur-3xl" />

      <div className="relative animate-fade-up">
        <p className="mb-4 text-xs uppercase tracking-[0.3em] text-blue-300">Creative Collaboration Platform</p>
        <h1 className="text-5xl font-extrabold tracking-tight md:text-7xl">
          <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-500 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(59,130,246,0.45)]">
            PlotForge
          </span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-200 md:text-xl">
          Forge stories. Build worlds. Create legends.
        </p>
        <p className="mx-auto mt-4 max-w-3xl text-sm text-slate-300 md:text-base">
          A collaborative platform to write stories, scripts, and fan theories while building connected story universes.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/stories"
            className="rounded-xl bg-blue-600 px-5 py-2.5 font-semibold text-white transition hover:scale-105 hover:bg-blue-500"
          >
            Start Writing
          </Link>
          <Link
            to="/stories"
            className="rounded-xl border border-slate-600 bg-slate-900/90 px-5 py-2.5 font-semibold text-slate-100 transition hover:scale-105 hover:border-blue-400 hover:text-blue-200"
          >
            Explore Stories
          </Link>
        </div>
      </div>
    </section>
  );
}
