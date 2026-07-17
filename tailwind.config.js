/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // xs:420px — declared in every HTML file's inline tailwind.config
      screens: { xs: '420px' },
      // Exact palette from HTML/assets/css/styles.css :root
      colors: {
        brand: {
          dark: '#1E6B34',
          green: '#4CAF50',
          light: '#A5D76E',
          gold: '#FFD243',
        },
        'green-900': '#134E29',
        'green-800': '#1E6B34',
        'green-700': '#2E8B43',
        'green-600': '#4CAF50',
        'green-500': '#66BB6A',
        'leaf-400': '#A5D76E',
        'leaf-100': '#E8F5DC',
        cream: '#F6FAF1',
        'cream-2': '#EEF6E6',
        ink: '#13301C',
        'ink-soft': '#3C5446',
        mustard: '#FFD243',
        coral: '#EF5B4C',
        line: '#E1EDD6',
      },
      fontFamily: {
        sans: ['Poppins', 'Plus Jakarta Sans', 'sans-serif'],
        display: ['Poppins', 'Bricolage Grotesque', 'sans-serif'],
      },
      borderRadius: { DEFAULT: '16px' },
      boxShadow: {
        sm: '0 2px 8px rgba(30,107,52,.06)',
        DEFAULT: '0 10px 30px rgba(30,107,52,.10)',
        lg: '0 24px 60px rgba(30,107,52,.16)',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
