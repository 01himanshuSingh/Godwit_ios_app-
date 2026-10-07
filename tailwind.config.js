/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        godwit: {
          forest: '#1B2915',
          sand: '#D8CDB8',
          background: '#EDECEA',
          card: '#F7F6F4',
          surface: '#DEDBD4',
          border: '#D4D0C8',
          muted: '#5C6658',
          accent: '#3D4F38',
          foreground: '#F7F6F4',
        },
      },
    },
  },
  plugins: [],
};
