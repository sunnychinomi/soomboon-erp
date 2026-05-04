/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: '#0f1419', 2: '#1f2a3f' },
        mute: '#5d6779',
        paper: { DEFAULT: '#FBFFFE', 2: '#f3f1e8', 3: '#e9e5d4' },
        rule: { DEFAULT: '#e5e1d2', strong: '#c4bfae' },
        // Space Indigo
        indigo: { DEFAULT: '#192A51', dark: '#0d1937', 2: '#22356b', light: '#3a5685' },
        // Soft Steel Blue
        steel: { DEFAULT: '#80A1C1', dark: '#5d83a8', light: '#a8c2db', soft: '#dbe5ef', glow: '#eef3f8' },
        // Deep Rust
        rust: { DEFAULT: '#BA3F1D', dark: '#922e14', light: '#d8623f', soft: '#f0c2af', glow: '#f9e2d6' },
        // Antique Gold
        gold: { DEFAULT: '#B7990D', dark: '#8a7008', light: '#d4b932', 2: '#e8c757', soft: '#f0e1a3', glow: '#faf3d8' },
        // Wine Burgundy
        burgundy: { DEFAULT: '#70161E', dark: '#4f0d14', light: '#9c3037', soft: '#e8c5c9' },
      },
      fontFamily: {
        display: ['Kanit', 'sans-serif'],
        sans: ['Prompt', 'system-ui', 'sans-serif'],
        kanit: ['Kanit', 'sans-serif'],
        prompt: ['Prompt', 'sans-serif'],
        serif: ['Instrument Serif', 'serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(25,42,81,.04), 0 8px 24px rgba(25,42,81,.06)',
        'card-lg': '0 1px 2px rgba(25,42,81,.04), 0 8px 24px rgba(25,42,81,.08), 0 24px 48px rgba(25,42,81,.06)',
      },
      animation: {
        'fade-up': 'fadeUp 0.3s ease-out',
        'pulse-soft': 'pulseSoft 2.5s ease-in-out infinite',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: 0, transform: 'translateY(8px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: 0.6 },
          '50%': { opacity: 1 },
        },
      },
    },
  },
  plugins: [],
};
