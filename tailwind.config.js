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
        neo: {
          void: '#0B0C10',       // Deep background
          surface: '#1F2833',    // Card surface
          slate: '#C5C6C7',      // Text
          cyan: '#66FCF1',       // High-tech glow
          cyanDark: '#45A29E',   // Dimmed tech
          amber: '#FFB300',      // Fossil highlight
        },
        primary: {
          DEFAULT: '#66FCF1',
          light: '#66FCF1',
          dark: '#45A29E',
        },
        accent: '#FFB300',
        dark: {
          bg: '#0B0C10',
          card: '#1F2833',
          border: '#45A29E33',
        },
        light: {
          bg: '#F5F5F5',
          card: '#FFFFFF',
          border: '#E5E5E5',
        },
      },
      fontFamily: {
        heading: ['Space Grotesk', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['Space Mono', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'gradient': 'gradient 15s ease infinite',
        'pulse-subtle': 'pulse-subtle 2s ease-in-out infinite',
        'scan': 'scan 3s linear infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px #66FCF1, 0 0 10px #66FCF1' },
          '100%': { boxShadow: '0 0 20px #66FCF1, 0 0 30px #66FCF1' },
        },
        gradient: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        'pulse-subtle': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        }
      },
    },
  },
  plugins: [],
}