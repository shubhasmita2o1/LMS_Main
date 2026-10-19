/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f7f4',
          100: '#e0efe7',
          200: '#c2decf',
          300: '#98c5b0',
          400: '#68a68b',
          500: '#2f7c5e',
          600: '#1a5c43',
          700: '#165239', // Donezo deep forest green
          800: '#12422e',
          900: '#0d3222',
          950: '#061a12',
        },
        forest: {
          50: '#f0f7f4',
          100: '#e0efe7',
          200: '#c2decf',
          300: '#98c5b0',
          400: '#68a68b',
          500: '#2f7c5e',
          600: '#1a5c43',
          700: '#165239',
          800: '#12422e',
          900: '#0d3222',
          950: '#061a12',
        },
        mint: {
          50: '#f2fbf6',
          100: '#e1f7ec',
          200: '#c5eed9',
          300: '#98e0bd',
          400: '#63cc9b',
          500: '#34b27b',
          600: '#249162',
        },
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
};
