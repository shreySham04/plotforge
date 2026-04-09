import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { resetPassword } from "../services/authService";
import { extractApiError } from "../utils/errors";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = useMemo(() => (searchParams.get("token") || "").trim(), [searchParams]);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    if (loading) return;

    if (!token) {
      setError("Reset token is missing. Please use the link from your email.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await resetPassword({ token, newPassword: password });
      setSuccess(response?.message || "Password reset successful. Redirecting to login...");
      window.setTimeout(() => {
        navigate("/login", { replace: true });
      }, 1200);
    } catch (err) {
      setError(extractApiError(err, "Could not reset password"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-4">
      <form className="card w-full" onSubmit={onSubmit}>
        <h1 className="mb-2 text-2xl font-bold text-slate-100">Reset Password</h1>
        <p className="mb-4 text-sm text-slate-300">Set a new password for your account.</p>

        <input
          className="input mb-3"
          type="password"
          placeholder="New password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <input
          className="input mb-3"
          type="password"
          placeholder="Confirm new password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />

        {error && <p className="mb-3 text-sm text-rose-400">{error}</p>}
        {success && <p className="mb-3 text-sm text-emerald-400">{success}</p>}

        <button className="btn w-full" type="submit" disabled={loading}>
          {loading ? "Resetting..." : "Reset Password"}
        </button>

        <p className="mt-3 text-sm text-slate-300">
          Back to <Link className="text-blue-400" to="/login">Login</Link>
        </p>
      </form>
    </main>
  );
}
