import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/*/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Professional Monochrome Palette
        surface: '#FFFFFF',
        'surface-subtle': '#FAFAFA',
        'surface-muted': '#F5F5F5',
        'surface-dim': '#F0F0F0',
        'surface-bright': '#FFFFFF',
        'surface-container-lowest': '#FFFFFF',
        'surface-container-low': '#FAFAFA',
        'surface-container': '#F5F5F5',
        'surface-container-high': '#EBEBEB',
        'surface-container-highest': '#E0E0E0',
        'on-surface': '#111111',
        'on-surface-variant': '#666666',
        'outline': '#D4D4D8',
        'outline-variant': '#E4E4E7',
        'border-default': '#E5E5E5',
        'border-subtle': '#EEEEEE',
        'border-strong': '#111111',
        'brand-base': '#111111',

        // Primary Buttons & Accents (Solid Black)
        primary: '#111111',
        'primary-container': '#111111',
        'on-primary': '#FFFFFF',
        'on-primary-container': '#FFFFFF',

        // Restrained Semantic Accents
        secondary: '#059669', // Emerald-600
        'secondary-container': '#ECFDF5', // Emerald-50
        'on-secondary': '#065F46', // Emerald-800
        
        tertiary: '#D97706', // Amber-600
        'tertiary-container': '#FFFBEB', // Amber-50
        'on-tertiary': '#92400E', // Amber-800

        error: '#E11D48', // Rose-600
        'error-container': '#FFF1F2', // Rose-50
        'on-error': '#9F1239', // Rose-800
      },
      fontFamily: {
        sans: ['Geist', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
        headline: ['Space Grotesk', 'Geist', 'sans-serif'],
        tactical: ['JetBrains Mono', 'monospace'],
      },
      spacing: {
        'space-xs': '0.25rem',
        'space-sm': '0.5rem',
        'space-md': '1rem',
        'space-lg': '1.5rem',
        'space-xl': '2.5rem',
        gutter: '1rem',
        'gutter-lg': '1.5rem',
        margin: '1rem',
        'margin-md': '1.5rem',
        'margin-lg': '2rem',
      },
      boxShadow: {
        subtle: '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
        card: '0 1px 3px 0 rgba(0, 0, 0, 0.06), 0 1px 2px -1px rgba(0, 0, 0, 0.04)',
        elevated: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
      },
    },
  },
  plugins: [],
};

export default config;
