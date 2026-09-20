import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { extractApiError } from "../utils/errors";
import GoogleAuthButton from "../components/GoogleAuthButton";
import Navbar from "../components/Navbar";
import AuthMovieBackdrop from "../components/AuthMovieBackdrop";
import PlotForgeLogo from "../components/PlotForgeLogo";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, token } = useAuth();
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [fieldErrors, setFieldErrors] = useState({});
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

    const nextErrors = validateForm(form);
    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await register(form);
      if (isMountedRef.current) {
        setSuccess("Registration successful. Redirecting...");
      }
      navigate("/dashboard", { replace: true });
    } catch (err) {
      const backendMessage = err?.response?.data?.message;
      if (isMountedRef.current) {
        setError(backendMessage || extractApiError(err, "Registration failed"));
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }

  function validateForm(values) {
    const nextErrors = {};
    const username = values.username.trim();
    const email = values.email.trim();
    const password = values.password;

    if (username.length < 3) {
      nextErrors.username = "Username must be at least 3 characters.";
    } else if (username.length > 50) {
      nextErrors.username = "Username must be 50 characters or less.";
    }

    if (!email) {
      nextErrors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (!password) {
      nextErrors.password = "Password is required.";
    } else if (password.length < 6) {
      nextErrors.password = "Password must be at least 6 characters.";
    } else if (password.length > 100) {
      nextErrors.password = "Password must be 100 characters or less.";
    }

    return nextErrors;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />
      <AuthMovieBackdrop activeSlide={activeSlide} setActiveSlide={setActiveSlide}>
        <form className="space-y-3" onSubmit={onSubmit}>
          <div className="flex flex-col items-center text-center pb-2">
            <PlotForgeLogo variant="emblem" size={64} showTagline={false} animate={true} />
            <h2 className="text-2xl font-bold text-slate-100 mt-2 font-serif">Create your Account</h2>
            <p className="text-xs text-slate-400">
              Join the PlotForge storytelling universe.
            </p>
          </div>
          <input
            className="input"
            placeholder="Username"
            value={form.username}
            onChange={(e) => {
              setForm({ ...form, username: e.target.value });
              if (fieldErrors.username) {
                setFieldErrors({ ...fieldErrors, username: "" });
              }
            }}
            onBlur={() => {
              const nextErrors = validateForm(form);
              if (nextErrors.username !== fieldErrors.username) {
                setFieldErrors({ ...fieldErrors, username: nextErrors.username || "" });
              }
            }}
            required
          />
          {fieldErrors.username ? <p className="text-sm text-amber-300">{fieldErrors.username}</p> : null}
          <input
            className="input"
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => {
              setForm({ ...form, email: e.target.value });
              if (fieldErrors.email) {
                setFieldErrors({ ...fieldErrors, email: "" });
              }
            }}
            onBlur={() => {
              const nextErrors = validateForm(form);
              if (nextErrors.email !== fieldErrors.email) {
                setFieldErrors({ ...fieldErrors, email: nextErrors.email || "" });
              }
            }}
            required
          />
          {fieldErrors.email ? <p className="text-sm text-amber-300">{fieldErrors.email}</p> : null}
          <div className="relative">
            <input
              className="input pr-16"
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={form.password}
              onChange={(e) => {
                setForm({ ...form, password: e.target.value });
                if (fieldErrors.password) {
                  setFieldErrors({ ...fieldErrors, password: "" });
                }
              }}
              onBlur={() => {
                const nextErrors = validateForm(form);
                if (nextErrors.password !== fieldErrors.password) {
                  setFieldErrors({ ...fieldErrors, password: nextErrors.password || "" });
                }
              }}
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
          {fieldErrors.password ? <p className="text-sm text-amber-300">{fieldErrors.password}</p> : null}
          {error && <p className="text-sm text-rose-400">{error}</p>}
          {success && <p className="text-sm text-emerald-400">{success}</p>}
          <button className="btn w-full" type="submit" disabled={loading}>
            {loading ? "Creating account..." : "Register"}
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
          buttonText="Sign up with Google"
          onSuccess={() => {
            if (isMountedRef.current) setSuccess("Google Sign-In successful. Redirecting...");
            navigate("/dashboard", { replace: true });
          }}
          onError={(err) => {
            if (isMountedRef.current) setError(err);
          }}
        />

        <p className="text-sm text-slate-300 mt-4">
          Already registered? <Link className="text-blue-400" to="/login">Login</Link>
        </p>
      </AuthMovieBackdrop>
    </div>
  );
}

