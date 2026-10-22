/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#165239', // Donezo forest green signature
          700: '#12442f',
          800: '#0e3524',
          900: '#0a261a',
          950: '#05160e',
          DEFAULT: '#165239',
        },
        forest: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#165239',
          700: '#12442f',
          800: '#0e3524',
          900: '#0a261a',
          950: '#05160e',
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
        canvas: '#f8fafc',
        surface: '#ffffff',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(15, 23, 42, 0.04), 0 1px 2px -1px rgba(15, 23, 42, 0.04)',
        cardHover: '0 10px 25px -5px rgba(15, 23, 42, 0.06), 0 8px 10px -6px rgba(15, 23, 42, 0.04)',
        pill: '0 2px 8px 0 rgba(22, 82, 57, 0.25)',
      },
    },
  },
  plugins: [],
};
