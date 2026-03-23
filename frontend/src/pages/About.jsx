import Navbar from "../components/Navbar";

export default function About() {
  return (
    <div className="min-h-screen bg-base text-slate-100">
      <Navbar />
      <main className="mx-auto max-w-5xl space-y-6 px-4 py-6">
        <section className="card">
          <h1 className="text-3xl font-bold">About PlotForge</h1>
          <p className="mt-2 text-sm uppercase tracking-[0.22em] text-blue-300">
            Forge stories. Build worlds. Create legends.
          </p>
          <p className="mt-3 text-slate-300">
            PlotForge is a collaborative storytelling SaaS platform for creators who want to build rich worlds,
            shape character arcs, and co-create connected story universes through stories, scripts, and fan futures.
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-slate-300">
            <li>Story writing with chapter-based structure</li>
            <li>Script writing with scene-based workflow</li>
            <li>Fan Future posts linked to real movies and TV media</li>
            <li>Real-time collaboration powered by WebSockets</li>
          </ul>
        </section>

        <section className="card">
          <h2 className="text-2xl font-semibold">Contact</h2>
          <div className="mt-3 space-y-2 text-slate-300">
            <p>Email: shreyansh.ssharma@gmail.com</p>
            <p>GitHub: https://github.com/shreySham04</p>
            <p>LinkedIn: https://www.linkedin.com/in/shreyansh-sharma-4a5597323/</p>
          </div>
        </section>
      </main>
    </div>
  );
}
