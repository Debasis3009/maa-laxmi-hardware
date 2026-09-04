import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        charcoal: '#23201B',
        rust: { DEFAULT: '#C6641A', dark: '#A24F13' },
        steel: { green: '#3F6B4A', grey: '#6B6558' },
        gold: '#C99A2E',
        brick: '#B23A2E',
        paper: '#F7F6F3',
        line: '#DEDACE',
      },
      fontFamily: {
        display: ['var(--font-display)', 'sans-serif'],
        body: ['var(--font-body)', 'sans-serif'],
        data: ['var(--font-data)', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '3px',
        sm: '2px',
        md: '4px',
      },
    },
  },
  plugins: [],
};

export default config;
