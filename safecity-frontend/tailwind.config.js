/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          deep: "#0A0E17",
          surface: "#121826",
          raised: "#1A2333",
        },
        signal: {
          teal: "#00D9C0",
          tealDim: "#0A5C52",
        },
        alert: {
          critical: "#FF4757",
          warning: "#FFB020",
          resolved: "#3DDC91",
        },
        text: {
          primary: "#E8ECF4",
          muted: "#7C8797",
        },
        borderline: "#232D3F",
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        body: ["Inter", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      keyframes: {
        scan: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        pulseDot: {
          "0%, 100%": { opacity: 1 },
          "50%": { opacity: 0.3 },
        },
      },
      animation: {
        scan: "scan 2.5s linear infinite",
        pulseDot: "pulseDot 1.6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
