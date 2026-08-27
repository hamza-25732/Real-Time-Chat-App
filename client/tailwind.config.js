/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        canvas: '#faf9fc',
        rail: '#f4f3f7',
        hairline: '#eceaf2',
      },
      boxShadow: {
        pill: '0 12px 32px -12px rgba(76, 29, 149, 0.22), 0 2px 8px -2px rgba(17, 12, 34, 0.08)',
        card: '0 1px 2px rgba(17, 12, 34, 0.04)',
      },
      keyframes: {
        arrive: {
          from: { opacity: '0', transform: 'translateY(4px)' },
        },
      },
      animation: {
        arrive: 'arrive 140ms ease-out',
      },
    },
  },
  plugins: [],
};
