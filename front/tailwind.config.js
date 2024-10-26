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
        barGrey: '#2e2e2c',
        barBorderGrey: '#53524f',
        micButton: '#f5f1ee',
        micButtonActive: '#eb6f6f'
      },
    },
  },
  plugins: [],
}

