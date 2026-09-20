import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { extractApiError } from "../utils/errors";
import GoogleAuthButton from "../components/GoogleAuthButton";
import Navbar from "../components/Navbar";
import AuthMovieBackdrop from "../components/AuthMovieBackdrop";
import PlotForgeLogo from "../components/PlotForgeLogo";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, token } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />
      <AuthMovieBackdrop activeSlide={activeSlide} setActiveSlide={setActiveSlide}>
        <form className="space-y-3" onSubmit={onSubmit}>
          <div className="flex flex-col items-center text-center pb-2">
            <PlotForgeLogo variant="emblem" size={64} showTagline={false} animate={true} />
            <h2 className="text-2xl font-bold text-slate-100 mt-2 font-serif">Sign in to PlotForge</h2>
            <p className="text-xs text-slate-400">
              Forge stories. Build worlds. Create legends.
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
        </form>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-700/60" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-slate-950/60 backdrop-blur-md px-2 text-slate-400">Or continue with</span>
          </div>
        </div>

        <GoogleAuthButton
          buttonText="Sign in with Google"
          onSuccess={() => {
            if (isMountedRef.current) setSuccess("Google Sign-In successful. Redirecting...");
            navigate("/dashboard", { replace: true });
          }}
          onError={(err) => {
            if (isMountedRef.current) setError(err);
          }}
        />

        <p className="text-sm text-slate-300 mt-4">
          No account? <Link className="text-blue-400" to="/register">Register</Link>
        </p>
      </AuthMovieBackdrop>
    </div>
  );
}

