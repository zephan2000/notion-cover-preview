/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: '#2d6a4f',
          light: '#40916c',
          dark: '#1b4332',
        },
        notion: {
          text: '#37352f',
          'dark-bg': '#191919',
          'dark-text': '#e6e3dc',
        },
      },
    },
  },
  plugins: [],
}
