/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        editorial: {
          cream: '#FAF5EE',
          beige: '#E9DCC9',
          sand: '#DCC7A1',
          terracotta: '#C87A5A',
          wood: '#8A6B4F',
          ink: '#2B2B2B',
          muted: '#7A6F63'
        }
      },
      fontFamily: {
        serifEditorial: ['Merriweather', 'Georgia', 'serif'],
        uiSans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        'soft-1': '0 6px 18px rgba(34,28,20,0.06)',
        'soft-2': '0 10px 30px rgba(34,28,20,0.08)'
      },
    },
  },
  plugins: [],
}
