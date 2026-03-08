/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#5048e5',
          hover: '#4038d5',
        }
      }
    },
  },
  plugins: [],
}