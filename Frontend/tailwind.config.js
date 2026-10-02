export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        charcoal: {
          950: "#0a0a0a",
          900: "#121212",
          850: "#161616",
          800: "#1c1c1c",
          700: "#262626",
          600: "#333333",
        },
        gold: {
          50: "#fbf6e9",
          100: "#f5e9c3",
          200: "#eddb9c",
          300: "#e4cd75",
          400: "#dcc04f",
          500: "#d4af37",
          600: "#b8912a",
          700: "#8f7020",
          800: "#655016",
          900: "#3c2f0d",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(16, 24, 40, 0.04), 0 4px 12px rgba(16, 24, 40, 0.06)",
      },
    },
  },
  plugins: [],
};
