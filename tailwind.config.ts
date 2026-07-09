import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#E11D48', // vibrant crimson rose-600
          hover: '#BE123C',   // rose-700
          light: '#FFE4E6',   // rose-100
        },
        secondary: {
          DEFAULT: '#475569', // slate-600
          hover: '#334155',   // slate-700
          light: '#F1F5F9',   // slate-100
        },
        backgroundLight: '#F8FAFC', // slate-50
        backgroundDark: '#0F172A',  // slate-900
        textPrimary: '#0F172A',     // slate-900
        textSecondary: '#64748B',   // slate-500
        border: '#E2E8F0',          // slate-200
        success: '#10B981',         // emerald-500
        warning: '#F59E0B',         // amber-500
        error: '#EF4444',           // red-500
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0.75rem', // 12px rounded corners
        lg: '1rem',         // 16px rounded corners
        xl: '1.5rem',       // 24px rounded corners
      },
      boxShadow: {
        subtle: '0 2px 8px rgba(15, 23, 42, 0.04), 0 1px 3px rgba(15, 23, 42, 0.02)',
        premium: '0 10px 25px -5px rgba(225, 29, 72, 0.08), 0 8px 16px -6px rgba(225, 29, 72, 0.04)',
        card: '0 4px 20px -2px rgba(15, 23, 42, 0.06), 0 2px 8px -1px rgba(15, 23, 42, 0.03)',
      },
    },
  },
  plugins: [],
};

export default config;
