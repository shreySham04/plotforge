import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { extractApiError } from "../utils/errors";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, token } = useAuth();
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      navigate("/dashboard", { replace: true });
    }
  }, [token, navigate]);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      await register(form);
      setSuccess("Registration successful. Redirecting...");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(extractApiError(err, "Registration failed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-4">
      <form className="card w-full" onSubmit={onSubmit}>
        <h1 className="mb-4 text-2xl font-bold text-slate-100">Register</h1>
        <input className="input mb-3" placeholder="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
        <input className="input mb-3" type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        <input className="input mb-3" type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        {error && <p className="mb-3 text-sm text-rose-400">{error}</p>}
        {success && <p className="mb-3 text-sm text-emerald-400">{success}</p>}
        <button className="btn w-full" type="submit" disabled={loading}>
          {loading ? "Creating account..." : "Create Account"}
        </button>
        <p className="mt-3 text-sm text-slate-300">
          Already registered? <Link className="text-blue-400" to="/login">Login</Link>
        </p>
      </form>
    </main>
  );
}
