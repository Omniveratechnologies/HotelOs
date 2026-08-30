export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        navy: { 900: "#0f1f3d", 800: "#162847", 700: "#1e3a5f" },
        gold: { 400: "#c9a84c", 500: "#b8922e", 600: "#9a7820" },
        cream: { 50: "#faf8f4", 100: "#f4f0e8" },
      },
      fontFamily: { display: ["Georgia", "serif"] },
    },
  },
  plugins: [],
};
