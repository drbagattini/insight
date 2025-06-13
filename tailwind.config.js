/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#2563eb",
        primary_hov: "#1e4fd1",
        card_bg: "#ffffff",
        border: "#e5e7eb",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
