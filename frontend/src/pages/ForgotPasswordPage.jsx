import { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../services/authService";
import { extractApiError } from "../utils/errors";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await forgotPassword(email.trim());
      setSuccess(response?.message || "If that email exists, a reset link has been sent.");
    } catch (err) {
      setError(extractApiError(err, "Could not process forgot password request"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-4">
      <form className="card w-full" onSubmit={onSubmit}>
        <h1 className="mb-2 text-2xl font-bold text-slate-100">Forgot Password</h1>
        <p className="mb-4 text-sm text-slate-300">
          Enter your email and we will send a password reset link.
        </p>

        <input
          className="input mb-3"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        {error && <p className="mb-3 text-sm text-rose-400">{error}</p>}
        {success && <p className="mb-3 text-sm text-emerald-400">{success}</p>}

        <button className="btn w-full" type="submit" disabled={loading}>
          {loading ? "Sending..." : "Send Reset Link"}
        </button>

        <p className="mt-3 text-sm text-slate-300">
          Back to <Link className="text-blue-400" to="/login">Login</Link>
        </p>
      </form>
    </main>
  );
}
