/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        'inter': ['Inter', 'sans-serif'],
        'sf-pro': ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'sans-serif']
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'bounce-gentle': 'bounceGentle 0.6s ease-out',
        'scroll': 'scroll 40s linear infinite',
        'float': 'float 3s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 3s linear infinite',
        'bounce-slow': 'bounce 3s infinite',
        'fade-in-up': 'fadeInUp 0.6s ease-out',
        'fade-in-down': 'fadeInDown 0.6s ease-out',
        'slide-in-right': 'slideInRight 0.6s ease-out',
        'slide-in-left': 'slideInLeft 0.6s ease-out',
        'scale-in': 'scaleIn 0.4s ease-out',
        'wiggle': 'wiggle 1s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        bounceGentle: {
          '0%, 20%, 53%, 80%, 100%': { transform: 'translate3d(0,0,0)' },
          '40%, 43%': { transform: 'translate3d(0,-8px,0)' },
          '70%': { transform: 'translate3d(0,-4px,0)' },
          '90%': { transform: 'translate3d(0,-2px,0)' }
        },
        scroll: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' }
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' }
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        fadeInDown: {
          '0%': { opacity: '0', transform: 'translateY(-30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' }
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' }
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' }
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' }
        }
      },
      backdropBlur: {
        'glass': '12px'
      },
      backgroundImage: {
        'linear-to-tr': 'linear-gradient(to top right, var(--tw-gradient-stops))',
        'linear-to-b': 'linear-gradient(to bottom, var(--tw-gradient-stops))',
        'linear-to-tl': 'linear-gradient(to top left, var(--tw-gradient-stops))',
      },
      boxShadow: {
        'xs': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      }
    },
  },
  plugins: [
    function({ addUtilities }) {
      const newUtilities = {
        '.mask-b-from-20\\%': {
          '-webkit-mask-image': 'linear-gradient(to bottom, rgba(0,0,0,1) 20%, rgba(0,0,0,0) 90%)',
          'mask-image': 'linear-gradient(to bottom, rgba(0,0,0,1) 20%, rgba(0,0,0,0) 90%)',
        },
        '.mask-b-to-90\\%': {
          '-webkit-mask-image': 'linear-gradient(to bottom, rgba(0,0,0,1) 20%, rgba(0,0,0,0) 90%)',
          'mask-image': 'linear-gradient(to bottom, rgba(0,0,0,1) 20%, rgba(0,0,0,0) 90%)',
        },
        '.mask-r-from-50\\%': {
          '-webkit-mask-image': 'linear-gradient(to right, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 90%)',
          'mask-image': 'linear-gradient(to right, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 90%)',
        },
        '.mask-r-to-90\\%': {
          '-webkit-mask-image': 'linear-gradient(to right, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 90%)',
          'mask-image': 'linear-gradient(to right, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 90%)',
        },
        '.mask-l-from-50\\%': {
          '-webkit-mask-image': 'linear-gradient(to left, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 90%)',
          'mask-image': 'linear-gradient(to left, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 90%)',
        },
        '.mask-l-to-90\\%': {
          '-webkit-mask-image': 'linear-gradient(to left, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 90%)',
          'mask-image': 'linear-gradient(to left, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 90%)',
        }
      }
      addUtilities(newUtilities)
    }
  ],
}