/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: "#ffffff",
          muted: "#f8fafc",
          border: "#e2e8f0",
        },
        ink: {
          DEFAULT: "#0f172a",
          muted: "#64748b",
          soft: "#94a3b8",
        },
      },
      fontFamily: {
        sans: [
          "IBM Plex Sans",
          "Segoe UI",
          "system-ui",
          "sans-serif",
        ],
        mono: [
          "IBM Plex Mono",
          "Consolas",
          "monospace",
        ],
      },
      boxShadow: {
        panel: "0 1px 2px rgba(15, 23, 42, 0.04), 0 1px 3px rgba(15, 23, 42, 0.06)",
      },
    },
  },
  plugins: [],
};
