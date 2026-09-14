import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        barber: {
          bg: "#0a1418",
          // Полупрозрачный поверхность — фон просвечивает сквозь карточки
          surface: "rgba(19, 42, 48, 0.55)",
          surfaceHover: "rgba(28, 56, 62, 0.65)",
          // Более заметная граница, чтобы карточки читались
          border: "#2a5058",
          accent: "#d4af37",
          accentHover: "#e8c555",
          accentMuted: "rgba(212, 175, 55, 0.15)",
          text: "#e6f0ee",
          muted: "#8fb0ac",
          success: "#4ade80",
          danger: "#f87171",
        },
      },
      fontFamily: {
        display: ["Georgia", "serif"],
      },
      borderRadius: {
        card: "0.5rem",
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};

export default config;