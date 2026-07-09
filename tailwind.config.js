/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        // Single family, weight contrast. Manrope echoes the beacon wordmark.
        display: ['"Manrope"', "system-ui", "sans-serif"],
        body: ['"Manrope"', "system-ui", "sans-serif"],
      },
      colors: {
        // Beacon monochrome core (light product UI).
        ink: {
          DEFAULT: "#141414",
          soft: "#5c5c5c",
          faint: "#8a8a8a",
        },
        paper: "#ffffff",
        cream: "#f5f2ec",
        line: "#e6e4df",
        bronze: {
          DEFAULT: "#9c7c52",
          bright: "#c19a63",
        },
      },
      letterSpacing: {
        wordmark: "-0.03em",
      },
    },
  },
  plugins: [],
};
