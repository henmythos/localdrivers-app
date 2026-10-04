/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#f0f4f9',
          100: '#dce5f1',
          800: '#0b1e36',
          900: '#031735',
          950: '#020e23',
        },
        yellow: {
          400: '#ffc107',
          500: '#ffb703',
          600: '#e09f00',
        },
        brand: {
          50: '#ebf5ff',
          100: '#d8f0ff',
          500: '#1e88e5',
          600: '#1565c0',
          700: '#0d47a1',
          900: '#031735',
        },
        cardBlue: {
          bg: '#ebf5ff',
          border: '#bfdbfe',
          pill: '#e0f2fe',
          text: '#0369a1',
        },
        cardGreen: {
          bg: '#ecfdf5',
          border: '#a7f3d0',
          pill: '#d1fae5',
          text: '#047857',
        },
        cardPurple: {
          bg: '#f5f3ff',
          border: '#ddd6fe',
          pill: '#ede9fe',
          text: '#6d28d9',
        },
        cardPeach: {
          bg: '#fff7ed',
          border: '#fed7aa',
          pill: '#ffedd5',
          text: '#c2410c',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.05), 0 2px 6px -1px rgba(0, 0, 0, 0.03)',
        'card': '0 10px 30px -5px rgba(0, 0, 0, 0.08), 0 4px 12px -2px rgba(0, 0, 0, 0.03)',
        'floating': '0 10px 25px -5px rgba(21, 101, 192, 0.4)',
      }
    },
  },
  plugins: [],
}
