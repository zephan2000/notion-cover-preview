/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        accent: {
          DEFAULT: '#5e6ad2',
          light: '#7c85e0',
          dark: '#4e5bc2',
          muted: 'rgba(94, 106, 210, 0.12)',
          subtle: 'rgba(94, 106, 210, 0.06)',
        },
        success: {
          DEFAULT: '#10b981',
          muted: 'rgba(16, 185, 129, 0.12)',
        },
        warning: {
          DEFAULT: '#f59e0b',
          muted: 'rgba(245, 158, 11, 0.12)',
        },
        linear: {
          bg: '#0e0f12',
          panel: '#16161e',
          surface: '#1c1c28',
          'surface-hover': '#24243a',
          border: '#26272f',
          'border-light': '#2e2f3a',
          'text-primary': '#e2e2e5',
          'text-secondary': '#8a8b9a',
          'text-muted': '#55566a',
        },
        notion: {
          text: '#37352f',
          'dark-bg': '#191919',
          'dark-text': '#e6e3dc',
        },
      },
      animation: {
        'modal-in': 'modalIn 0.2s ease-out',
        'badge-pop': 'badgePop 0.3s ease-out',
        'fade-in': 'fadeIn 0.15s ease-out',
      },
      keyframes: {
        modalIn: {
          '0%': { opacity: '0', transform: 'scale(0.97) translateY(4px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        badgePop: {
          '0%': { opacity: '0', transform: 'scale(0.5)' },
          '60%': { transform: 'scale(1.1)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
