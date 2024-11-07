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
        micButtonActive: '#eb6f6f',
        roomListLine: '#ededec',
        roomListPlayerCountGrey: '#cac9c0',
        roomListPlayerCountGreen: '#62b061',
        roomListWindow: '#ebe9df',
        roomListWindowHeader: '#24292a',
        closeButtonRed: '#bd3b2f',
        chatPanel: 'rgba(46,46,44,0.85)',
        infoMessage: '#dbdbdb',
        fullWinImg: 'rgba(46,46,44,0.95)',
        hideChatButtonDarkGrey: '#3a3832',
        hideChatButtonLightGrey: '#9c9791',
        linkBlue: '#1884ff',
        playerInfoDarkGrey: '#3d3d3d',
        playerInfoLightGrey: 'rgb(101,101,101)',
        playerInfoBorderBlack: 'rgb(24,24,24)'
      },
    },
  },
  plugins: [],
}

