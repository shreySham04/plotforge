export default function PlotForgeLogo({
  size = "md",
  variant = "full", // "icon" | "full" | "emblem" | "raw"
  className = "",
  showTagline = true,
  animate = false,
}) {
  const logoSrc = "/logo.png";

  // Dimensions map
  const sizeMap = {
    xs: { icon: 30, text: "text-sm", sub: "text-[9px]" },
    sm: { icon: 44, text: "text-base", sub: "text-[10px]" },
    md: { icon: 52, text: "text-lg", sub: "text-[11px]" },
    lg: { icon: 88, text: "text-2xl", sub: "text-xs" },
    xl: { icon: 160, text: "text-4xl", sub: "text-sm" },
  };

  const currentSize = sizeMap[size] || sizeMap.md;
  const iconSize = typeof size === "number" ? size : currentSize.icon;

  if (variant === "raw") {
    return (
      <img
        src={logoSrc}
        alt="Plot Forge — Create Legends"
        width={iconSize}
        height={iconSize}
        className={`object-contain ${className}`}
        onError={(e) => {
          if (e.target.src !== "/logo.svg") e.target.src = "/logo.svg";
        }}
      />
    );
  }

  if (variant === "icon") {
    return (
      <div
        className={`relative inline-flex items-center justify-center overflow-hidden bg-transparent ${
          animate ? "hover:scale-105 transition-transform duration-300" : ""
        } ${className}`}
        style={{ width: iconSize, height: iconSize }}
      >
        <img
          src={logoSrc}
          alt="Plot Forge"
          className="w-full h-full object-contain select-none pointer-events-none"
          onError={(e) => {
            if (e.target.src !== "/logo.svg") e.target.src = "/logo.svg";
          }}
        />
      </div>
    );
  }

  if (variant === "emblem") {
    return (
      <div className={`flex flex-col items-center justify-center text-center ${className}`}>
        <div
          className="relative overflow-hidden select-none bg-transparent"
          style={{ width: iconSize, height: iconSize }}
        >
          <img
            src={logoSrc}
            alt="Plot Forge — Create Legends"
            className={`w-full h-full object-contain pointer-events-none ${
              animate ? "hover:scale-102 transition-transform duration-300" : ""
            }`}
            onError={(e) => {
              if (e.target.src !== "/logo.svg") e.target.src = "/logo.svg";
            }}
          />
        </div>

        {showTagline && (
          <div className="mt-3 space-y-0.5">
            <h2 className="text-xl sm:text-2xl font-black tracking-wider uppercase text-slate-900 dark:text-slate-100 font-serif">
              Plot Forge
            </h2>
            <p className="text-[10px] sm:text-xs font-bold tracking-[0.25em] uppercase text-teal-600 dark:text-teal-400">
              Create Legends
            </p>
          </div>
        )}
      </div>
    );
  }

  // Default "full" header/brand layout
  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      <div
        className="relative shrink-0 overflow-hidden bg-transparent"
        style={{ width: iconSize, height: iconSize }}
      >
        <img
          src={logoSrc}
          alt="Plot Forge Logo"
          className={`w-full h-full object-contain pointer-events-none ${
            animate ? "hover:scale-105 transition-transform duration-300" : ""
          }`}
          onError={(e) => {
            if (e.target.src !== "/logo.svg") e.target.src = "/logo.svg";
          }}
        />
      </div>

      <div className="flex flex-col">
        <span className={`font-serif font-black tracking-tight flex items-center gap-1.5 ${currentSize.text} text-slate-900 dark:text-slate-100 leading-none`}>
          <span>PLOT</span>
          <span className="theme-text">FORGE</span>
        </span>
        {showTagline && (
          <span className={`font-sans font-bold tracking-widest uppercase text-slate-500 dark:text-slate-400 ${currentSize.sub} mt-0.5`}>
            Create Legends
          </span>
        )}
      </div>
    </div>
  );
}
