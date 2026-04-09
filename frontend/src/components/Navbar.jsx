import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const tabs = [
    { label: "Home", to: "/" },
    { label: "Story", to: "/stories" },
    { label: "Script", to: "/scripts" },
    { label: "Fan Future", to: "/fanfuture" },
    { label: "Fanconcept", to: "/fanconcept" },
    { label: "Review", to: "/reviews" },
    { label: "About", to: "/about" },
    { label: "Profile", to: "/profile" }
  ];

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <header className="relative border-b border-slate-800 bg-slate-950/95 backdrop-blur">
      <Link
        to="/"
        title="Forge stories. Build worlds. Create legends."
        className="group absolute left-3 top-1/2 z-10 flex -translate-y-1/2 items-start gap-2 md:left-4"
      >
          <span className="mt-0.5 text-xl">⚒️</span>
          <span>
            <span className="block text-lg font-extrabold leading-none text-blue-300">PlotForge</span>
            <span className="hidden text-[11px] leading-tight text-slate-400 md:block">
              Forge stories. Build worlds. Create legends.
            </span>
          </span>
      </Link>

      <div className="mx-auto grid max-w-7xl grid-cols-[1fr_auto] items-center gap-3 px-4 py-3 pl-44 md:pl-56">
        {user && (
          <nav className="flex items-center justify-center gap-2 overflow-x-auto whitespace-nowrap">
            {tabs.map((tab) => (
              <NavLink
                key={tab.to}
                to={tab.to}
                className={({ isActive }) =>
                  `rounded-md px-3 py-1 text-sm transition ${
                    isActive ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-800"
                  }`
                }
              >
                {tab.label}
              </NavLink>
            ))}
          </nav>
        )}
        <div className="flex items-center gap-3 justify-self-end">
          {user ? (
            <>
              <Link to="/dashboard" className="text-sm text-slate-300 hover:text-blue-300">
                {user.username}
              </Link>
              <button className="btn" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <Link to="/login" className="btn">Login</Link>
          )}
        </div>
      </div>
    </header>
  );
}
