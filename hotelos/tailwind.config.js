/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#22324E",
          dark: "#1E3252",
        },
        gold: {
          DEFAULT: "#766242",
          hover: "#826A42",
        },
        ivory: "#F4F4E4",
        cream: "#FCFCFC",
        beige: {
          DEFAULT: "#ECECE4",
          border: "#E4E4DC",
        },
        muted: "#8A8878",
      },
      fontFamily: {
        display: ["'Cormorant Garamond'", "serif"],
        body: ["'Inter'", "sans-serif"],
      },
      boxShadow: {
        soft: "0 4px 24px rgba(34, 50, 78, 0.08)",
        card: "0 2px 12px rgba(34, 50, 78, 0.06)",
      },
    },
  },
  plugins: [],
};
