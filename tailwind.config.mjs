/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        void: '#000000',
        bone: '#ffffff',
        'ash-gray': '#9a9a9a',
        'silver-mist': '#bdbdbd',
        'electric-iris': {
          DEFAULT: '#8052ff',
          hover: '#6f3ee8',
          glow: 'rgba(128, 82, 255, 0.25)',
        },
        'saffron-spark': {
          DEFAULT: '#ffb829',
          glow: 'rgba(255, 184, 41, 0.25)',
        },
        'deep-verdant': {
          DEFAULT: '#15846e',
          glow: 'rgba(21, 132, 110, 0.25)',
        },
        'tangerine-dream': '#ff5722',
        'slate-gray': '#1e2024',
        'cream': '#f8f4eb',
        'void-black': '#0c0a09',
        primary: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8052ff',
          600: '#6f3ee8',
          700: '#5b21b6',
          800: '#4c1d95',
          900: '#2e1065',
        },
      },
      letterSpacing: {
        monolithic: '-0.04em',
        label: '0.025em',
      },
      borderRadius: {
        '24': '24px',
      },
    },
  },
  plugins: [],
}

