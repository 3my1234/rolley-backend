/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#050510",
        surface: "#0b0b1e",
        primary: {
          DEFAULT: "#ff8c00",
          light: "#ffb347",
        },
        secondary: {
          DEFAULT: "#5b5bff",
        },
        accent: {
          DEFAULT: "#ffd166",
        },
        neutral: {
          100: "#f5f6f8",
          200: "#d1d5db",
          300: "#9ca3af",
          400: "#6b7280",
          500: "#4b5563",
          600: "#374151",
          700: "#1f2937",
        },
      },
      fontFamily: {
        sans: ["'Inter'", "system-ui", "sans-serif"],
        display: ["'Space Grotesk'", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 40px rgba(255, 140, 0, 0.25)",
        glass: "0 20px 50px rgba(15, 12, 41, 0.35)",
      },
      backgroundImage: {
        "grid-dark": "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.06) 1px, transparent 0)",
      },
    },
  },
  plugins: [],
};

