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
          <h2 className="text-2xl font-semibold">Explore the Navbar</h2>
          <p className="mt-2 text-slate-300">
            Each tab focuses on a different part of the creative workflow.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
              <h3 className="text-lg font-semibold text-blue-200">Home</h3>
              <p className="mt-1 text-sm text-slate-300">
                The landing hub with featured updates, calls to action, and quick access to recent work.
              </p>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
              <h3 className="text-lg font-semibold text-blue-200">Story</h3>
              <p className="mt-1 text-sm text-slate-300">
                Draft and organize long-form stories by chapters, arcs, and character beats.
              </p>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
              <h3 className="text-lg font-semibold text-blue-200">Script</h3>
              <p className="mt-1 text-sm text-slate-300">
                Screenplay-style editor for scenes, dialogue timing, and collaborative script reviews.
              </p>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
              <h3 className="text-lg font-semibold text-blue-200">Fan Future</h3>
              <p className="mt-1 text-sm text-slate-300">
                Publish alternate timelines or future spins tied to real films and series.
              </p>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
              <h3 className="text-lg font-semibold text-blue-200">Fanconcept</h3>
              <p className="mt-1 text-sm text-slate-300">
                Brainstorm and pitch high-level concepts, characters, and world ideas for feedback.
              </p>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
              <h3 className="text-lg font-semibold text-blue-200">Review</h3>
              <p className="mt-1 text-sm text-slate-300">
                Collect critiques, ratings, and structured feedback on published work.
              </p>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
              <h3 className="text-lg font-semibold text-blue-200">About</h3>
              <p className="mt-1 text-sm text-slate-300">
                Learn the mission, feature scope, and how the platform supports creators.
              </p>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
              <h3 className="text-lg font-semibold text-blue-200">Profile</h3>
              <p className="mt-1 text-sm text-slate-300">
                Manage your identity, saved drafts, and personal settings across projects.
              </p>
            </div>
          </div>
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
