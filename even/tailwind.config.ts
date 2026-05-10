import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: "hsl(var(--paper))",
          deep: "hsl(var(--paper-deep))",
          rim: "hsl(var(--paper-rim))",
          line: "hsl(var(--paper-line))",
        },
        ink: {
          DEFAULT: "hsl(var(--ink))",
          soft: "hsl(var(--ink-soft))",
          mute: "hsl(var(--ink-mute))",
          ghost: "hsl(var(--ink-ghost))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          deep: "hsl(var(--accent-deep))",
          tint: "hsl(var(--accent-tint))",
        },
        owed: "hsl(var(--owed))",
        "owed-to": "hsl(var(--owed-to))",
        privacy: {
          DEFAULT: "hsl(var(--privacy))",
          tint: "hsl(var(--privacy-tint))",
        },
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
        mono: ["var(--font-mono)"],
      },
      fontSize: {
        eyebrow: ["0.7rem", { letterSpacing: "0.12em", fontWeight: "600" }],
      },
      borderRadius: {
        none: "0",
        sm: "2px",
        DEFAULT: "4px",
      },
      animation: {
        "cursor-blink": "blink 1s step-end infinite",
        "tear-in": "tearIn 600ms cubic-bezier(0.2, 0.8, 0.2, 1) both",
        "stamp-in": "stampIn 350ms cubic-bezier(0.34, 1.56, 0.64, 1) both",
        "count-up": "countUp 800ms ease-out both",
        "fade-in": "fadeIn 200ms ease-out both",
      },
      keyframes: {
        blink: {
          "0%, 50%": { opacity: "1" },
          "50.01%, 100%": { opacity: "0" },
        },
        tearIn: {
          "0%": { transform: "translateY(60px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        stampIn: {
          "0%": { transform: "scale(2) rotate(-12deg)", opacity: "0" },
          "60%": { transform: "scale(0.95) rotate(-2deg)", opacity: "1" },
          "100%": { transform: "scale(1) rotate(-4deg)", opacity: "1" },
        },
        countUp: {
          "0%": { transform: "translateY(0.6em)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
