import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['var(--font-space-grotesk)', 'sans-serif'],
        sans: ['var(--font-inter)', 'sans-serif'],
        heading: ['var(--font-space-grotesk)', 'sans-serif'],
        mono: ['var(--font-inter)', 'monospace'],
      },
      colors: {
        brand: {
          dark: '#0B0B0B',
          white: '#FFFFFF',
          gold: '#C8A86B',
          'gold-light': '#E0C98A',
          'gold-deep': '#B8943A',
          surface: '#F8F8F8',
          cream: '#F9F6EF',
          'green-deep': '#064E3B',
          'green-mid': '#065F46',
          'green-accent': '#10B981',
          glass: 'rgba(255,255,255,0.18)',
          'glass-dark': 'rgba(18,18,18,0.65)',
          mavadda: '#C8A86B',
          mahabba: '#10B981',
        },
      },
      fontSize: {
        'display': ['4.5rem', { lineHeight: '1.0', letterSpacing: '-0.03em', fontWeight: '800' }],
        'h1': ['3rem', { lineHeight: '1.05', letterSpacing: '-0.025em', fontWeight: '700' }],
        'h2': ['2rem', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '700' }],
        'h3': ['1.5rem', { lineHeight: '1.2', letterSpacing: '-0.015em', fontWeight: '600' }],
        'h4': ['1.125rem', { lineHeight: '1.3', letterSpacing: '-0.01em', fontWeight: '600' }],
        'body-lg': ['1rem', { lineHeight: '1.7' }],
        'body': ['0.875rem', { lineHeight: '1.65' }],
        'caption': ['0.75rem', { lineHeight: '1.5' }],
        'micro': ['0.625rem', { lineHeight: '1.4', letterSpacing: '0.08em' }],
      },
      spacing: {
        'section': '6rem',
        'section-sm': '4rem',
        'card-gap': '1.5rem',
        'content': '1.5rem',
        'content-lg': '2rem',
      },
      borderRadius: {
        '28': '28px',
        '32': '32px',
        '40': '40px',
        'card': '28px',
        'button': '9999px',
      },
      boxShadow: {
        luxury: '0 20px 40px -15px rgba(0,0,0,0.07), 0 0 20px -5px rgba(200,168,107,0.15)',
        'luxury-dark': '0 25px 50px -12px rgba(0,0,0,0.6), 0 0 25px -5px rgba(200,168,107,0.2)',
        glass: '0 8px 32px 0 rgba(0,0,0,0.08)',
        'gold-glow': '0 0 30px -8px rgba(200,168,107,0.5)',
        'card-hover': '0 32px 64px -20px rgba(0,0,0,0.12), 0 0 40px -10px rgba(200,168,107,0.25)',
        'print': '0 2px 8px rgba(0,0,0,0.15)',
        'badge': '0 2px 6px rgba(0,0,0,0.1)',
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #C8A86B 0%, #E0C98A 50%, #B8943A 100%)',
        'dark-gradient': 'linear-gradient(135deg, #0B0B0B 0%, #1a1a1a 100%)',
        'cream-gradient': 'linear-gradient(135deg, #F9F6EF 0%, #F0EAD6 100%)',
        'green-gradient': 'linear-gradient(135deg, #064E3B 0%, #065F46 100%)',
      },
    },
  },
  plugins: [],
};

export default config;
