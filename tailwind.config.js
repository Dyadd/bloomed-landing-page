/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#f5f2eb',
        surface: '#ffffff',
        primary: '#2c2a26',
        accent: '#825ff4',
        danger: '#e5484d',
        success: '#30a46c',
        muted: '#78756e',
      },
    },
  },
  plugins: [],
};
