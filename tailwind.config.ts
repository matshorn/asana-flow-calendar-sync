
import type { Config } from "tailwindcss";

const config: Config = {
  // Only dark mode is supported by design, so we disable Tailwind's dark toggling
  darkMode: false,
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      fontFamily: {
        serif: ['Georgia', 'Cambria', 'Times New Roman', 'Times', 'serif'],
        sans: ['Georgia', 'Cambria', 'Times New Roman', 'Times', 'serif'], // Override default sans to use serif
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        asana: {
          purple: '#796eff',
          dark: '#222222', // Changed to dark grey
          light: '#f6f8f9',
          green: '#25e8c8',
          orange: '#fd7e42',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
        },
        grey: {
          100: '#f0f0f0',
          200: '#e0e0e0',
          300: '#d0d0d0',
          400: '#b0b0b0',
          500: '#909090',
          600: '#707070',
          700: '#505050',
          800: '#333333',
          900: '#1a1a1a',
          950: '#0f0f0f',
        }
      },
      backgroundImage: {
        'subtle-grid': 'linear-gradient(rgba(200, 200, 200, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(200, 200, 200, 0.05) 1px, transparent 1px)',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'task-drag': {
          '0%': { transform: 'scale(1)', boxShadow: '0 0 0 rgba(0, 0, 0, 0)' },
          '100%': { transform: 'scale(1.02)', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'task-drag': 'task-drag 0.2s ease-out forwards',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config satisfies Config;
