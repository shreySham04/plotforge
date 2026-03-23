export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        base: "#020617",
        panel: "#0f172a",
        accent: "#2563eb",
        accentSoft: "#1d4ed8"
      },
      boxShadow: {
        glow: "0 0 20px rgba(37,99,235,0.35)"
      }
    }
  },
  plugins: []
};
