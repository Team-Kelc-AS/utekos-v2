import { productImage } from '@/lib/products/productImage'
import type { ProductImage as Image } from '@/lib/shopify/product-types'
import comfyrobeDesktop002 from '@/assets/products/comfyrobe/Comfyrobe-002.webp'
import comfyrobeDesktop0003 from '@/assets/products/comfyrobe/Comfyrobe-0003.webp'
import comfyrobeDesktop004 from '@/assets/products/comfyrobe/Comfyrobe-004.webp'
import comfyrobeSherpa from '@/assets/products/comfyrobe/Sherpa.webp'

const COMFYROBE_DESKTOP_STILL_WIDTH = 1400
const COMFYROBE_DESKTOP_STILL_HEIGHT = 1800
const COMFYROBE_SHERPA_STILL_WIDTH = 1666
const COMFYROBE_SHERPA_STILL_HEIGHT = 2142
const COMFYROBE_MOBILE_STILL_WIDTH = 1000
const COMFYROBE_MOBILE_STILL_HEIGHT = 1500

export const COMFYROBE_PRODUCT_GALLERY_IMAGES: Image[] = [
  productImage(
    'comfyrobe-desktop-still-002',
    comfyrobeDesktop002,
    'Marineblå Comfyrobe i full lengde forfra med hette.',
    COMFYROBE_DESKTOP_STILL_WIDTH,
    COMFYROBE_DESKTOP_STILL_HEIGHT
  ),
  productImage(
    'comfyrobe-desktop-still-0003',
    comfyrobeDesktop0003,
    'Marineblå Comfyrobe i full lengde forfra med synlig merkelapp.',
    COMFYROBE_DESKTOP_STILL_WIDTH,
    COMFYROBE_DESKTOP_STILL_HEIGHT
  ),
  productImage(
    'comfyrobe-desktop-still-004',
    comfyrobeDesktop004,
    'Marineblå Comfyrobe i full lengde bakfra.',
    COMFYROBE_DESKTOP_STILL_WIDTH,
    COMFYROBE_DESKTOP_STILL_HEIGHT
  ),
  productImage(
    'comfyrobe-desktop-still-sherpa',
    comfyrobeSherpa,
    'Kremfarget sherpa-fôr mot mørk bakgrunn.',
    COMFYROBE_SHERPA_STILL_WIDTH,
    COMFYROBE_SHERPA_STILL_HEIGHT
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
