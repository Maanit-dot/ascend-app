import type { Config } from "tailwindcss";

/**
 * ASCEND design tokens — Solo Leveling / JARVIS futuristic HUD palette.
 * v3.0.0 — "Living System" visual language
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
          "linear-gradient(135deg, rgba(139,92,246,0.30) 0%, rgba(3,2,10,0.95) 60%, rgba(3,2,10,1) 100%)",
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
        "flame-gradient":
          "linear-gradient(180deg, rgba(139,92,246,0) 0%, rgba(109,40,217,0.6) 40%, rgba(91,33,182,0.9) 70%, rgba(139,92,246,0.4) 100%)",
        "energy-gradient":
          "radial-gradient(ellipse at center, rgba(139,92,246,0.4) 0%, rgba(109,40,217,0.2) 40%, transparent 70%)",
        "core-gradient":
          "radial-gradient(circle, rgba(162,143,255,0.9) 0%, rgba(139,92,246,0.7) 30%, rgba(109,40,217,0.5) 60%, rgba(46,16,101,0.8) 100%)",
      },
      backgroundSize: {
        grid: "40px 40px",
      },
      boxShadow: {
        glass:            "0 8px 32px rgba(0,0,0,0.65), inset 0 1px 0 rgba(139,92,246,0.12)",
        "glass-raised":   "0 16px 48px rgba(0,0,0,0.75), inset 0 1px 0 rgba(139,92,246,0.18)",
        "glow-arc":       "0 0 24px rgba(139,92,246,0.45)",
        "glow-arc-sm":    "0 0 12px rgba(139,92,246,0.35)",
        "glow-arc-lg":    "0 0 40px rgba(139,92,246,0.55)",
        "glow-arc-xl":    "0 0 60px rgba(139,92,246,0.65), 0 0 100px rgba(139,92,246,0.25)",
        "glow-cyan":      "0 0 20px rgba(6,182,212,0.40)",
        "glow-amber":     "0 0 20px rgba(251,191,36,0.40)",
        "glow-crimson":   "0 0 20px rgba(239,68,68,0.40)",
        "glow-emerald":   "0 0 16px rgba(52,211,153,0.40)",
        "inner-arc":      "inset 0 0 20px rgba(139,92,246,0.15)",
        "inner-arc-lg":   "inset 0 0 40px rgba(139,92,246,0.25)",
        "hud-panel":      "0 4px 24px rgba(0,0,0,0.8), 0 0 0 1px rgba(139,92,246,0.12)",
        "hud-elite":      "0 4px 32px rgba(0,0,0,0.9), 0 0 0 1px rgba(139,92,246,0.25), 0 0 20px rgba(139,92,246,0.1)",
        "core-glow":      "0 0 80px rgba(139,92,246,0.6), 0 0 160px rgba(139,92,246,0.3)",
        "flame":          "0 0 30px rgba(139,92,246,0.7), 0 0 60px rgba(109,40,217,0.4)",
      },
      borderRadius: {
        xl2: "1.25rem",
        xl3: "1.5rem",
      },
      animation: {
        "pulse-slow":       "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "spin-slow":        "spin 12s linear infinite",
        "spin-slow-20":     "spin 20s linear infinite",
        "spin-reverse":     "spin-reverse 16s linear infinite",
        "spin-reverse-24":  "spin-reverse 24s linear infinite",
        shimmer:            "shimmer 2.5s linear infinite",
        "float-y":          "float-y 6s ease-in-out infinite",
        "float-y-slow":     "float-y 9s ease-in-out infinite",
        "wave-pulse":       "wave-pulse 1.2s ease-in-out infinite",
        "orb-pulse":        "orb-pulse 3s ease-in-out infinite",
        "orb-breathe":      "orb-breathe 4s ease-in-out infinite",
        "border-glow":      "border-glow 2s ease-in-out infinite",
        "scan-line":        "scan-line 4s linear infinite",
        "waveform-1":       "waveform 1.0s ease-in-out infinite",
        "waveform-2":       "waveform 1.3s ease-in-out infinite 0.1s",
        "waveform-3":       "waveform 0.9s ease-in-out infinite 0.2s",
        "waveform-4":       "waveform 1.4s ease-in-out infinite 0.05s",
        "waveform-5":       "waveform 1.1s ease-in-out infinite 0.15s",
        "ping-slow":        "ping 2s cubic-bezier(0, 0, 0.2, 1) infinite",
        "fade-in":          "fade-in 0.3s ease-out",
        "flame-1":          "flame-rise 3.5s ease-in-out infinite",
        "flame-2":          "flame-rise 4.2s ease-in-out infinite 0.7s",
        "flame-3":          "flame-rise 3.0s ease-in-out infinite 1.4s",
        "flame-sway":       "flame-sway 4s ease-in-out infinite",
        "particle-drift":   "particle-drift 8s ease-in-out infinite",
        "particle-drift-2": "particle-drift 11s ease-in-out infinite 3s",
        "particle-drift-3": "particle-drift 7s ease-in-out infinite 1.5s",
        "energy-rotate":    "energy-rotate 6s linear infinite",
        "energy-rotate-r":  "energy-rotate-r 9s linear infinite",
        "arc-draw":         "arc-draw 2s ease-in-out infinite",
        "core-breathe":     "core-breathe 5s ease-in-out infinite",
        "level-ring":       "level-ring 3s ease-in-out infinite",
        "slide-up":         "slide-up 0.4s ease-out",
        "star-twinkle":     "star-twinkle 3s ease-in-out infinite",
        "nebula-pulse":     "nebula-pulse 8s ease-in-out infinite",
        "data-flow":        "data-flow 2s linear infinite",
        "hero-aura":        "hero-aura 4s ease-in-out infinite",
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
        "orb-breathe": {
          "0%, 100%": { boxShadow: "0 0 30px rgba(139,92,246,0.4), 0 0 60px rgba(139,92,246,0.15)", transform: "scale(1)" },
          "50%":      { boxShadow: "0 0 60px rgba(139,92,246,0.7), 0 0 100px rgba(139,92,246,0.3)", transform: "scale(1.03)" },
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
        "energy-rotate": {
          "0%":   { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        "energy-rotate-r": {
          "0%":   { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(-360deg)" },
        },
        "fade-in": {
          "0%":   { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-up": {
          "0%":   { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "flame-rise": {
          "0%":   { transform: "scaleY(0.8) scaleX(0.9) translateY(8px)", opacity: "0.4", filter: "blur(8px)" },
          "40%":  { transform: "scaleY(1.1) scaleX(0.95) translateY(-4px)", opacity: "0.9", filter: "blur(4px)" },
          "70%":  { transform: "scaleY(0.95) scaleX(1.05) translateY(-8px)", opacity: "0.7", filter: "blur(6px)" },
          "100%": { transform: "scaleY(0.8) scaleX(0.9) translateY(8px)", opacity: "0.4", filter: "blur(8px)" },
        },
        "flame-sway": {
          "0%, 100%": { transform: "skewX(-3deg) translateX(-2px)" },
          "50%":      { transform: "skewX(3deg) translateX(2px)" },
        },
        "particle-drift": {
          "0%":   { transform: "translateY(20px) translateX(0px)", opacity: "0" },
          "20%":  { opacity: "0.8" },
          "80%":  { opacity: "0.4" },
          "100%": { transform: "translateY(-60px) translateX(15px)", opacity: "0" },
        },
        "arc-draw": {
          "0%":   { strokeDashoffset: "300", opacity: "0.3" },
          "50%":  { strokeDashoffset: "0", opacity: "0.9" },
          "100%": { strokeDashoffset: "-300", opacity: "0.3" },
        },
        "core-breathe": {
          "0%, 100%": { transform: "scale(1)", filter: "brightness(1)" },
          "50%":      { transform: "scale(1.05)", filter: "brightness(1.3)" },
        },
        "level-ring": {
          "0%, 100%": { filter: "drop-shadow(0 0 8px rgba(139,92,246,0.6))" },
          "50%":      { filter: "drop-shadow(0 0 20px rgba(139,92,246,1)) drop-shadow(0 0 40px rgba(162,143,255,0.5))" },
        },
        "star-twinkle": {
          "0%, 100%": { opacity: "0.2" },
          "50%":      { opacity: "0.8" },
        },
        "nebula-pulse": {
          "0%, 100%": { opacity: "0.6", transform: "scale(1)" },
          "50%":      { opacity: "1", transform: "scale(1.02)" },
        },
        "data-flow": {
          "0%":   { backgroundPosition: "0% 0%" },
          "100%": { backgroundPosition: "0% 100%" },
        },
        "hero-aura": {
          "0%, 100%": { opacity: "0.5", transform: "scale(0.98)" },
          "50%":      { opacity: "0.85", transform: "scale(1.02)" },
        },
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};

export default config;
