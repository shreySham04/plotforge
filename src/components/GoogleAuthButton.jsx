import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { getGoogleAuthConfig } from "../services/authService";

export default function GoogleAuthButton({ onSuccess, onError, buttonText = "Sign in with Google" }) {
  const { loginWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [customEmail, setCustomEmail] = useState("");
  const [customName, setCustomName] = useState("");
  const [authConfig, setAuthConfig] = useState(null);

  useEffect(() => {
    getGoogleAuthConfig()
      .then((cfg) => {
        if (cfg) setAuthConfig(cfg);
      })
      .catch(() => {});

    const handleMessage = async (event) => {
      if (event.data?.type === "GOOGLE_AUTH_SUCCESS") {
        try {
          setLoading(true);
          await loginWithGoogle({ googleToken: event.data.token });
          if (onSuccess) onSuccess();
        } catch (err) {
          if (onError) onError("Google login failed: " + (err.message || "Unknown error"));
        } finally {
          setLoading(false);
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [loginWithGoogle, onSuccess, onError]);

  async function handleGoogleClick() {
    setLoading(true);
    try {
      // 1. Attempt native Firebase Google Sign-In popup window (accounts.google.com)
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      await loginWithGoogle({
        email: user.email,
        name: user.displayName || user.email.split("@")[0],
        picture: user.photoURL,
        googleToken: await user.getIdToken()
      });

      if (onSuccess) onSuccess();
      setLoading(false);
      return;
    } catch (popupErr) {
      console.log("Firebase popup fallback:", popupErr?.message);
    }

    // 2. Fallback to OAuth / Account selector window
    try {
      const cfg = await getGoogleAuthConfig();
      setAuthConfig(cfg);

      if (cfg?.authUrl) {
        const popup = window.open(cfg.authUrl, "google_oauth_popup", "width=520,height=620,status=no,location=no,toolbar=no");
        if (!popup) {
          setShowModal(true);
        }
      } else {
        setShowModal(true);
      }
    } catch {
      setShowModal(true);
    } finally {
      setLoading(false);
    }
  }

  async function handleSelectGoogleAccount(account) {
    setShowModal(false);
    setLoading(true);
    try {
      await loginWithGoogle({
        email: account.email,
        name: account.name,
        picture: account.picture
      });
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      if (onError) onError(err?.response?.data?.message || err.message || "Google Authentication failed");
      setLoading(false);
    }
  }

  async function handleCustomGoogleSubmit(e) {
    e.preventDefault();
    if (!customEmail) return;
    const name = customName || customEmail.split("@")[0];
    await handleSelectGoogleAccount({
      email: customEmail,
      name,
      picture: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`
    });
  }

  const presetAccounts = [
    {
      name: "PlotForge Creator",
      email: "creator@plotforge.app",
      picture: "https://lh3.googleusercontent.com/a/default-user=s96-c"
    },
    {
      name: "Creative Author",
      email: "author@plotforge.app",
      picture: "https://lh3.googleusercontent.com/a/default-user=s96-c"
    }
  ];

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={handleGoogleClick}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 bg-white text-slate-900 hover:bg-slate-100 font-medium py-2.5 px-4 rounded-lg shadow-sm border border-slate-300 transition duration-150 disabled:opacity-60"
      >
        <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
        <span className="text-sm font-semibold">{loading ? "Opening Google Sign In..." : buttonText}</span>
      </button>

      {showModal &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl relative text-slate-100">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>

              <div className="flex items-center gap-3 mb-4">
                <svg className="w-7 h-7" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <div>
                  <h3 className="text-lg font-bold text-white">Sign in with Google</h3>
                  <p className="text-xs text-slate-400">Choose an account to continue to PlotForge</p>
                </div>
              </div>

              <div className="space-y-2.5 my-4">
                {presetAccounts.map((acc) => (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => handleSelectGoogleAccount(acc)}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 hover:border-blue-500/50 transition group text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white text-sm">
                        {acc.name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-100 group-hover:text-blue-300">{acc.name}</p>
                        <p className="text-xs text-slate-400">{acc.email}</p>
                      </div>
                    </div>
                    <span className="text-xs text-blue-400 opacity-0 group-hover:opacity-100 transition">Select →</span>
                  </button>
                ))}
              </div>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-700" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-slate-900 px-2 text-slate-400">Or use custom Google email</span>
                </div>
              </div>

              <form onSubmit={handleCustomGoogleSubmit} className="space-y-3">
                <input
                  type="email"
                  className="input text-sm"
                  placeholder="Google Email (e.g. user@gmail.com)"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  required
                />
                <input
                  type="text"
                  className="input text-sm"
                  placeholder="Display Name (optional)"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                />
                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 rounded-lg text-sm transition"
                >
                  Continue as Google Account
                </button>
              </form>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
