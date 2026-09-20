import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PlotForgeLogo from "../components/PlotForgeLogo";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070b12] text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
      <Navbar />

      <main className="mx-auto max-w-4xl px-4 py-12 flex-1 space-y-10">
        <header className="space-y-4 text-center">
          <div className="flex justify-center pb-2">
            <PlotForgeLogo variant="emblem" size={160} showTagline={true} animate={true} />
          </div>
          <span className="theme-pill">
            About PlotForge
          </span>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight font-serif">The Engine for Creative Storytelling</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
            PlotForge is built for authors, screenwriters, pop-culture enthusiasts, and collaborative creators.
          </p>
        </header>

        {/* Mission Statement */}
        <section className="card space-y-3">
          <h2 className="text-lg font-bold theme-text">Our Mission</h2>
          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
            We believe that great stories shouldn't exist in isolation. Whether you're crafting an original fantasy novel, formatting a Hollywood-standard screenplay, pitching a marvel theory, or uploading fan-made concept art, PlotForge provides a single, high-performance workspace to bring your world-building to life.
          </p>
        </section>

        {/* Navigation Breakdown */}
        <section className="card space-y-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Platform Navigation Guide</h2>

          <div className="grid gap-3 sm:grid-cols-2 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="font-bold theme-text">Home (/)</span>
              <p className="text-slate-600 dark:text-slate-400">The central hub featuring ecosystem highlights, genre tags, and quick actions.</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="font-bold theme-text">Story (/stories)</span>
              <p className="text-slate-600 dark:text-slate-400">Workspace designed for chapter-based novel writing, outlines, and public story feeds.</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="font-bold theme-text">Script (/scripts)</span>
              <p className="text-slate-600 dark:text-slate-400">Formatted screenplay editor for scene headings, character cues, and action blocks.</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="font-bold theme-text">Fan Future (/fanfuture)</span>
              <p className="text-slate-600 dark:text-slate-400">Discussion forum for fan theories, alternate endings, sequels, and spinoffs.</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="font-bold theme-text">Fanconcept (/fanconcept)</span>
              <p className="text-slate-600 dark:text-slate-400">Visual showcase for uploading fan posters, concept art, trailer links, and community ratings.</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="font-bold theme-text">Review (/reviews)</span>
              <p className="text-slate-600 dark:text-slate-400">Rate and critique movies, TV series, or community narrative releases from 1 to 10 stars.</p>
            </div>
          </div>
        </section>

        {/* Contact Information */}
        <section className="card space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Contact & Support</h2>
          <p className="text-xs text-slate-700 dark:text-slate-300">
            Have questions, feedback, or enterprise team inquiry? Get in touch with our team:
          </p>
          <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1 pt-1">
            <p>📧 Email: <span className="text-teal-600 dark:text-teal-400 font-semibold">support@plotforge.app</span></p>
            <p>🌐 Developer Community: <span className="text-teal-600 dark:text-teal-400 font-semibold">github.com/plotforge</span></p>
            <p>📍 Office: PlotForge Studios Inc, San Francisco, CA</p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
