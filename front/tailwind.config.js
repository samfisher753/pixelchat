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
        chatPanel: 'rgba(46,46,44,0.85)',
        infoMessage: '#dbdbdb',
        fullWinImg: 'rgba(46,46,44,0.95)',
        hideChatButtonDarkGrey: '#3a3832',
        hideChatButtonLightGrey: '#9c9791',
        linkBlue: '#1884ff',
        playerInfoDarkGrey: '#3d3d3d',
        playerInfoLightGrey: 'rgb(101,101,101)',
        playerInfoBorderBlack: 'rgb(24,24,24)',
        pixelchatBlue: '#022F72'
      },
    },
  },
  plugins: [],
}

