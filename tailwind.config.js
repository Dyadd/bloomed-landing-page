/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg:      'rgb(var(--color-bg-rgb) / <alpha-value>)',
        surface: 'rgb(var(--color-surface-rgb) / <alpha-value>)',
        primary: 'rgb(var(--color-primary-rgb) / <alpha-value>)',
        accent:  'rgb(var(--color-accent-rgb) / <alpha-value>)',
        danger:  'rgb(var(--color-danger-rgb) / <alpha-value>)',
        success: 'rgb(var(--color-success-rgb) / <alpha-value>)',
        muted:   'rgb(var(--color-muted-rgb) / <alpha-value>)',
      },
    },
  },
  plugins: [],
};
