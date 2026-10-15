import localFont from 'next/font/local'

/**
 * Same Google Sans Flex 4.005, with the 120pt optical variant baked in.
 * Preload common Latin/Norwegian characters; fetch the original full face
 * only for characters outside that subset. Both retain all weights.
 * See assets/fonts/README.md.
 */
const latin = localFont({
  src: '../assets/fonts/GoogleSansFlex120pt-Latin.woff2',
  weight: '1 1000',
  style: 'normal',
  display: 'swap',
  preload: true,
  adjustFontFallback: false,
  fallback: ['var(--font-google-sans-flex-complete)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
  variable: '--font-google-sans-flex'
})

const complete = localFont({
  src: '../assets/fonts/GoogleSansFlex120pt-Variable.woff2',
  weight: '1 1000',
  style: 'normal',
  display: 'swap',
  preload: false,
  adjustFontFallback: false,
  declarations: [{ prop: 'unicode-range', value: 'U+0100-0107,U+010A-0113,U+0116-011B,U+011E-0123,U+0126-012B,U+012E-0130,U+0132-0133,U+0136-0137,U+0139-0148,U+014C-014D,U+0150-0151,U+0154-015B,U+015E-0165,U+0168-017E,U+0181,U+018A,U+018F,U+0198-0199,U+01A0-01A1,U+01AF-01B0,U+01B3-01B4,U+01CD-01CE,U+0218-021B,U+0237,U+0253,U+0257,U+0259,U+02C7,U+02D8-02D9,U+02DB,U+02DD,U+02E3,U+03BC,U+0E3F,U+1E44-1E45,U+1E62-1E63,U+1E80-1E85,U+1E9E,U+1EA0-1EF9,U+2070,U+2074-2079,U+207B,U+2080-2089,U+20A9,U+20B9,U+20C1,U+221A,U+2248,U+2260,U+2264-2265,U+25CC,U+2780-2788,U+278A-2792,U+E000-E006,U+FB00-FB04,U+1D6E1' }],
  variable: '--font-google-sans-flex-complete'
})

export const googleSansFlex = {
  ...latin,
  variable: `${complete.variable} ${latin.variable}`
}
