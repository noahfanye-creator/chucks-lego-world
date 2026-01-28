/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        'fredoka': ['Fredoka', 'sans-serif'],
        'nunito': ['Nunito', 'sans-serif'],
        'pixel': ['"Press Start 2P"', 'cursive'],
      },
      colors: {
        lego: {
          red: '#D32F2F',
          'red-dark': '#B71C1C',
          yellow: '#FBC02D',
          'yellow-dark': '#F57F17',
          blue: '#1976D2',
          'blue-dark': '#0D47A1',
          green: '#388E3C',
          'green-dark': '#1B5E20',
          black: '#212121',
          white: '#FFFFFF',
          gray: '#F5F5F5',
          'gray-dark': '#9E9E9E',
        },
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
          DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
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
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        'lego': '12px',
        xl: "calc(var(--radius) + 4px)",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xs: "calc(var(--radius) - 6px)",
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        'lego': '0 8px 0 0 rgba(0,0,0,0.2), 0 15px 20px rgba(0,0,0,0.15)',
        'lego-hover': '0 12px 0 0 rgba(0,0,0,0.2), 0 20px 30px rgba(0,0,0,0.2)',
        'lego-active': '0 4px 0 0 rgba(0,0,0,0.2), 0 8px 12px rgba(0,0,0,0.15)',
        'lego-inset': 'inset 0 4px 8px rgba(0,0,0,0.15)',
        'glow-red': '0 0 20px rgba(211, 47, 47, 0.5)',
        'glow-yellow': '0 0 20px rgba(251, 192, 45, 0.5)',
        'glow-blue': '0 0 20px rgba(25, 118, 210, 0.5)',
        'glow-green': '0 0 20px rgba(56, 142, 60, 0.5)',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "caret-blink": {
          "0%,70%,100%": { opacity: "1" },
          "20%,50%": { opacity: "0" },
        },
        "bounce-in": {
          "0%": { transform: "scale(0) rotate(-180deg)", opacity: "0" },
          "50%": { transform: "scale(1.1) rotate(10deg)" },
          "70%": { transform: "scale(0.95) rotate(-5deg)" },
          "100%": { transform: "scale(1) rotate(0deg)", opacity: "1" },
        },
        "drop-in": {
          "0%": { transform: "translateY(-100px)", opacity: "0" },
          "60%": { transform: "translateY(10px)" },
          "80%": { transform: "translateY(-5px)" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "wiggle": {
          "0%, 100%": { transform: "rotate(-3deg)" },
          "50%": { transform: "rotate(3deg)" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 5px currentColor" },
          "50%": { boxShadow: "0 0 20px currentColor, 0 0 40px currentColor" },
        },
        "shine": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "stamp": {
          "0%": { transform: "translateY(-50px) scale(1.2)", opacity: "0" },
          "50%": { transform: "translateY(5px) scale(0.95)" },
          "100%": { transform: "translateY(0) scale(1)", opacity: "1" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "caret-blink": "caret-blink 1.25s ease-out infinite",
        "bounce-in": "bounce-in 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards",
        "drop-in": "drop-in 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
        "float": "float 3s ease-in-out infinite",
        "wiggle": "wiggle 0.5s ease-in-out",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "shine": "shine 3s linear infinite",
        "stamp": "stamp 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
