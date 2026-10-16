/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0B0D0F',
        card: '#15191D',
        surface: '#20252A',
        border: '#2A3038',
        accent: {
          DEFAULT: '#B8FF3B',
          dark: '#7BC70F',
          muted: 'rgba(184, 255, 59, 0.15)',
        },
        text: {
          primary: '#F5F7FA',
          secondary: '#9AA4AF',
          muted: '#5D6A77',
        },
        error: '#FF5D67',
        success: '#2ECC71',
        warning: '#F39C12',
        info: '#3498DB',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.25rem',
        '3xl': '1.5rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'pulse-accent': 'pulseAccent 2s ease-in-out infinite',
        'shimmer': 'shimmer 1.5s infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(-16px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        pulseAccent: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(184, 255, 59, 0)' },
          '50%': { boxShadow: '0 0 20px 4px rgba(184, 255, 59, 0.25)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      backgroundImage: {
        'accent-gradient': 'linear-gradient(135deg, #B8FF3B, #7BC70F)',
        'card-gradient': 'linear-gradient(135deg, #15191D, #20252A)',
        'hero-gradient': 'radial-gradient(ellipse at top, rgba(184, 255, 59, 0.15) 0%, transparent 60%)',
        'shimmer-gradient': 'linear-gradient(90deg, #20252A 25%, #2A3038 50%, #20252A 75%)',
      },
      boxShadow: {
        'accent': '0 0 20px rgba(184, 255, 59, 0.3)',
        'card': '0 4px 24px rgba(0, 0, 0, 0.4)',
        'card-hover': '0 8px 32px rgba(0, 0, 0, 0.6)',
        'inner-accent': 'inset 0 0 20px rgba(184, 255, 59, 0.05)',
      },
    },
  },
  plugins: [],
}
