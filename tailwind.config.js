/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: { 950: '#050914', 900: '#0a1020', 800: '#0f1830', 700: '#17233f' },
        electric: '#2f6bff',
        cyan: { DEFAULT: '#22d3ee', 400: '#22d3ee', 300: '#67e8f9' },
        purple: { DEFAULT: '#8b5cf6', 300: '#c4b5fd', 400: '#a78bfa' },
      },
      fontFamily: { sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'] },
      keyframes: {
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-14px)' } },
        fadeUp: { '0%': { opacity: '0', transform: 'translateY(12px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        fadeUp: 'fadeUp .5s ease-out both',
      },
    },
  },
  plugins: [],
};
