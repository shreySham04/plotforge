import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { forgotPassword } from "../services/authService";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      await forgotPassword(email);
      setMessage("Password reset instructions have been sent to your email!");
    } catch {
      setMessage("If an account exists with that email, reset instructions have been sent.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#070b12] text-slate-100 flex flex-col">
      <Navbar />

      <main className="mx-auto max-w-md px-4 py-16 flex-1 flex flex-col justify-center space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-black text-white">Forgot Password</h1>
          <p className="text-xs text-slate-400">
            Enter your account email address to receive a password reset link.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
            <input
              type="email"
              className="input text-sm"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {message && <p className="text-xs text-emerald-400">{message}</p>}
          {error && <p className="text-xs text-rose-400">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="btn w-full text-xs py-2.5 font-bold"
          >
            {loading ? "Sending Link..." : "Send Reset Link"}
          </button>

          <p className="text-center text-xs text-slate-400 pt-2">
            Remembered your password?{" "}
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
