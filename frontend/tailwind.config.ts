import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#08090b",
        panel: "#101114",
        panel2: "#16171c",
        line: "#232529",
        up: "#34d399",
        down: "#fb7185",
        warn: "#fbbf24",
        info: "#60a5fa",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        card: "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 12px 32px -16px rgba(0,0,0,0.8)",
        glow: "0 0 24px -6px rgba(52,211,153,0.35)",
      },
      keyframes: {
        pulseDot: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.45", transform: "scale(0.82)" },
        },
        flashUp: {
          "0%": { backgroundColor: "rgba(52,211,153,0.22)" },
          "100%": { backgroundColor: "transparent" },
        },
        flashDown: {
          "0%": { backgroundColor: "rgba(251,113,133,0.22)" },
          "100%": { backgroundColor: "transparent" },
        },
        slideIn: {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
        fadeUp: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        pulseDot: "pulseDot 1.6s ease-in-out infinite",
        flashUp: "flashUp 0.9s ease-out",
        flashDown: "flashDown 0.9s ease-out",
        slideIn: "slideIn 0.28s cubic-bezier(0.32,0.72,0,1)",
        fadeUp: "fadeUp 0.35s ease-out",
      },
    },
  },
  plugins: [],
};
export default config;
