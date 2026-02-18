/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#05080f',
        surface: '#0a0f20',
        primary: '#3b82f6',
        accent: '#06b6d4',
        danger: '#f43f5e',
        success: '#10b981',
        muted: '#6b7ba8',
      },
    },
  },
  plugins: [],
};
