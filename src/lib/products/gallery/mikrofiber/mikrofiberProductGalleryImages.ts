import { productImage } from '@/lib/products/productImage'
import type { ProductImage as Image } from '@/lib/shopify/product-types'
import mikrofiberMobileStill16 from '@/assets/products/mikrofiber/16.webp'
const MICROFIBER_MOBILE_STILL_16_WIDTH = 800
const MICROFIBER_MOBILE_STILL_16_HEIGHT = 1200
const MICROFIBER_MOBILE_STILL_WIDTH = 1000
const MICROFIBER_MOBILE_STILL_HEIGHT = 1500

export const MICROFIBER_VARGNATT_DESKTOP_GALLERY_IMAGES: Image[] = [
  productImage(
    'utekos-mikrofiber-vargnatt-desktop-jarle-2',
    '/images/kunnskap/mikrofiber_vargnatt_45_jarle_2.webp',
    'Mann i Utekos Mikrofiber™ Vargnatt sitter på en terrasse med utsikt over fjord og snødekte fjell.',
    603,
    754
  ),
  productImage(
    'utekos-mikrofiber-vargnatt-desktop-2',
    '/images/kunnskap/mikrofiber_vargnatt_45_2.webp',
    'Kvinne i Utekos Mikrofiber™ Vargnatt sitter med en kopp ved bobilen med utsikt over fjorden.',
    603,
    754
  ),
  productImage(
    'utekos-mikrofiber-vargnatt-desktop-3',
    '/images/kunnskap/mikrofiber_vargnatt_45_3.webp',
    'Kvinne i Utekos Mikrofiber™ Vargnatt i kort lengde går ved en hytte med hodetelefoner og telefon.',
    603,
    754
  ),
  productImage(
    'utekos-mikrofiber-vargnatt-desktop-4',
    '/images/kunnskap/mikrofiber_vargnatt_45_4.webp',
    'Kvinne i Utekos Mikrofiber™ Vargnatt i full lengde står utenfor en hytte.',
    603,
    754
  )
]

export const MICROFIBER_MOBILE_GALLERY_IMAGES: Image[] = [
  productImage(
    'utekos-mikrofiber-mobile-still-16',
    mikrofiberMobileStill16,
    'To kvinner i Utekos Mikrofiber sitter på en stein i skogen.',
    MICROFIBER_MOBILE_STILL_16_WIDTH,
    MICROFIBER_MOBILE_STILL_16_HEIGHT
  ),
  productImage(
    'utekos-mikrofiber-fjellbla-morgenro',
    '/images/kunnskap/morgenro_340x513.jpg',
    'Kvinne i fjellblå Utekos Mikrofiber™ sitter med en kopp ved bobilen med utsikt over fjorden.',
    340,
    510
  ),
  productImage(
    'utekos-mikrofiber-fjellbla-1000x1500-3',
    '/images/kunnskap/mikrofiber_fjellbla_1000x1500_3.webp',
    'Kvinne i fjellblå Utekos Mikrofiber™ står med en kopp ved bobilen med fjord og fjell i bakgrunnen.',
    MICROFIBER_MOBILE_STILL_WIDTH,
    MICROFIBER_MOBILE_STILL_HEIGHT
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

// Verified 4:5 original from this Shopify product; the old stills were not 4:5.
export const MICROFIBER_PRODUCT_GALLERY_IMAGES: Image[] = [
  productImage(
    'utekos-mikrofiber-desktop-still-44',
    'https://cdn.shopify.com/s/files/1/0634/2154/6744/files/Mikrofiber_44.webp?v=1791293769',
    'To kvinner i Utekos Mikrofiber™ sitter på en stein i skogen.',
    1440,
    1800
  )
]
