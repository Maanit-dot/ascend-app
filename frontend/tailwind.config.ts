import type { Config } from "tailwindcss";

/**
 * ASCEND design tokens — Solo Leveling / JARVIS futuristic HUD palette.
 *
 * Core palette:
 *  - void   : near-black deep space background
 *  - arc    : neon violet / purple — primary accent
 *  - cyan   : secondary glows and recovery states
 *  - crimson: boss HP, burnout warnings
 *  - amber  : XP, level-up moments
 *  - emerald: status online / completion
 */
const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        void: {
          DEFAULT: "#03020A",
          soft: "#060412",
          deep: "#010105",
          mid: "#080614",
        },
        panel: {
          DEFAULT: "#09071A",
          raised: "#0F0B26",
          deep: "#060410",
          border: "rgba(139,92,246,0.15)",
          glass: "rgba(9,7,26,0.75)",
        },
        arc: {
          50:  "#F5F2FF",
          100: "#E9E5FF",
          200: "#D4CCFF",
          300: "#C0B2FF",
          400: "#A28FFF",
          500: "#8B5CF6",
          600: "#7C3AED",
          700: "#6D28D9",
          800: "#5B21B6",
          900: "#4C1D95",
          950: "#2E1065",
        },
        cyan: {
          300: "#67E8F9",
          400: "#22D3EE",
          500: "#06B6D4",
          600: "#0891B2",
          700: "#0E7490",
        },
        emerald: {
          400: "#34D399",
          500: "#10B981",
          600: "#059669",
        },
        amber: {
          300: "#FCD34D",
          400: "#FBBF24",
          500: "#F59E0B",
        },
        crimson: {
          400: "#F87171",
          500: "#EF4444",
          600: "#DC2626",
        },
        ink: {
          primary:   "#F3F4F6",
          secondary: "#D1D5DB",
          muted:     "#9CA3AF",
          faint:     "#4B5563",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body:    ["var(--font-body)",    "sans-serif"],
        mono:    ["var(--font-mono)",    "monospace"],
      },
      backgroundImage: {
        "arc-glow":    "radial-gradient(circle at 50% 0%, rgba(139,92,246,0.25), transparent 60%)",
        "arc-glow-md": "radial-gradient(circle at 50% 0%, rgba(139,92,246,0.18), transparent 50%)",
        "grid-lines":
          "linear-gradient(rgba(139,92,246,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.04) 1px, transparent 1px)",
        "hero-gradient":
          "linear-gradient(135deg, rgba(139,92,246,0.25) 0%, rgba(3,2,10,0.95) 60%, rgba(3,2,10,1) 100%)",
        "panel-gradient":
          "linear-gradient(180deg, rgba(15,11,38,0.95) 0%, rgba(6,4,16,0.98) 100%)",
        "stat-bar-arc":
          "linear-gradient(90deg, #6D28D9, #A28FFF)",
        "stat-bar-cyan":
          "linear-gradient(90deg, #0891B2, #22D3EE)",
        "stat-bar-crimson":
          "linear-gradient(90deg, #DC2626, #F87171)",
        "stat-bar-amber":
          "linear-gradient(90deg, #F59E0B, #FCD34D)",
      },
      backgroundSize: {
        grid: "40px 40px",
      },
      boxShadow: {
        glass:          "0 8px 32px rgba(0,0,0,0.65), inset 0 1px 0 rgba(139,92,246,0.12)",
        "glass-raised": "0 16px 48px rgba(0,0,0,0.75), inset 0 1px 0 rgba(139,92,246,0.18)",
        "glow-arc":     "0 0 24px rgba(139,92,246,0.45)",
        "glow-arc-sm":  "0 0 12px rgba(139,92,246,0.35)",
        "glow-arc-lg":  "0 0 40px rgba(139,92,246,0.55)",
        "glow-cyan":    "0 0 20px rgba(6,182,212,0.40)",
        "glow-amber":   "0 0 20px rgba(251,191,36,0.40)",
        "glow-crimson": "0 0 20px rgba(239,68,68,0.40)",
        "glow-emerald": "0 0 16px rgba(52,211,153,0.40)",
        "inner-arc":    "inset 0 0 20px rgba(139,92,246,0.15)",
        "hud-panel":    "0 4px 24px rgba(0,0,0,0.8), 0 0 0 1px rgba(139,92,246,0.12)",
      },
      borderRadius: {
        xl2: "1.25rem",
        xl3: "1.5rem",
      },
      animation: {
        "pulse-slow":   "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "spin-slow":    "spin 12s linear infinite",
        "spin-reverse": "spin-reverse 16s linear infinite",
        shimmer:        "shimmer 2.5s linear infinite",
        "float-y":      "float-y 6s ease-in-out infinite",
        "wave-pulse":   "wave-pulse 1.2s ease-in-out infinite",
        "orb-pulse":    "orb-pulse 3s ease-in-out infinite",
        "border-glow":  "border-glow 2s ease-in-out infinite",
        "scan-line":    "scan-line 4s linear infinite",
        "waveform-1":   "waveform 1.0s ease-in-out infinite",
        "waveform-2":   "waveform 1.3s ease-in-out infinite 0.1s",
        "waveform-3":   "waveform 0.9s ease-in-out infinite 0.2s",
        "waveform-4":   "waveform 1.4s ease-in-out infinite 0.05s",
        "waveform-5":   "waveform 1.1s ease-in-out infinite 0.15s",
        "ping-slow":    "ping 2s cubic-bezier(0, 0, 0.2, 1) infinite",
        "fade-in":      "fade-in 0.3s ease-out",
      },
      keyframes: {
        shimmer: {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "float-y": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%":      { transform: "translateY(-6px)" },
        },
        "wave-pulse": {
          "0%, 100%": { transform: "scaleY(1)" },
          "50%":      { transform: "scaleY(2.2)" },
        },
        waveform: {
          "0%, 100%": { transform: "scaleY(0.3)" },
          "50%":      { transform: "scaleY(1)" },
        },
        "orb-pulse": {
          "0%, 100%": { boxShadow: "0 0 20px rgba(139,92,246,0.5), 0 0 40px rgba(139,92,246,0.2)" },
          "50%":      { boxShadow: "0 0 35px rgba(139,92,246,0.8), 0 0 70px rgba(139,92,246,0.35)" },
        },
        "border-glow": {
          "0%, 100%": { borderColor: "rgba(139,92,246,0.3)" },
          "50%":      { borderColor: "rgba(139,92,246,0.7)" },
        },
        "scan-line": {
          "0%":   { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100vh)" },
        },
        "spin-reverse": {
          "0%":   { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(-360deg)" },
        },
        "fade-in": {
          "0%":   { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};

export default config;
