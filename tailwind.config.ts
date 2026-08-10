import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy:    { DEFAULT: '#075290', dark: '#0D2450' },
        brand:   { DEFAULT: '#1F4FA8', mid: '#2E6DD4', light: '#4A8FE8' },
        cyan:    '#4BAEE8',

        // Premium dark enterprise theme tokens
        dark: {
          bg:      '#0A0E1A',
          surface: '#10162A',
          card:    '#141B33',
          border:  'rgba(255,255,255,0.08)',
          muted:   '#8B93B0',
        },
        neon: {
          blue:  '#3B82F6',
          glow:  '#60A5FA',
          cyan:  '#22D3EE',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'var(--font-geist-sans)', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '20': '20px',
      },
      boxShadow: {
        'glow-blue': '0 0 24px 0 rgba(59,130,246,0.35)',
        'glow-blue-sm': '0 0 12px 0 rgba(59,130,246,0.25)',
        'glass': '0 8px 32px 0 rgba(0,0,0,0.35)',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
export default config