/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Montserrat', 'sans-serif'],
      },
      colors: {
        primary: {
          light: '#4ecdc4', // Light teal
          DEFAULT: '#00a3b4', // More blue-teal
          dark: '#007a8c', // Darker blue-teal
        },
        secondary: {
          light: '#f8f9fa',
          DEFAULT: '#e9ecef',
          dark: '#dee2e6',
        },
        accent: {
          light: '#ffb703', // Light amber
          DEFAULT: '#fd9e02', // Amber
          dark: '#fb8500', // Dark amber/orange
        },
        danger: {
          light: '#ff8080',
          DEFAULT: '#ff4d4d',
          dark: '#ff1a1a',
        },
      },
    },
  },
  plugins: [],
} 