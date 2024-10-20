/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        lightGrey: '#ebe9df',
        darkGrey: '#24292a',
      },
    },
  },
  plugins: [],
}

