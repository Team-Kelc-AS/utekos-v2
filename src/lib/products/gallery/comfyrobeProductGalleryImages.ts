import { productImage } from '@/lib/products/productImage'
import type { ProductImage as Image } from '@/lib/shopify/product-types'

export const COMFYROBE_PRODUCT_GALLERY_IMAGES: Image[] = [
  productImage(
    'comfyrobe-desktop-145-2222',
    '/images/kunnskap/Comfyrobe_145_2222.webp',
    'Marineblå Comfyrobe forfra mot mørk bakgrunn, med Comfyrobe- og Utekos-logo.',
    1350,
    1688
  ),
  productImage(
    'comfyrobe-desktop-1440x1800-2',
    '/images/kunnskap/Comfyrobe_1440x1800-2.webp',
    'Kvinne i marineblå Comfyrobe med hetten oppe og hendene i lommene.',
    720,
    900
  )
]

// Preserve each original image's dimensions and the selected mobile order.
export const COMFYROBE_MOBILE_GALLERY_IMAGES: Image[] = [
  productImage(
    'comfyrobe-mobile-male',
    '/images/kunnskap/Comfy_Male_1200x1800.webp',
    'Mann i marineblå Comfyrobe sett forfra, med hetten nede og hendene i lommene.',
    1200,
    1800
  ),
  productImage(
    'comfyrobe-mobile-woman-2',
    '/images/kunnskap/Comfy_Woman_2_2x3.webp',
    'Kvinne i marineblå Comfyrobe med hetten oppe og hendene i lommene, sett skrått forfra.',
    1024,
    1536
  ),
  productImage(
    'comfyrobe-mobile-woman',
    '/images/kunnskap/Comfy_Woman_1200x1800.webp',
    'Kvinne i marineblå Comfyrobe sett fra siden, med hetten nede og synlig splitt nederst.',
    1120,
    1680
  ),
  productImage(
    'comfyrobe-mobile-navy-front-closed',
    '/images/kunnskap/Jakke Navy_1.webp',
    'Marineblå Comfyrobe sett forfra med lukket glidelås og lyst fôr i hetten.',
    2000,
    3000
  ),
  productImage(
    'comfyrobe-mobile-navy-back-3',
    '/images/kunnskap/Jakke Navy_3.webp',
    'Marineblå Comfyrobe sett bakfra med hetten nede og avrundet nederkant.',
    2000,
    3000
  ),
  productImage(
    'comfyrobe-mobile-navy-front-open',
    '/images/kunnskap/Jakke Navy.webp',
    'Marineblå Comfyrobe sett forfra med åpen hals, lyst hettefôr og synlig Comfyrobe-merke på innsiden.',
    2000,
    3000
  )
]
