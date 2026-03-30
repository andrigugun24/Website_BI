/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./resources/**/*.blade.php",
    "./resources/**/*.js",
    "./resources/**/*.jsx",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#456254",
        secondary: "#708f7f",
        accent: "#b8a28f",
        cream: "#f4e8dc",
        surface: "#fef2e5",
        "on-surface": "#6d5b4b",
        "brand-bg": "#fff8f3",
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        headline: ['Manrope', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
