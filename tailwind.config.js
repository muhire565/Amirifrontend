/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Deep navy brand
        navy: {
          DEFAULT: '#0A0F1E',
          800: '#111827',
        },
        // Keep legacy brand tokens for backward compat
        brand: {
          primary:        '#F59E0B',
          'primary-dark': '#D97706',
          'primary-light':'#FEF3C7',
          sidebar:        '#0A0F1E',
        },
        // Design system tokens
        indigo: {
          pos: '#4F46E5',
        },
        slate: {
          950: '#020617',
        }
      },
      fontFamily: {
        sans:          ['Inter', 'sans-serif'],
        'brand-display':['Inter', 'sans-serif'],
      },
      borderRadius: {
        'card': '20px',
      },
      boxShadow: {
        'card':      '0 2px 12px rgba(0,0,0,0.04)',
        'card-hover':'0 8px 32px rgba(0,0,0,0.10)',
        'sidebar':   '2px 0 12px rgba(0,0,0,0.20)',
        'modal':     '0 20px 60px rgba(0,0,0,0.15)',
      },
      animation: {
        'glow-pulse': 'glow-pulse 2s infinite',
      },
      keyframes: {
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(245,158,11,0.4)' },
          '50%':       { boxShadow: '0 0 0 4px rgba(245,158,11,0.2)' },
        }
      },
      spacing: {
        'sidebar': '240px',
      }
    },
  },
  plugins: [],
}
