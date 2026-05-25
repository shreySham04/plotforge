import Navbar from "../components/Navbar";
import Hero from "../components/Hero";

export default function HomePage() {
  const features = [
    {
      title: "Write Stories",
      description: "Create original narratives and build your own worlds.",
      tone: "World-building"
    },
    {
      title: "Script Writing",
      description: "Write structured movie and TV scripts.",
      tone: "Scene-ready"
    },
    {
      title: "Fan Future",
      description: "Expand existing universes with your own theories and sequels.",
      tone: "Canon remix"
    }
  ];

  const genres = ["Sci-Fi", "Drama", "Fantasy", "Thriller", "Romance", "Animation", "Mystery", "Action", "Comedy"];

  return (
    <div className="min-h-screen bg-base text-slate-100">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <Hero />

        <section className="mt-10">
          <div className="mb-4 flex items-end justify-between">
            <h2 className="text-2xl font-bold text-slate-100">Build Your Story Universe</h2>
            <p className="text-sm text-slate-400">Everything in one connected workspace</p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {features.map((feature, index) => (
              <article
                key={feature.title}
                className="card-elevated animate-fade-up rounded-2xl border border-slate-700/70 p-5 transition hover:-translate-y-1 hover:scale-[1.01] hover:border-teal-400/60"
                style={{ animationDelay: `${index * 120}ms` }}
              >
                <p className="text-xs uppercase tracking-[0.25em] text-slate-400">{feature.tone}</p>
                <h3 className="mt-2 text-lg font-semibold text-teal-100">{feature.title}</h3>
                <p className="mt-2 text-sm text-slate-300">{feature.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-10">
          <div className="mb-4 flex items-end justify-between">
            <h2 className="text-2xl font-bold text-slate-100">Browse by genre</h2>
            <p className="text-sm text-slate-400">Find your next obsession</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {genres.map((genre) => (
              <span
                key={genre}
                className="rounded-full border border-slate-700/70 bg-slate-900/70 px-4 py-2 text-xs uppercase tracking-[0.25em] text-slate-200 transition hover:border-teal-400/70 hover:text-teal-200"
              >
                {genre}
              </span>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
