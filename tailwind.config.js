/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans:   ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        accent: ['Playfair Display', 'Georgia', 'serif'],
      },
      fontSize: {
        'display':    ['3.75rem', { lineHeight: '1.08', letterSpacing: '-0.02em' }],
        'display-2xl': ['6rem',   { lineHeight: '1.08', letterSpacing: '-0.02em' }],
        'h1':    ['2.25rem',  { lineHeight: '1.15', letterSpacing: '-0.02em' }],
        'h1-xl': ['3.25rem',  { lineHeight: '1.12', letterSpacing: '-0.02em' }],
        'h2':    ['1.875rem', { lineHeight: '1.2',  letterSpacing: '-0.01em' }],
        'h3':    ['1.5rem',   { lineHeight: '1.25' }],
        'body-lg': ['1.125rem', { lineHeight: '1.6' }],
        'body':    ['1rem',     { lineHeight: '1.6' }],
        'body-sm': ['0.875rem', { lineHeight: '1.5' }],
        'caption':  ['0.75rem',   { lineHeight: '1.5' }],
        'overline': ['0.6875rem', { lineHeight: '1.4', letterSpacing: '0.12em' }],
      },
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
