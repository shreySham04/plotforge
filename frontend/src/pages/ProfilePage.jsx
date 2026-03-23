import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { extractApiError } from "../utils/errors";

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const [form, setForm] = useState({ username: "", email: "" });
  const [theme, setTheme] = useState(localStorage.getItem("writerapp_theme") || "dark");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setForm({
      username: user?.username || "",
      email: user?.email || ""
    });
  }, [user]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("theme-light", "theme-dark");
    root.classList.add(theme === "light" ? "theme-light" : "theme-dark");
    localStorage.setItem("writerapp_theme", theme);
  }, [theme]);

  const hasProfileChanges = useMemo(() => {
    return (form.username || "") !== (user?.username || "") || (form.email || "") !== (user?.email || "");
  }, [form, user]);

  async function onSaveProfile(e) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");
    try {
      await updateProfile({
        username: form.username.trim(),
        email: form.email.trim()
      });
      setMessage("Profile updated successfully.");
    } catch (err) {
      setError(extractApiError(err, "Could not update profile settings"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-base text-slate-100">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <section className="card">
          <h1 className="text-2xl font-bold">Profile Settings</h1>
          <p className="mt-1 text-sm text-slate-400">
            Member since: {user?.createdAt ? new Date(user.createdAt).toLocaleString() : "-"}
          </p>

          <form className="mt-5 space-y-4" onSubmit={onSaveProfile}>
            <div>
              <label className="mb-1 block text-sm text-slate-300">Username</label>
              <input
                className="input"
                value={form.username}
                onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))}
                maxLength={50}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-300">Email</label>
              <input
                className="input"
                type="email"
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                maxLength={100}
                required
              />
            </div>

            {message && <p className="text-sm text-emerald-400">{message}</p>}
            {error && <p className="text-sm text-rose-400">{error}</p>}

            <div className="flex justify-end">
              <button className="btn" type="submit" disabled={!hasProfileChanges || saving}>
                {saving ? "Saving..." : "Save Profile"}
              </button>
            </div>
          </form>
        </section>

        <section className="card mt-6">
          <h2 className="text-xl font-semibold">Appearance Settings</h2>
          <p className="mt-1 text-sm text-slate-400">Choose your preferred website theme.</p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setTheme("dark")}
              className={`rounded-xl border px-4 py-3 text-left transition ${
                theme === "dark"
                  ? "border-blue-500 bg-blue-500/15 text-blue-200"
                  : "border-slate-700 bg-slate-900/70 text-slate-200 hover:border-slate-500"
              }`}
            >
              <p className="font-semibold">Dark Theme</p>
              <p className="mt-1 text-xs text-slate-400">Deep contrast for focused writing sessions.</p>
            </button>
            <button
              type="button"
              onClick={() => setTheme("light")}
              className={`rounded-xl border px-4 py-3 text-left transition ${
                theme === "light"
                  ? "border-blue-500 bg-blue-500/15 text-blue-200"
                  : "border-slate-700 bg-slate-900/70 text-slate-200 hover:border-slate-500"
              }`}
            >
              <p className="font-semibold">Light Theme</p>
              <p className="mt-1 text-xs text-slate-400">A bright workspace for daytime browsing.</p>
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
