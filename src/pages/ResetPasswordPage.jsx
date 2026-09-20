import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { resetPassword } from "../services/authService";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    setMessage("");
    setError("");

    try {
      await resetPassword({ token, password });
      setMessage("Your password has been successfully reset! You can now log in.");
    } catch {
      setError("Invalid or expired token. Please request a new password reset link.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#070b12] text-slate-100 flex flex-col">
      <Navbar />

      <main className="mx-auto max-w-md px-4 py-16 flex-1 flex flex-col justify-center space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-black text-white">Reset Password</h1>
          <p className="text-xs text-slate-400">
            Set a new secure password for your PlotForge account.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">New Password</label>
            <input
              type="password"
              className="input text-sm"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Confirm New Password</label>
            <input
              type="password"
              className="input text-sm"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          {message && <p className="text-xs text-emerald-400 font-semibold">{message}</p>}
          {error && <p className="text-xs text-rose-400 font-semibold">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="btn w-full text-xs py-2.5 font-bold"
          >
            {loading ? "Updating Password..." : "Update Password"}
          </button>

          <p className="text-center text-xs text-slate-400 pt-2">
            <Link to="/login" className="text-teal-400 hover:underline font-bold">
              Return to Login
            </Link>
          </p>
        </form>
      </main>

      <Footer />
    </div>
  );
}
