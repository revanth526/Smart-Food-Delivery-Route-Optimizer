/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class', '[data-theme="dark"]'],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        zomato: {
          red: '#E23744',
          hover: '#CB202D',
          light: '#FCE9EC',
        },
        blinkit: {
          yellow: '#F6C733',
          hover: '#E5B51A',
          green: '#318639',
          light: '#FFF9E5',
        },
        brandDark: '#1C252C',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
