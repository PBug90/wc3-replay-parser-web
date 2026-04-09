/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        'surface-hi': 'var(--surface-hi)',
        border: {
          DEFAULT: 'var(--border)',
          hi: 'var(--border-hi)',
        },
        foreground: 'var(--text)',
        muted: 'var(--muted)',
        accent: {
          DEFAULT: 'var(--accent)',
          lo: 'var(--accent-lo)',
        },
        gold: {
          DEFAULT: 'var(--gold)',
          hi: 'var(--gold-hi)',
          lo: 'var(--gold-lo)',
        },
      },
      fontFamily: {
        display: ['Cinzel', 'serif'],
        'cinzel-deco': ['Cinzel', 'serif'],
        sans: ['ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
