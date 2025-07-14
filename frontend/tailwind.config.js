/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#ffffff",
        foreground: "#171717",
        primary: {
          DEFAULT: "#16a34a", // emerald-600
          light: "#4ade80", // emerald-400
          dark: "#15803d", // Green-700
        },
        accent: {
          DEFAULT: "#4ade80", // emerald-400 for savings highlights
        },
        danger: "#dc2626", // red-600
      },
      fontFamily: {
        sans: ["Arial", "Helvetica", "sans-serif"],
      },
    },
  },
  plugins: [],
};
