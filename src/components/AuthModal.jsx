import { useNavigate } from "react-router-dom";

export default function AuthModal({ isOpen, onClose, title = "Authentication Required", description = "To create projects, write screenplays, post fan theories, or submit reviews, please log in or create a free PlotForge account." }) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 text-slate-100 shadow-2xl space-y-5 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
        >
          ✕
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-400 flex items-center justify-center font-bold text-xl shrink-0">
            🔒
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">{title}</h3>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-teal-400">PlotForge Membership</span>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          {description}
        </p>

        <div className="grid gap-2.5 pt-2">
          <button
            onClick={() => {
              onClose();
              navigate("/register");
            }}
            className="w-full rounded-xl bg-teal-500 py-2.5 text-xs font-bold text-slate-950 hover:bg-teal-400 active:scale-95 transition shadow-lg shadow-teal-500/20"
          >
            Create Free Account / Sign Up
          </button>
          
          <button
            onClick={() => {
              onClose();
              navigate("/login");
            }}
            className="w-full rounded-xl border border-slate-700 bg-slate-800 py-2.5 text-xs font-bold text-slate-200 hover:bg-slate-700 hover:text-white active:scale-95 transition"
          >
            Sign In / Log In
          </button>
        </div>

        <div className="text-center">
          <button
            onClick={onClose}
            className="text-[11px] font-medium text-slate-500 hover:text-slate-300 transition"
          >
            Continue as Guest (View Only)
          </button>
        </div>
      </div>
    </div>
  );
}
