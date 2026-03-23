import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import FanPostCard from "../components/FanPostCard";
import MovieSearch from "../components/MovieSearch";
import { getFanPosts } from "../services/fanFutureService";
import { extractApiError } from "../utils/errors";

export default function FanFuturePage() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [trending, setTrending] = useState([]);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [filters, setFilters] = useState({ mediaType: "ALL", sort: "RECENT", search: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadPosts(activeFilters = filters) {
    setLoading(true);
    setError("");
    try {
      const params = {
        sort: activeFilters.sort,
        search: activeFilters.search || undefined,
        mediaType: activeFilters.mediaType === "ALL" ? undefined : activeFilters.mediaType
      };
      const [allData, trendingData] = await Promise.all([
        getFanPosts(params),
        getFanPosts({ sort: "TRENDING", limit: 5 })
      ]);
      setPosts(allData || []);
      setTrending(trendingData || []);
    } catch (err) {
      setError(extractApiError(err, "Could not load fan theories"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPosts();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function onApplyFilters(e) {
    e.preventDefault();
    loadPosts(filters);
  }

  return (
    <div className="min-h-screen bg-base text-slate-100">
      <Navbar />
      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[1fr_320px]">
        <section className="space-y-6">
          <div className="rounded-2xl border border-blue-500/30 bg-gradient-to-r from-slate-900 via-slate-900 to-blue-950/50 p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-blue-300">Fan Future</p>
            <h1 className="mt-2 text-3xl font-bold">Write Alternate Endings, Sequels, And Future Seasons</h1>
            <p className="mt-2 max-w-2xl text-slate-300">
              Pick any movie or TV show, then imagine what happens next. Publish fan-made theories in a Reddit-meets-Medium flow.
            </p>
            <button
              className="btn mt-4"
              onClick={() => navigate("/fanfuture/create", { state: { selectedMedia } })}
            >
              Create Fan Future Post
            </button>
          </div>

          <MovieSearch selectedMedia={selectedMedia} onSelect={setSelectedMedia} />

          <section className="card">
            <form className="grid gap-3 md:grid-cols-[1fr_160px_160px_auto]" onSubmit={onApplyFilters}>
              <input
                className="input"
                placeholder="Search fan theories by title or show"
                value={filters.search}
                onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
              />
              <select
                className="input"
                value={filters.mediaType}
                onChange={(e) => setFilters((f) => ({ ...f, mediaType: e.target.value }))}
              >
                <option value="ALL">All Types</option>
                <option value="MOVIE">Movie</option>
                <option value="TV">TV</option>
              </select>
              <select
                className="input"
                value={filters.sort}
                onChange={(e) => setFilters((f) => ({ ...f, sort: e.target.value }))}
              >
                <option value="RECENT">Recent</option>
                <option value="TRENDING">Trending</option>
                <option value="MOST_LIKED">Most Liked</option>
              </select>
              <button className="btn" type="submit">Apply</button>
            </form>

            {error && <p className="mt-2 text-sm text-rose-400">{error}</p>}

            <div className="mt-4 space-y-3">
              {loading && <div className="rounded-lg bg-slate-800/70 p-3 text-sm text-slate-300">Loading posts...</div>}
              {!loading && posts.length === 0 && (
                <div className="rounded-lg bg-slate-800/70 p-3 text-sm text-slate-300">No fan theories found for this filter.</div>
              )}
              {posts.map((post) => <FanPostCard key={post.id} post={post} />)}
            </div>
          </section>
        </section>

        <aside className="card h-fit">
          <h3 className="text-lg font-semibold">Trending Fan Theories</h3>
          <div className="mt-3 space-y-3">
            {trending.map((post) => (
              <button
                key={post.id}
                type="button"
                className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2 text-left hover:border-blue-500/60"
                onClick={() => navigate(`/fanfuture/${post.id}`)}
              >
                <p className="line-clamp-1 text-sm font-semibold text-slate-100">{post.title}</p>
                <p className="line-clamp-1 text-xs text-slate-400">{post.mediaTitle}</p>
              </button>
            ))}
          </div>
        </aside>
      </main>
    </div>
  );
}
