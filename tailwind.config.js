/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Midnight Navy (primary)
        navy: { 950: '#0B1220', 900: '#0F172A', 800: '#1E293B', 700: '#334155' },
        // Royal Blue (secondary)
        electric: { DEFAULT: '#2563EB', dark: '#1D4ED8', soft: '#EFF6FF' },
        // Emerald Green (accent)
        brand: { DEFAULT: '#10B981', dark: '#047857', soft: '#ECFDF5' },
        canvas: '#F8FAFC',
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans Thai', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(15,23,42,.04), 0 4px 16px -6px rgba(15,23,42,.08)',
        lift: '0 2px 4px rgba(15,23,42,.04), 0 16px 32px -12px rgba(15,23,42,.18)',
      },
      keyframes: {
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-10px)' } },
        fadeUp: { '0%': { opacity: '0', transform: 'translateY(12px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
      },
      animation: {
        float: 'float 8s ease-in-out infinite',
        fadeUp: 'fadeUp .5s ease-out both',
      },
    },
  },
  plugins: [],
};
