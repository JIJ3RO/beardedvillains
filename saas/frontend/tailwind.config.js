/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fdf4e7',
          500: '#c8860a',
          600: '#a36b08',
          900: '#3d2703',
        },
      },
    },
  },
  plugins: [],
};
