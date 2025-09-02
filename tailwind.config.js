/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'caveat': ['Caveat', 'cursive'],
        'permanent-marker': ['Permanent Marker', 'cursive'],
        'roboto': ['Roboto', 'sans-serif'],
      },
      backgroundImage: {
        'grid-white': "radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)",
      },
      backgroundSize: {
        'grid': '20px 20px',
      },
    },
  },
  plugins: [],
}
