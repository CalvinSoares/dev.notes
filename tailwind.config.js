/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        retro: {
          bg: 'rgb(var(--rgb-canvas) / <alpha-value>)',
          bgDark: 'rgb(var(--rgb-surface) / <alpha-value>)',
          'bg-dark': 'rgb(var(--rgb-surface) / <alpha-value>)',
          bgDarker: 'rgb(var(--rgb-paper-aged) / <alpha-value>)',
          'bg-darker': 'rgb(var(--rgb-paper-aged) / <alpha-value>)',
          panel: 'rgb(var(--rgb-surface) / <alpha-value>)',
          panelHover: 'rgb(var(--rgb-highlight) / <alpha-value>)',
          'panel-hover': 'rgb(var(--rgb-highlight) / <alpha-value>)',
          border: 'rgb(var(--rgb-ink) / <alpha-value>)',
          text: 'rgb(var(--rgb-ink) / <alpha-value>)',
          textDim: 'rgb(var(--rgb-ink-muted) / <alpha-value>)',
          'text-dim': 'rgb(var(--rgb-ink-muted) / <alpha-value>)',
          comment: 'rgb(var(--rgb-ink-subtle) / <alpha-value>)',
          green: 'rgb(var(--rgb-secondary) / <alpha-value>)',
          orange: 'rgb(var(--rgb-accent) / <alpha-value>)',
          blue: 'rgb(var(--rgb-secondary) / <alpha-value>)',
          pink: 'rgb(var(--rgb-accent) / <alpha-value>)',
          purple: 'rgb(var(--rgb-secondary) / <alpha-value>)',
          yellow: 'rgb(var(--rgb-highlight-ink) / <alpha-value>)',
          red: 'rgb(var(--rgb-danger) / <alpha-value>)',
        },
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Consolas', 'monospace'],
        display: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        code: ['ui-monospace', 'SFMono-Regular', 'Consolas', 'monospace'],
      },
      fontSize: {
        'status': '11px',
        'editor': '14px',
      },
      boxShadow: {
        'retro-inset': '3px 3px 0 0 var(--shadow-soft)',
        paper: 'var(--shadow-paper)',
        'paper-lg': 'var(--shadow-paper-lg)',
      },
      borderRadius: {
        wobbly: '255px 15px 225px 15px / 15px 225px 15px 255px',
        wobblyMd: '18px 255px 22px 210px / 230px 18px 240px 24px',
      },
    },
  },
  plugins: [],
}
