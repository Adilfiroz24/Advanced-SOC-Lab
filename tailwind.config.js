/**
 * Advanced SOC Lab — Tailwind CSS Configuration
 * Dark cyber theme: #0a0f1e background, #00e5ff cyan accent, glassmorphism
 */

/** @type {import('tailwindcss').Config} */
module.exports = {
  // Scan all React source files for class usage (production tree-shaking)
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],

  theme: {
    extend: {
      // ── Custom cyber/SOC color palette ─────────────────
      colors: {
        cyber: {
          bg:        "#0a0f1e",  // Main app background
          panel:     "#0d1530",  // Sidebar / navbar background
          card:      "#0d1530",  // Glassmorphism card base
          border:    "#1a2744",  // Default border
          "border-bright": "#243660",
          cyan:      "#00e5ff",  // Primary accent / glow color
          "cyan-dim":"#00b8cc",
          green:     "#00ff88",  // Success / resolved / online
          red:       "#ff2d6d",  // Critical / open alerts
          orange:    "#ff8c00",  // High severity
          yellow:    "#ffd600",  // Medium severity
          purple:    "#7b2fff",  // MITRE ATT&CK tags
          text:      "#c8d8f0",  // Primary text
          "text-dim":"#6b7fa3",  // Secondary / muted text
          "text-bright": "#e8f4ff",
        },
      },

      // ── Fonts: monospace for data, sans for UI ─────────
      fontFamily: {
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },

      // ── Glow / pulse animations for live SOC indicators ─
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "glow":       "glow 2s ease-in-out infinite alternate",
        "scan":       "scan 3s linear infinite",
        "ping-slow":  "ping 1.5s ease-out infinite",
      },
      keyframes: {
        glow: {
          from: { boxShadow: "0 0 5px #00e5ff40, 0 0 10px #00e5ff20" },
          to:   { boxShadow: "0 0 15px #00e5ff80, 0 0 30px #00e5ff40" },
        },
        scan: {
          "0%":   { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100vh)" },
        },
      },

      // ── Glassmorphism blur utility ──────────────────────
      backdropBlur: {
        xs: "2px",
      },

      // ── Box shadows for glow effects on cards/buttons ──
      boxShadow: {
        "glow-cyan":  "0 0 15px rgba(0, 229, 255, 0.3), 0 0 30px rgba(0, 229, 255, 0.1)",
        "glow-red":   "0 0 15px rgba(255, 45, 109, 0.3)",
        "glow-green": "0 0 15px rgba(0, 255, 136, 0.3)",
      },
    },
  },

  plugins: [],
};