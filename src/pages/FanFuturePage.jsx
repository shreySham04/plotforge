import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import FanEditor from "../components/FanEditor";
import FanPostCard from "../components/FanPostCard";
import AuthModal from "../components/AuthModal";
import { useAuth } from "../context/AuthContext";
import {
  getFanFuturePosts,
  getTrendingFanFuturePosts,
  createFanFuturePost,
  deleteFanFuturePost
} from "../services/fanFutureService";
import { safeArray } from "../utils/data";

export default function FanFuturePage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [trending, setTrending] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  async function loadData() {
    setLoading(true);
    try {
      const data = await getFanFuturePosts(0, 20, search);
      setPosts(safeArray(data));

      const trendData = await getTrendingFanFuturePosts();
      setTrending(safeArray(trendData));
    } catch {
      setPosts([]);
      setTrending([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [search]);

  async function handlePublish(postData) {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    setPublishing(true);
    try {
      const created = await createFanFuturePost(postData);
      setPosts((prev) => [created, ...safeArray(prev)]);
      setShowEditor(false);
    } catch {
      // Local fallback insert
      const newP = {
        id: `ff-${Date.now()}`,
        ...postData,
        author: "You",
        likes: 0,
        likesCount: 0,
        comments: []
      };
      setPosts((prev) => [newP, ...safeArray(prev)]);
      setShowEditor(false);
    } finally {
      setPublishing(false);
    }
  }

  const safePostsList = safeArray(posts);
  const safeTrendingList = safeArray(trending);

  async function handleDeletePost(id) {
    try {
      await deleteFanFuturePost(id);
      setPosts((prev) => prev.filter((p) => p.id !== id));
      setTrending((prev) => prev.filter((p) => p.id !== id));
    } catch {
      setPosts((prev) => prev.filter((p) => p.id !== id));
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070b12] text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 py-8 flex-1 space-y-8">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <div className="theme-pill">
              <span>🔮</span> Fan Future Hub
            </div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Alternate Endings &amp; Fan Theories</h1>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Explore media predictions, pitch alternate character fates, and debate fan theories.
            </p>
          </div>

          <button
            onClick={() => {
              if (!user) {
                setAuthModalOpen(true);
              } else {
                setShowEditor((v) => !v);
              }
            }}
            className="btn text-xs py-2.5 px-5 font-bold self-start md:self-auto cursor-pointer"
          >
            {showEditor ? "Close Editor" : "+ Pitch Fan Theory"}
          </button>
        </header>

        {/* Guest Banner if not logged in */}
        {!user && (
          <div className="rounded-2xl theme-bg-subtle p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-800 dark:text-slate-200">
            <div className="flex items-center gap-2.5">
              <span className="text-lg">🔮</span>
              <div>
                <p className="font-bold text-slate-900 dark:text-white text-sm">Guest Preview Mode</p>
                <p className="text-slate-600 dark:text-slate-300/80">You can browse community fan theories. Sign up or log in to post your own alternate endings and pitch theories!</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link to="/login" className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-1.5 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                Log In
              </Link>
              <Link to="/register" className="btn text-xs py-1.5 px-3.5">
                Sign Up
              </Link>
            </div>
          </div>
        )}

        {showEditor && <FanEditor onSubmit={handlePublish} loading={publishing} />}

        {/* Search Control */}
        <div className="flex items-center gap-3">
          <input
            type="text"
            className="input text-xs"
            placeholder="Search theories by movie, character, or topic..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Content Layout with Trending Sidebar */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Feed */}
          <section className="lg:col-span-2 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Community Theories</h2>
            {loading && <p className="text-xs text-slate-400">Loading theories...</p>}
            {safePostsList.map((post) => (
              <FanPostCard key={post.id} post={post} onDelete={handleDeletePost} />
            ))}
          </section>

          {/* Trending Sidebar */}
          <aside className="space-y-4">
            <div className="card space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                🔥 Trending Theories
              </h3>
              <div className="space-y-3 divide-y divide-slate-800/80">
                {safeTrendingList.slice(0, 4).map((t, i) => (
                  <div key={t.id || i} className="pt-2 first:pt-0 space-y-1">
                    <p className="text-xs font-bold text-slate-200 hover:text-purple-300 transition cursor-pointer">
                      {t.title}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {t.mediaTitle} • {t.likesCount ?? t.likes ?? 0} Likes
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </main>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        title="Sign In Required to Pitch Theories"
        description="You are browsing PlotForge as a guest. Please sign up or log in to pitch fan theories and alternate movie endings."
      />

      <Footer />
    </div>
  );
}
