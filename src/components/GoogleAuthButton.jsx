import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { getGoogleAuthConfig } from "../services/authService";
import { ExternalLink, ShieldAlert } from "lucide-react";

const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  "472663517785-h2qpvdok8f6ir0pnpjk85qj3s946m00s.apps.googleusercontent.com";

export default function GoogleAuthButton({ onSuccess, onError, buttonText = "Sign in with Google" }) {
  const { loginWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showBlockedModal, setShowBlockedModal] = useState(false);
  const [authConfig, setAuthConfig] = useState(null);
  const tokenClientRef = useRef(null);

  useEffect(() => {
    getGoogleAuthConfig()
      .then((cfg) => {
        if (cfg) setAuthConfig(cfg);
      })
      .catch(() => {});

    // Listen for redirect popup callback
    const handleMessage = async (event) => {
      if (event.data?.type === "GOOGLE_AUTH_SUCCESS" && event.data?.token) {
        try {
          setLoading(true);
          setShowBlockedModal(false);
          await loginWithGoogle({ googleToken: event.data.token });
          if (onSuccess) onSuccess();
        } catch (err) {
          if (onError) onError("Google authentication failed: " + (err.response?.data?.message || err.message || "Invalid credentials"));
        } finally {
          setLoading(false);
        }
      }
    };

    window.addEventListener("message", handleMessage);

    // Initialize Google Identity Services (GSI) Token Client if script is ready
    function initGsiClient() {
      if (window.google?.accounts?.oauth2 && !tokenClientRef.current) {
        try {
          tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
            client_id: GOOGLE_CLIENT_ID,
            scope: "openid email profile",
            prompt: "select_account",
            callback: async (resp) => {
              if (resp.error) {
                console.warn("GSI auth error:", resp.error);
                if (resp.error !== "popup_closed_by_user" && onError) {
                  onError("Google sign-in was cancelled or encountered an error.");
                }
                setLoading(false);
                return;
              }
              if (resp.access_token) {
                try {
                  setLoading(true);
                  await loginWithGoogle({ googleToken: resp.access_token });
                  if (onSuccess) onSuccess();
                } catch (err) {
                  if (onError) onError(err?.response?.data?.message || err.message || "Google authentication failed");
                } finally {
                  setLoading(false);
                }
              }
            }
          });
        } catch (e) {
          console.warn("GSI client initialization warning:", e?.message);
        }
      }
    }

    initGsiClient();
    const interval = setInterval(initGsiClient, 800);
    const timer = setTimeout(() => clearInterval(interval), 5000);

    return () => {
      window.removeEventListener("message", handleMessage);
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [loginWithGoogle, onSuccess, onError]);

  async function handleGoogleClick() {
    setLoading(true);

    // 1. Preferred: Google Identity Services (GSI) Token Client with account chooser
    if (window.google?.accounts?.oauth2 && tokenClientRef.current) {
      try {
        tokenClientRef.current.requestAccessToken({ prompt: "select_account" });
        // The tokenClient callback will handle completion or cancellation
        return;
      } catch (gsiErr) {
        console.warn("GSI requestAccessToken note:", gsiErr?.message);
      }
    }

    // 2. Native Firebase Google Sign-In popup with prompt: 'select_account'
    if (auth) {
      try {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;
        const idToken = await user.getIdToken();

        await loginWithGoogle({
          email: user.email,
          name: user.displayName || user.email?.split("@")[0],
          picture: user.photoURL,
          googleToken: idToken
        });

        if (onSuccess) onSuccess();
        setLoading(false);
        return;
      } catch (popupErr) {
        console.warn("Firebase popup sign-in note:", popupErr?.message);
      }
    }

    // 3. Fallback: Direct OAuth popup window to accounts.google.com
    try {
      let cfg = authConfig;
      if (!cfg) {
        cfg = await getGoogleAuthConfig();
        setAuthConfig(cfg);
      }

      if (cfg?.authUrl) {
        const popup = window.open(
          cfg.authUrl,
          "google_oauth_popup",
          "width=520,height=640,status=no,location=no,toolbar=no"
        );

        if (!popup || popup.closed || typeof popup.closed === "undefined") {
          setShowBlockedModal(true);
        }
      } else {
        setShowBlockedModal(true);
      }
    } catch {
      setShowBlockedModal(true);
    } finally {
      setLoading(false);
    }
  }

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
        <span className="text-sm font-semibold">{loading ? "Connecting to Google..." : buttonText}</span>
      </button>

      {showBlockedModal &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl relative text-slate-100">
              <button
                type="button"
                onClick={() => setShowBlockedModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Google Sign-In</h3>
                  <p className="text-xs text-slate-400">Popup window was blocked by your browser</p>
                </div>
              </div>

              <p className="text-sm text-slate-300 leading-relaxed mb-5">
                Because the app runs inside an embedded preview iframe, your browser may block the authentication window. You can open the authentication page directly or open the application in a new tab:
              </p>

              <div className="space-y-3">
                {authConfig?.authUrl && (
                  <a
                    href={authConfig.authUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setShowBlockedModal(false)}
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 px-4 rounded-xl text-sm transition shadow-lg shadow-blue-600/20"
                  >
                    <span>Authorize with Google in New Window</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}

                <button
                  type="button"
                  onClick={() => window.open(window.location.href, "_blank")}
                  className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium py-2.5 px-4 rounded-xl text-sm transition"
                >
                  <span>Open App in Full Tab</span>
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

