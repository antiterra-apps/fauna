import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    fontFamily: {
      serif: ['var(--font-fraunces, serif)'],
      'libre-baskerville': ['var(--font-libre-baskerville, serif)'],
      alegreya: ['var(--font-alegreya, serif)'],
      sans: ['Helvetica', 'Arial', 'sans-serif'],
    },
    extend: {},
  },
  plugins: [],
}
export default config
