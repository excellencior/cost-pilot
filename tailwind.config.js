/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#8C7851',
          50: '#FBF9F4',
          100: '#F4EFE0',
          200: '#E9DFC2',
          300: '#D9C698',
          400: '#C5A059',
          500: '#B08D4D',
          600: '#8C7851',
          700: '#6F5F40',
          800: '#52462F',
          900: '#352D1E',
        },
        'brand-base-light': '#FAF9F6',
        'brand-base-dark': '#12100E',
        'brand-surface-light': '#FFFFFF',
        'brand-surface-dark': '#1C1917',
        secondary: '#C5A059',
      }
    },
  },
  plugins: [],
}

