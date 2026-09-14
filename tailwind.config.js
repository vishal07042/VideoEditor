/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
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
        // Award-site vibrant paper + ink system (landing only, editor untouched)
        paper: '#FFF6E9',
        cream: '#FFFBF2',
        paperlight: '#FFFBF4',
        peach: '#FFE8D3',
        sand: '#F6EEE1',
        ember: '#FF5A00',
        emberdeep: '#C74E00',
        ink: '#211407',
        coco: '#2A1D12',
        tang: '#FF4D00',
        tangdeep: '#D63A00',
        grape: '#7C3AED',
        grapedeep: '#5B21B6',
        limey: '#D9F450',
        sunny: '#FFC700',
        bubbly: '#FF7AD9',
        skyy: '#7DD3FC',
        minty: '#A7F3D0',
      },
      fontFamily: {
        accent: ['"Instrument Serif"', 'Georgia', 'serif'],
        display: ['"Bricolage Grotesque"', '"Space Grotesk"', 'system-ui', 'sans-serif'],
        body: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        hand: ['Caveat', 'cursive'],
      },
      boxShadow: {
        hard: '5px 5px 0 0 #1B130C',
        'hard-sm': '3px 3px 0 0 #1B130C',
        'hard-lg': '8px 8px 0 0 #1B130C',
        'hard-tang': '5px 5px 0 0 #FF4D00',
        pop: '0 24px 70px -24px rgba(27,19,12,0.35)',
      },
      keyframes: {
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        marquee: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
        floaty: {
          '0%, 100%': { transform: 'translateY(0) rotate(var(--fl-rot, 0deg))' },
          '50%': { transform: 'translateY(-12px) rotate(var(--fl-rot, 0deg))' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
        'spin-slow': {
          to: { transform: 'rotate(360deg)' },
        },
        popshake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%': { transform: 'translateX(-8px)' },
          '40%': { transform: 'translateX(8px)' },
          '60%': { transform: 'translateX(-5px)' },
          '80%': { transform: 'translateX(5px)' },
        },
      },
      animation: {
        'pulse-soft': 'pulse-soft 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        marquee: 'marquee 22s linear infinite',
        'marquee-fast': 'marquee 14s linear infinite',
        floaty: 'floaty 4.5s ease-in-out infinite',
        wiggle: 'wiggle 1.6s ease-in-out infinite',
        'spin-slow': 'spin-slow 14s linear infinite',
        popshake: 'popshake 0.45s ease-in-out',
      },
    },
  },
  plugins: [],
}
