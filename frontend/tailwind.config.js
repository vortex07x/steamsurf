/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#d946ef',
          dark: '#8b5cf6',
        },
        dark: {
          DEFAULT: '#000000',
          secondary: '#0a0a0a',
        },
        text: {
          primary: '#ffffff',
          secondary: '#a1a1aa',
        }
      },
      fontFamily: {
        serif: ['Playfair Display', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}