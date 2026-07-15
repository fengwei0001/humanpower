import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          green: '#21B443',
          'green-dark': '#119530',
          'green-light': '#A1E5B1',
          'green-surface': '#E9FBED',
          purple: '#882EFF',
          'purple-light': '#DEC8FF',
          'purple-surface': '#F4F0F7',
          gold: '#F5C800',
          'gold-light': '#FFF6B8',
          orange: '#E46509',
          blue: '#468DFB',
        },
        surface: {
          DEFAULT: '#F7F9FA',
          card: '#FFFFFF',
          hover: '#F3F5F6',
        },
        text: {
          primary: '#111925',
          secondary: 'rgba(17,25,37, 0.55)',
          tertiary: 'rgba(17,25,37, 0.35)',
          inverse: '#FFFFFF',
        },
        border: {
          DEFAULT: 'rgba(17,25,37, 0.06)',
          heavy: 'rgba(17,25,37, 0.12)',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'PingFang SC', 'sans-serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'Fira Code', 'monospace'],
      },
      borderRadius: {
        'card': '26px',
        'btn': '99px',
      },
      boxShadow: {
        'card': '0 2px 24px rgba(17,25,37,0.07)',
        'card-hover': 'inset 0 0 0 3px #a1e5b1',
        'btn': '0 2px 4px rgba(33,180,67,0.2)',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
} satisfies Config
