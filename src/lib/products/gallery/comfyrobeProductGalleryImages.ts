import { productImage } from '@/lib/products/productImage'
import type { ProductImage as Image } from '@/lib/shopify/product-types'
const COMFYROBE_MOBILE_STILL_WIDTH = 1000
const COMFYROBE_MOBILE_STILL_HEIGHT = 1500

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

// Mobile gallery uses original 2:3 images only.
export const COMFYROBE_MOBILE_GALLERY_IMAGES: Image[] = [
  productImage(
    'comfyrobe-mobile-1000x1500-mob',
    '/images/kunnskap/Comfy_1000x1500_Mob.webp',
    'Kvinne i marineblå Comfyrobe foran mørkegrønne vegger.',
    COMFYROBE_MOBILE_STILL_WIDTH,
    COMFYROBE_MOBILE_STILL_HEIGHT
  ),
  productImage(
    'comfyrobe-mobile-1000x1500-22',
    '/images/kunnskap/Comfyrobe_1000x1500_22.webp',
    'Marineblå Comfyrobe i full lengde forfra mot mørk bakgrunn.',
    500,
    750
  ),
  productImage(
    'comfyrobe-mobile-1000x1500-2-webp',
    '/images/kunnskap/Comfyrobe_1000x1500_2.webp',
    'Marineblå Comfyrobe forfra med åpen hette og synlig lyst sherpa-fôr.',
    500,
    750
  ),
  productImage(
    'comfyrobe-mobile-11000x1500',
    '/images/kunnskap/Comfyrobe_11000x1500.webp',
    'Kvinne i marineblå Comfyrobe sett fra siden mot mørk bakgrunn.',
    500,
    750
  ),
  productImage(
    'comfyrobe-mobile-1000x1500-1',
    '/images/kunnskap/comfyrobe_1000x1500_1.jpg',
    'Marineblå Comfyrobe i full lengde forfra med hette.',
    COMFYROBE_MOBILE_STILL_WIDTH,
    COMFYROBE_MOBILE_STILL_HEIGHT
  ),
  productImage(
    'comfyrobe-mobile-1000x1500-2',
    '/images/kunnskap/comfyrobe_1000x1500_2.jpg',
    'Marineblå Comfyrobe forfra med åpen hette og synlig sherpa-fôr.',
    COMFYROBE_MOBILE_STILL_WIDTH,
    COMFYROBE_MOBILE_STILL_HEIGHT
  ),
  productImage(
    'comfyrobe-mobile-1000x1500-3',
    '/images/kunnskap/comfyrobe_1000x1500_3.jpg',
    'Person i marineblå Comfyrobe sett fra siden på en terrasse i skumringen.',
    COMFYROBE_MOBILE_STILL_WIDTH,
    COMFYROBE_MOBILE_STILL_HEIGHT
  ),
  productImage(
    'comfyrobe-mobile-1000x1500-bak-1',
    '/images/kunnskap/comfyrobe_1000x1500_bak_1.jpg',
    'Marineblå Comfyrobe i full lengde bakfra.',
    COMFYROBE_MOBILE_STILL_WIDTH,
    COMFYROBE_MOBILE_STILL_HEIGHT
  )
]
