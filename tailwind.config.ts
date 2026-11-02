import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        sand: {
          50: "#fffaf5",
          100: "#fff3e8",
          200: "#ffe4cc",
        },
        lilac: {
          50: "#f7f3ff",
          100: "#eee6ff",
          200: "#dccfff",
          300: "#c4b0f5",
          400: "#9b82e8",
          500: "#7c6cf0",
          600: "#6354d6",
          700: "#4f42b0",
          900: "#2a2458",
        },
        sea: {
          400: "#5b9cf5",
          500: "#3f86e8",
        },
        foam: "#ffffff",
        ink: {
          700: "#3d3566",
          800: "#2c2550",
          900: "#1e1a3a",
        },
        system: {
          cyan: "#5b9cf5",
          violet: "#7c6cf0",
          gold: "#e0b24a",
          danger: "#e85a7a",
          clear: "#5ec4a8",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        hud: ["var(--font-body)", "sans-serif"],
      },
      boxShadow: {
        soft: "0 10px 30px rgba(124, 108, 240, 0.12)",
        card: "0 8px 24px rgba(42, 36, 88, 0.08)",
        pill: "0 6px 16px rgba(124, 108, 240, 0.28)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "level-rise": {
          "0%": { opacity: "0", transform: "translateY(24px) scale(0.96)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        "stamp-in": {
          "0%": { transform: "scale(1.4)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "ally-enter": {
          "0%": { opacity: "0", transform: "translateY(28px) scale(0.92)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        "hud-flash": {
          "0%": { opacity: "0", letterSpacing: "0.4em" },
          "100%": { opacity: "1", letterSpacing: "0.2em" },
        },
        "type-fade": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "glow-pulse": {
          "0%, 100%": { opacity: "0.35", transform: "scale(1)" },
          "50%": { opacity: "0.7", transform: "scale(1.08)" },
        },
        "btn-pop": {
          "0%": { opacity: "0", transform: "translateY(12px) scale(0.94)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        "rules-pop": {
          "0%, 100%": { transform: "scale(1)", boxShadow: "0 0 0 0 rgba(246, 216, 96, 0.55)" },
          "50%": { transform: "scale(1.06)", boxShadow: "0 0 0 10px rgba(246, 216, 96, 0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.55s ease-out forwards",
        "level-rise": "level-rise 0.7s ease-out forwards",
        float: "float 4.5s ease-in-out infinite",
        "stamp-in": "stamp-in 0.4s ease-out forwards",
        "ally-enter": "ally-enter 0.65s cubic-bezier(0.22, 1, 0.36, 1) forwards",
        "hud-flash": "hud-flash 0.55s ease-out forwards",
        "type-fade": "type-fade 0.5s ease-out forwards",
        "glow-pulse": "glow-pulse 2.8s ease-in-out infinite",
        "btn-pop": "btn-pop 0.45s ease-out forwards",
        "rules-pop": "rules-pop 1.8s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
