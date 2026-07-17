/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      /* `xs` was 420px, which is wider than most phones — every `xs:` rule was
         dead on a 360/375px handset, silently deleting content (the header's
         address text) rather than adapting it. 380px is the real divide: below
         it sits the 360px Android floor, above it the 390-430px iPhones. */
      screens: { xs: '380px' },
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
      /* The mobile type floor, as real utilities. Ad-hoc `text-[10px]` and
         `text-[11px]` were scattered over prices, weights, nav labels and the
         "Deliver to" line — none of it legible at arm's length. Named steps so
         the floor is something you pick, not something you remember.
         (`text-[var(--fs-*)]` can't work: Tailwind reads a bare var() in
         `text-` as a colour and emits `color`, silently killing the size.) */
      fontSize: {
        micro: ['11px', { lineHeight: '1.25' }], // badges only, never a sentence
        xs2: ['12px', { lineHeight: '1.35' }], // secondary labels — the real floor
        sm2: ['13px', { lineHeight: '1.4' }],
        base2: ['14px', { lineHeight: '1.5' }], // body on mobile
        md2: ['16px', { lineHeight: '1.5' }], // inputs — under this iOS zooms on focus
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
