/**
 * JunkieFun Tailwind Configuration
 * 
 * Design System: "High-Energy Brutalism"
 * - True black background
 * - Harsh 1px borders, NO shadows, NO rounded corners
 * - Neon accent colors (lime YES, crimson NO, cyan actions)
 * - Monospace numbers, bold sans-serif headlines
 */

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ===== CORE BACKGROUNDS =====
        black: '#000000',           // True black - main background
        
        // Dark grays for cards/borders
        dark: {
          950: '#000000',           // True black
          900: '#0a0a0a',           // Slightly lighter
          800: '#141414',           // Card backgrounds
          700: '#1a1a1a',           // Elevated surfaces
          600: '#262626',           // Borders (main border color)
          500: '#333333',           // Hover borders
          400: '#444444',           // Muted elements
        },

        // ===== ACCENT COLORS =====
        // YES / Bullish - Electric Lime
        yes: {
          DEFAULT: '#39FF14',
          light: '#6FFF4F',
          dark: '#2ACC10',
          muted: 'rgba(57, 255, 20, 0.15)',
          glow: 'rgba(57, 255, 20, 0.5)',
        },

        // NO / Bearish - Neon Crimson
        no: {
          DEFAULT: '#FF3131',
          light: '#FF6B6B',
          dark: '#CC2727',
          muted: 'rgba(255, 49, 49, 0.15)',
          glow: 'rgba(255, 49, 49, 0.5)',
        },

        // Action / Links - Cyber Blue
        cyber: {
          DEFAULT: '#00E0FF',
          light: '#4DEBFF',
          dark: '#00B3CC',
          muted: 'rgba(0, 224, 255, 0.15)',
          glow: 'rgba(0, 224, 255, 0.5)',
        },

        // ===== TEXT COLORS =====
        text: {
          primary: '#FFFFFF',
          secondary: '#A0A0A0',
          muted: '#666666',
          disabled: '#444444',
        },

        // ===== STATUS COLORS =====
        status: {
          active: '#39FF14',        // Green - active markets
          expired: '#FF3131',       // Red - expired
          disputed: '#FFB800',      // Yellow/Orange - disputed
          resolved: '#00E0FF',      // Cyan - resolved
          pending: '#A855F7',       // Purple - pending
        },

        // ===== SPECIAL COLORS =====
        whale: '#FFD700',           // Gold - whale badge
        admin: '#FF00FF',           // Magenta - admin badge
      },

      fontFamily: {
        // Monospace for numbers/prices/data
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
        // Sans-serif for headlines and UI
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        // Bold display font for big headlines
        display: ['Inter', 'system-ui', 'sans-serif'],
      },

      fontSize: {
        // Extra large sizes for "CHANCE" display
        '6xl': ['3.75rem', { lineHeight: '1' }],
        '7xl': ['4.5rem', { lineHeight: '1' }],
        '8xl': ['6rem', { lineHeight: '1' }],
        '9xl': ['8rem', { lineHeight: '1' }],
      },

      // NO border radius - brutalist design
      borderRadius: {
        'none': '0',
        'DEFAULT': '0',
        'sm': '0',
        'md': '0',
        'lg': '0',
        'xl': '0',
        '2xl': '0',
        '3xl': '0',
        'full': '0',
      },

      // NO shadows - brutalist design
      boxShadow: {
        'none': 'none',
        'DEFAULT': 'none',
        'sm': 'none',
        'md': 'none',
        'lg': 'none',
        'xl': 'none',
        '2xl': 'none',
        // Only glow effects for neon elements
        'yes-glow': '0 0 20px rgba(57, 255, 20, 0.5), 0 0 40px rgba(57, 255, 20, 0.3)',
        'no-glow': '0 0 20px rgba(255, 49, 49, 0.5), 0 0 40px rgba(255, 49, 49, 0.3)',
        'cyber-glow': '0 0 20px rgba(0, 224, 255, 0.5), 0 0 40px rgba(0, 224, 255, 0.3)',
        'yes-glow-sm': '0 0 10px rgba(57, 255, 20, 0.4)',
        'no-glow-sm': '0 0 10px rgba(255, 49, 49, 0.4)',
        'cyber-glow-sm': '0 0 10px rgba(0, 224, 255, 0.4)',
      },

      animation: {
        // Neon flicker effect for chance display
        'flicker': 'flicker 2s ease-in-out infinite',
        'flicker-fast': 'flicker 0.5s ease-in-out infinite',
        // Hype flash for trades
        'hype-flash': 'hypeFlash 200ms ease-out',
        'hype-flash-yes': 'hypeFlashYes 200ms ease-out',
        'hype-flash-no': 'hypeFlashNo 200ms ease-out',
        // Scanner line for charts
        'scanner': 'scanner 3s linear infinite',
        // Pulse for live indicators
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        // Ticker scroll
        'ticker': 'ticker 30s linear infinite',
        // Fade in
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },

      keyframes: {
        flicker: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
          '25%, 75%': { opacity: '0.9' },
        },
        hypeFlash: {
          '0%': { borderColor: 'transparent' },
          '50%': { borderColor: 'currentColor' },
          '100%': { borderColor: 'transparent' },
        },
        hypeFlashYes: {
          '0%': { borderColor: '#262626' },
          '50%': { borderColor: '#39FF14' },
          '100%': { borderColor: '#262626' },
        },
        hypeFlashNo: {
          '0%': { borderColor: '#262626' },
          '50%': { borderColor: '#FF3131' },
          '100%': { borderColor: '#262626' },
        },
        scanner: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.7', transform: 'scale(1.05)' },
        },
        ticker: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },

      // Border width for brutalist harsh borders
      borderWidth: {
        'DEFAULT': '1px',
        '0': '0',
        '1': '1px',
        '2': '2px',
      },
    },
  },
  plugins: [],
}