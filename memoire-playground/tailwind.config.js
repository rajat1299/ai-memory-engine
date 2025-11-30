/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: '#FBF9F6',
        text: '#2B2622',
        accent: {
          DEFAULT: '#DF6C25', // Bright Terracotta
          foreground: '#FBF9F6',
        },
        card: '#FFFFFF',
        secondary: '#F0EFEA',
        muted: {
          DEFAULT: '#EBE9E4',
          foreground: '#766E66',
        },
        border: '#E3DFDA',
      },
      fontFamily: {
        display: ['Fraunces', 'serif'],
        body: ['Space Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
