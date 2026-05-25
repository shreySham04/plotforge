import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { extractApiError } from "../utils/errors";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, token } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const totalSlides = 9;
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (token) {
      navigate("/dashboard", { replace: true });
    }
  }, [token, navigate]);

  async function onSubmit(e) {
    e.preventDefault();
    if (loading) return;

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await login(form);
      if (isMountedRef.current) {
        setSuccess("Login successful. Redirecting...");
      }
      navigate("/dashboard", { replace: true });
    } catch (err) {
      const backendMessage = err?.response?.data?.message;
      if (isMountedRef.current) {
        setError(backendMessage || extractApiError(err, "Login failed"));
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }

  function handleSlideAdvance(event) {
    if (event?.target?.closest(".login-panel")) return;
    setActiveSlide((prev) => (prev + 1) % totalSlides);
  }

  return (
    <main className="login-shell" onClick={handleSlideAdvance}>
      <div
        className="genre-slideshow"
        role="button"
        tabIndex={0}
        aria-label="Tap to change genre background"
        onClick={handleSlideAdvance}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setActiveSlide((prev) => (prev + 1) % totalSlides);
          }
        }}
      >
        <div className={`genre-slide genre-slide--fantasy ${activeSlide === 0 ? "is-active" : ""}`}>
          <span className="genre-slide__label">Fantasy</span>
          <div className="genre-slide__quotes">
            <p className="genre-slide__quote genre-rotating-line">"When winter comes, we stand together."</p>
            <p className="genre-slide__quote genre-rotating-line">"The crown is heavy, and the throne cuts deep."</p>
            <p className="genre-slide__quote genre-rotating-line">"Honor holds the line when storms arrive."</p>
          </div>
          <span className="genre-slide__character">Game of Thrones (paraphrases)</span>
        </div>
        <div className={`genre-slide genre-slide--noir ${activeSlide === 1 ? "is-active" : ""}`}>
          <span className="genre-slide__label">Noir</span>
          <p className="genre-slide__quote">"Forget it, Jake. It's Chinatown."</p>
          <span className="genre-slide__character">Jake Gittes · Chinatown</span>
        </div>
        <div className={`genre-slide genre-slide--scifi ${activeSlide === 2 ? "is-active" : ""}`}>
          <span className="genre-slide__label">Sci-Fi</span>
          <p className="genre-slide__quote">"I've seen things you people wouldn't believe."</p>
          <span className="genre-slide__character">Roy Batty · Blade Runner</span>
        </div>
        <div className={`genre-slide genre-slide--romance ${activeSlide === 3 ? "is-active" : ""}`}>
          <span className="genre-slide__label">Romance</span>
          <div className="genre-slide__quotes">
            <p className="genre-slide__quote genre-rotating-line">"We keep choosing each other, again and again." — The Notebook (paraphrase)</p>
            <p className="genre-slide__quote genre-rotating-line">"Promise me you'll never let go." — Titanic (paraphrase)</p>
            <p className="genre-slide__quote genre-rotating-line">"Even with the music gone, I'd choose you." — La La Land (paraphrase)</p>
          </div>
          <span className="genre-slide__character">Romance (paraphrases)</span>
        </div>
        <div className={`genre-slide genre-slide--horror ${activeSlide === 4 ? "is-active" : ""}`}>
          <span className="genre-slide__label">Horror</span>
          <p className="genre-slide__quote">"Keep your light close. The house remembers."</p>
          <span className="genre-slide__character">Evelyn Hart · The Hollow Manor</span>
        </div>
        <div className={`genre-slide genre-slide--adventure ${activeSlide === 5 ? "is-active" : ""}`}>
          <span className="genre-slide__label">Adventure</span>
          <p className="genre-slide__quote">"Maps lie. The horizon never does."</p>
          <span className="genre-slide__character">Captain Rook · The Brass Compass</span>
        </div>
        <div className={`genre-slide genre-slide--crime ${activeSlide === 6 ? "is-active" : ""}`}>
          <span className="genre-slide__label">Crime</span>
          <p className="genre-slide__quote">"Tread carefully. The empire you build answers back."</p>
          <span className="genre-slide__character">Heisenberg · Breaking Bad (paraphrase)</span>
        </div>
        <div className={`genre-slide genre-slide--thriller ${activeSlide === 7 ? "is-active" : ""}`}>
          <span className="genre-slide__label">Thriller</span>
          <p className="genre-slide__quote">"The closer the truth gets, the darker the room becomes."</p>
          <span className="genre-slide__character">Seven (paraphrase)</span>
        </div>
        <div className={`genre-slide genre-slide--action ${activeSlide === 8 ? "is-active" : ""}`}>
          <span className="genre-slide__label">Action</span>
          <div className="genre-slide__quotes">
            <p className="genre-slide__quote genre-rotating-line">"Family is the fuel when the road gets wild."</p>
            <p className="genre-slide__quote genre-rotating-line">"The mission changes. The will does not."</p>
            <p className="genre-slide__quote genre-rotating-line">"You can take the car, but not the drive."</p>
          </div>
          <span className="genre-slide__character">Fast & Furious / Mission: Impossible (paraphrases)</span>
        </div>
      </div>
      <div className="login-frame">
        <section className="login-art" aria-hidden="true">
          <div className="login-orbit" />
          <div className="login-orbit login-orbit--small" />
          <div className="login-copy">
            <span className="login-badge">PlotForge Studio</span>
            <h1 className="login-title hero-title">Welcome Back</h1>
            <p className="login-subtitle">
              Enter your creative workspace and keep every story thread connected.
            </p>
            <div className="login-grid">
              <div>
                <p className="login-pill">Story Rooms</p>
                <p className="login-meta">Chapter planning + arcs</p>
              </div>
              <div>
                <p className="login-pill">Script Suite</p>
                <p className="login-meta">Scene timing + dialogue</p>
              </div>
              <div>
                <p className="login-pill">Fan Future</p>
                <p className="login-meta">Alternate timelines</p>
              </div>
              <div>
                <p className="login-pill">Live Sync</p>
                <p className="login-meta">Realtime collab</p>
              </div>
            </div>
          </div>
        </section>

        <section className="login-panel card-elevated">
          <form className="space-y-3" onSubmit={onSubmit}>
            <div>
              <h2 className="text-2xl font-bold text-slate-100">Sign in</h2>
              <p className="text-sm text-slate-400">
                Use your PlotForge ID to continue building.
              </p>
            </div>
            <input className="input" type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            <div className="relative">
              <input
                className="input pr-16"
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs uppercase tracking-[0.2em] text-slate-400 hover:text-blue-200"
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            <div className="text-right text-sm">
              <Link className="text-blue-400" to="/forgot-password">Forgot password?</Link>
            </div>
            {error && <p className="text-sm text-rose-400">{error}</p>}
            {success && <p className="text-sm text-emerald-400">{success}</p>}
            <button className="btn w-full" type="submit" disabled={loading}>
              {loading ? "Signing in..." : "Login"}
            </button>
            <p className="text-sm text-slate-300">
              No account? <Link className="text-blue-400" to="/register">Register</Link>
            </p>
          </form>
        </section>
      </div>
    </main>
  );
}
