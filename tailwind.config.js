/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0D7377',
          light: '#14FFEC',
          dark: '#0A5A5D',
        },
        accent: '#FF6B6B',
        dark: {
          bg: '#0A0A0A',
          card: '#141414',
          border: '#1F1F1F',
        },
        light: {
          bg: '#FAFAFA',
          card: '#FFFFFF',
          border: '#E5E5E5',
        },
      },
      fontFamily: {
        heading: ['Space Grotesk', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px #14FFEC, 0 0 10px #14FFEC' },
          '100%': { boxShadow: '0 0 20px #14FFEC, 0 0 30px #14FFEC' },
        },
      },
    },
  },
  plugins: [],
}