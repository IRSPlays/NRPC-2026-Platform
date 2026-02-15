/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'cmd-dark': '#09090b',
        'cmd-red': '#ef4444',
        'cmd-green': '#22c55e',
        'cmd-gray': '#27272a',
      },
      fontFamily: {
        mono: ['monospace'],
      }
    },
  },
  plugins: [],
}
