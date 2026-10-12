import localFont from 'next/font/local'

/**
 * Same Google Sans Flex 4.005, with the 120pt optical variant baked in.
 * All characters and weights are retained; unused axes no longer travel
 * in separate Latin, math and symbol files. See assets/fonts/README.md.
 */
export const googleSansFlex = localFont({
  src: '../assets/fonts/GoogleSansFlex120pt-Variable.woff2',
  weight: '1 1000',
  style: 'normal',
  display: 'swap',
  preload: true,
  adjustFontFallback: false,
  fallback: ['ui-sans-serif', 'system-ui', 'sans-serif'],
  variable: '--font-google-sans-flex'
})
