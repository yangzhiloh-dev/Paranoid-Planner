/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: '#0B0B0D',
        surfaceElevated: 'rgba(255,255,255,0.08)',
        borderLight: 'rgba(255,255,255,0.10)',
        textPrimary: '#F5F2EA',
        textMuted: '#A8A29E',
        accent: '#F59E0B',
        accentDark: '#D97706',
        danger: '#EF4444',
        success: '#22C55E',
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
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serifEditorial: ['Merriweather', 'Georgia', 'serif']
      },
      boxShadow: {
        glow: '0 24px 80px rgba(0,0,0,0.28)',
        panel: '0 18px 60px rgba(0,0,0,0.22)',
        soft: '0 12px 40px rgba(0,0,0,0.18)'
      },
      backdropBlur: {
        xl: '20px'
      },
      backgroundImage: {
        'hero-gradient': 'radial-gradient(circle at top left, rgba(245,158,11,0.14), transparent 28%), radial-gradient(circle at 80% 10%, rgba(255,255,255,0.05), transparent 18%)'
      }
    },
  },
  plugins: [],
}
