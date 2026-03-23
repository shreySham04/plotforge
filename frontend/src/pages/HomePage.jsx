import Navbar from "../components/Navbar";
import Hero from "../components/Hero";

export default function HomePage() {
  const features = [
    {
      title: "Write Stories",
      description: "Create original narratives and build your own worlds."
    },
    {
      title: "Script Writing",
      description: "Write structured movie and TV scripts."
    },
    {
      title: "Fan Future",
      description: "Expand existing universes with your own theories and sequels."
    }
  ];

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
                className="animate-fade-up rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-[0_0_40px_rgba(30,64,175,0.12)] transition hover:-translate-y-1 hover:scale-[1.01] hover:border-blue-500/50"
                style={{ animationDelay: `${index * 120}ms` }}
              >
                <h3 className="text-lg font-semibold text-blue-200">{feature.title}</h3>
                <p className="mt-2 text-sm text-slate-300">{feature.description}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
