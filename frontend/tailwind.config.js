/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Warm twilight palette — feels like old photographs
        surface: {
          DEFAULT: '#0F0F10',
          secondary: '#1A1A1C',
          tertiary: '#252528',
          elevated: '#2D2D31',
        },
        ink: {
          DEFAULT: '#FAFAF9',
          secondary: '#A3A3A0',
          tertiary: '#6B6B68',
          faint: '#454543',
        },
        amber: {
          DEFAULT: '#E8C4A2',
          muted: '#D4A574',
          deep: '#B8956A',
        },
        sage: {
          DEFAULT: '#86C095',
          muted: '#6BA077',
        },
        rose: {
          soft: '#D4A5A5',
        },
      },
      fontFamily: {
        sans: ['Satoshi', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'soft': '0 2px 8px rgba(0, 0, 0, 0.15)',
        'glow': '0 0 20px rgba(232, 196, 162, 0.15)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
    },
  },
  plugins: [],
}

