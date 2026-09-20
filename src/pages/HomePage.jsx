import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import Footer from "../components/Footer";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070b12] text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 py-8 flex-1 space-y-12">
        <Hero />

        {/* Core Creative Modes Section */}
        <section className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">Creative Ecosystem Overview</h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
              Everything you need to craft stories, collaborate in real-time, and engage with pop-culture storytelling.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Story Workspace */}
            <div className="card space-y-3 hover:border-teal-500/40 transition">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center font-black text-lg">
                📖
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Story Studio</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Dedicated workspace for long-form creative fiction, chapter planning, character development, and narrative arcs.
              </p>
              <Link to="/stories" className="inline-block text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline">
                Explore Stories →
              </Link>
            </div>

            {/* Script Suite */}
            <div className="card space-y-3 hover:border-blue-500/40 transition">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-black text-lg">
                🎬
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Script Suite</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Format screenplays automatically into standard scene blocks. Perfect for screenwriters, stage plays, and short films.
              </p>
              <Link to="/scripts" className="inline-block text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">
                Draft Screenplay →
              </Link>
            </div>

            {/* Fan Future */}
            <div className="card space-y-3 hover:border-purple-500/40 transition">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center font-black text-lg">
                🚀
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Fan Future</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Community forum for alternate endings, fan theories, sequel predictions, and spinoff concept discussions.
              </p>
              <Link to="/fanfuture" className="inline-block text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline">
                View Fan Theories →
              </Link>
            </div>

            {/* Fan Concept */}
            <div className="card space-y-3 hover:border-amber-500/40 transition">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-black text-lg">
                🎨
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Fan Concept</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Share visual concepts, fan-made posters, trailer links, and character art to get feedback and community ratings.
              </p>
              <Link to="/fanconcept" className="inline-block text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline">
                Showcase Concepts →
              </Link>
            </div>

            {/* Reviews */}
            <div className="card space-y-3 hover:border-rose-500/40 transition">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center font-black text-lg">
                ⭐
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Reviews & Critiques</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Rate movies, series, and community stories on a 1-10 scale. Build your reputation as an astute storytelling reviewer.
              </p>
              <Link to="/reviews" className="inline-block text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline">
                Write Reviews →
              </Link>
            </div>

            {/* Realtime Collaboration */}
            <div className="card space-y-3 hover:border-emerald-500/40 transition">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-black text-lg">
                ⚡
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Live Collaboration</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Invite co-authors, auto-save versions, broadcast live typing indicators, and leave section-level feedback comments.
              </p>
              <Link to="/dashboard" className="inline-block text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline">
                Go to Dashboard →
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
