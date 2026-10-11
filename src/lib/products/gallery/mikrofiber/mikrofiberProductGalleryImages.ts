import { productImage } from '@/lib/products/productImage'
import type { ProductImage as Image } from '@/lib/shopify/product-types'
import mikrofiberMobileStill16 from '@/assets/products/mikrofiber/16.webp'
import mikrofiberDesktopStill1 from '@/assets/products/mikrofiber/1.webp'
import mikrofiberDesktopStill2 from '@/assets/products/mikrofiber/2.webp'
import mikrofiberDesktopStill3 from '@/assets/products/mikrofiber/3.webp'
import mikrofiberDesktopStill4 from '@/assets/products/mikrofiber/4.webp'
import mikrofiberDesktopStill5 from '@/assets/products/mikrofiber/5.webp'
import mikrofiberDesktopStill6 from '@/assets/products/mikrofiber/6.webp'
import mikrofiberDesktopStill7 from '@/assets/products/mikrofiber/7.webp'
import mikrofiberDesktopStill8 from '@/assets/products/mikrofiber/8.webp'
import mikrofiberDesktopStill9 from '@/assets/products/mikrofiber/9.webp'
import mikrofiberDesktopStill10 from '@/assets/products/mikrofiber/10.webp'

const MICROFIBER_DESKTOP_STILL_NARROW_WIDTH = 1024
const MICROFIBER_DESKTOP_STILL_NARROW_HEIGHT = 1317
const MICROFIBER_DESKTOP_STILL_WIDE_WIDTH = 2048
const MICROFIBER_DESKTOP_STILL_WIDE_HEIGHT = 2633
const MICROFIBER_DESKTOP_STILL_4_WIDTH = 1048
const MICROFIBER_DESKTOP_STILL_4_HEIGHT = 1347
const MICROFIBER_MOBILE_STILL_16_WIDTH = 800
const MICROFIBER_MOBILE_STILL_16_HEIGHT = 1200
const MICROFIBER_MOBILE_STILL_WIDTH = 1000
const MICROFIBER_MOBILE_STILL_HEIGHT = 1500

export const MICROFIBER_MOBILE_GALLERY_IMAGES: Image[] = [
  productImage(
    'utekos-mikrofiber-mobile-still-16',
    mikrofiberMobileStill16,
    'To kvinner i Utekos Mikrofiber sitter på en stein i skogen.',
    MICROFIBER_MOBILE_STILL_16_WIDTH,
    MICROFIBER_MOBILE_STILL_16_HEIGHT
  ),
  productImage(
    'utekos-mikrofiber-mobile-1000x1500-2',
    '/images/kunnskap/mikrofiber_1000x1500_2.webp',
    'Kvinne i fjellblå Utekos Mikrofiber sitter på en snødekt stein ved solnedgang.',
    MICROFIBER_MOBILE_STILL_WIDTH,
    MICROFIBER_MOBILE_STILL_HEIGHT
  ),
  productImage(
    'utekos-mikrofiber-mobile-1000x1500-3',
    '/images/kunnskap/mikrofiber_1000x1500_3.webp',
    'Fjellblå Utekos Mikrofiber i full lengde forfra.',
    MICROFIBER_MOBILE_STILL_WIDTH,
    MICROFIBER_MOBILE_STILL_HEIGHT
  ),
  productImage(
    'utekos-mikrofiber-mobile-1000x1500-4',
    '/images/kunnskap/mikrofiber_1000x1500_4 (1).webp',
    'Fjellblå Utekos Mikrofiber forfra med nedre del trukket ut.',
    MICROFIBER_MOBILE_STILL_WIDTH,
    MICROFIBER_MOBILE_STILL_HEIGHT
  ),
  productImage(
    'utekos-mikrofiber-mobile-1000x1500-5',
    '/images/kunnskap/mikrofiber_1000x1500_5.webp',
    'Fjellblå Utekos Mikrofiber i full lengde bakfra.',
    MICROFIBER_MOBILE_STILL_WIDTH,
    MICROFIBER_MOBILE_STILL_HEIGHT
  ),
  productImage(
    'utekos-mikrofiber-mobile-1000x1500-6',
    '/images/kunnskap/mikrofiber_1000x1500_6.webp',
    'Fjellblå Utekos Mikrofiber i parkaslengde forfra.',
    MICROFIBER_MOBILE_STILL_WIDTH,
    MICROFIBER_MOBILE_STILL_HEIGHT
  )
]

export const MICROFIBER_PRODUCT_GALLERY_IMAGES: Image[] = [
  productImage(
    'utekos-mikrofiber-desktop-still-1',
    mikrofiberDesktopStill1,
    'To kvinner i Utekos Mikrofiber sitter på en stein i skogen.',
    MICROFIBER_DESKTOP_STILL_NARROW_WIDTH,
    MICROFIBER_DESKTOP_STILL_NARROW_HEIGHT
  ),
  productImage(
    'utekos-mikrofiber-desktop-still-2',
    mikrofiberDesktopStill2,
    'Fjellblå Utekos Mikrofiber i full lengde forfra.',
    MICROFIBER_DESKTOP_STILL_WIDE_WIDTH,
    MICROFIBER_DESKTOP_STILL_WIDE_HEIGHT
  ),
  productImage(
    'utekos-mikrofiber-desktop-still-3',
    mikrofiberDesktopStill3,
    'Fjellblå Utekos Mikrofiber i full lengde forfra med hette.',
    MICROFIBER_DESKTOP_STILL_WIDE_WIDTH,
    MICROFIBER_DESKTOP_STILL_WIDE_HEIGHT
  ),
  productImage(
    'utekos-mikrofiber-desktop-still-4',
    mikrofiberDesktopStill4,
    'Fjellblå Utekos Mikrofiber i full lengde bakfra.',
    MICROFIBER_DESKTOP_STILL_4_WIDTH,
    MICROFIBER_DESKTOP_STILL_4_HEIGHT
  ),
  productImage(
    'utekos-mikrofiber-desktop-still-5',
    mikrofiberDesktopStill5,
    'Fjellblå Utekos Mikrofiber i parkaslengde forfra.',
    MICROFIBER_DESKTOP_STILL_WIDE_WIDTH,
    MICROFIBER_DESKTOP_STILL_WIDE_HEIGHT
  ),
  productImage(
    'utekos-mikrofiber-desktop-still-6',
    mikrofiberDesktopStill6,
    'Fjellblå Utekos Mikrofiber i halvfigur forfra.',
    MICROFIBER_DESKTOP_STILL_WIDE_WIDTH,
    MICROFIBER_DESKTOP_STILL_WIDE_HEIGHT
  ),
  productImage(
    'utekos-mikrofiber-desktop-still-7',
    mikrofiberDesktopStill7,
    'Nedre del av fjellblå Utekos Mikrofiber med strammesnor.',
    MICROFIBER_DESKTOP_STILL_WIDE_WIDTH,
    MICROFIBER_DESKTOP_STILL_WIDE_HEIGHT
  ),
  productImage(
    'utekos-mikrofiber-desktop-still-8',
    mikrofiberDesktopStill8,
    'Nærbilde av erme og glidelås på fjellblå Utekos Mikrofiber.',
    MICROFIBER_DESKTOP_STILL_WIDE_WIDTH,
    MICROFIBER_DESKTOP_STILL_WIDE_HEIGHT
  ),
  productImage(
    'utekos-mikrofiber-desktop-still-9',
    mikrofiberDesktopStill9,
    'Nærbilde av lomme og glidelås på fjellblå Utekos Mikrofiber.',
    MICROFIBER_DESKTOP_STILL_WIDE_WIDTH,
    MICROFIBER_DESKTOP_STILL_WIDE_HEIGHT
  ),
  productImage(
    'utekos-mikrofiber-desktop-still-10',
    mikrofiberDesktopStill10,
    'Nærbilde av glidelås og sidelomme på fjellblå Utekos Mikrofiber.',
    MICROFIBER_DESKTOP_STILL_NARROW_WIDTH,
    MICROFIBER_DESKTOP_STILL_NARROW_HEIGHT
  )
]
