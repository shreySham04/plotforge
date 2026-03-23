import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-slate-950/95">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-lg font-bold text-blue-300">PlotForge</p>
          <p className="text-sm text-slate-400">Forge stories. Build worlds. Create legends.</p>
        </div>

        <nav className="flex items-center gap-4 text-sm text-slate-300">
          <Link to="/about" className="transition hover:text-blue-300">About</Link>
          <Link to="/about" className="transition hover:text-blue-300">Contact</Link>
        </nav>

        <p className="text-xs text-slate-500">© {new Date().getFullYear()} PlotForge. All rights reserved.</p>
      </div>
    </footer>
  );
}
