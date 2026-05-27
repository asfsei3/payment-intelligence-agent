import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Forest green base — aligned with brand (premium B2B dark theme)
        ink: {
          950: "#06180f",
          900: "#0d2b1e",
          800: "#143a29",
          700: "#1a4731",
          600: "#235a3f",
          500: "#2d6d4d",
        },
        moss: {
          400: "#3a7d59",
          300: "#5aa37a",
          200: "#8cc4a6",
          100: "#c5e1d2",
        },
        // Champagne gold accent (brand)
        gold: {
          500: "#c9a84c",
          400: "#d4ba6a",
          300: "#e0cd8f",
          200: "#ecdfb5",
        },
        // Status colors
        danger: "#c0392b",
        warn: "#e8b65a",
        ok: "#5aa37a",
        muted: "#7a8a83",
      },
      fontFamily: {
        sans: [
          "var(--font-noto-sans-jp)",
          "var(--font-inter)",
          "-apple-system",
          "BlinkMacSystemFont",
          '"Hiragino Kaku Gothic ProN"',
          '"Hiragino Sans"',
          '"Segoe UI"',
          "Roboto",
          "sans-serif",
        ],
        display: [
          "var(--font-inter)",
          "var(--font-noto-sans-jp)",
          "-apple-system",
          "sans-serif",
        ],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      boxShadow: {
        card: "0 2px 12px rgba(0,0,0,0.25), 0 0 0 1px rgba(212,175,55,0.08)",
        glow: "0 0 0 1px rgba(212,175,55,0.25), 0 0 24px rgba(212,175,55,0.08)",
      },
      animation: {
        "fade-up": "fadeUp 0.4s ease-out both",
        "pulse-dot": "pulseDot 1.6s ease-in-out infinite",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseDot: {
          "0%, 100%": { opacity: "0.4", transform: "scale(0.9)" },
          "50%": { opacity: "1", transform: "scale(1.1)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
