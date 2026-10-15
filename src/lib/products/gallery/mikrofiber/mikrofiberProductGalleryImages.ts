import { productImage } from '@/lib/products/productImage'
import type { ProductImage as Image } from '@/lib/shopify/product-types'
import mikrofiberMobileStill16 from '@/assets/products/mikrofiber/16.webp'
const MICROFIBER_MOBILE_STILL_16_WIDTH = 800
const MICROFIBER_MOBILE_STILL_16_HEIGHT = 1200
const MICROFIBER_MOBILE_STILL_WIDTH = 1000
const MICROFIBER_MOBILE_STILL_HEIGHT = 1500

export const MICROFIBER_BLUE_STUDIO_IMAGES: Image[] = [
  productImage('mikrofiber-blue-studio-1', '/images/kunnskap/Soveposejakke_Blue1.webp', 'Utekos Mikrofiber™ Fjellblå i full lengde forfra.', 2000, 3000),
  productImage('mikrofiber-blue-studio-2', '/images/kunnskap/Soveposejakke_Blue2.webp', 'Utekos Mikrofiber™ Fjellblå i full lengde bakfra.', 2000, 3000),
  productImage('mikrofiber-blue-studio-3', '/images/kunnskap/Soveposejakke_Blue3.webp', 'Utekos Mikrofiber™ Fjellblå i mellomlengde forfra.', 1200, 1800),
  productImage('mikrofiber-blue-studio-4', '/images/kunnskap/Soveposejakke_Blue4.webp', 'Utekos Mikrofiber™ Fjellblå i kort lengde forfra.', 2000, 3000),
]

export const MICROFIBER_BLACK_STUDIO_IMAGES: Image[] = [
  productImage('mikrofiber-black-studio-1', '/images/kunnskap/Soveposejakke_Black1.webp', 'Utekos Mikrofiber™ Vargnatt i full lengde forfra.', 2000, 3000),
  productImage('mikrofiber-black-studio-2', '/images/kunnskap/Soveposejakke_Black2.webp', 'Utekos Mikrofiber™ Vargnatt i full lengde bakfra.', 2000, 3001),
  productImage('mikrofiber-black-studio-3', '/images/kunnskap/Soveposejakke_Black3.webp', 'Utekos Mikrofiber™ Vargnatt i mellomlengde forfra.', 2000, 3000),
  productImage('mikrofiber-black-studio-4', '/images/kunnskap/Soveposejakke_Black4.webp', 'Utekos Mikrofiber™ Vargnatt i kort lengde forfra.', 2000, 3001),
]

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
    '/images/kunnskap/Mikrofiber_Vargnatt_1440x1800_Full2.webp',
    'Kvinne i Utekos Mikrofiber™ Vargnatt i full lengde står på en snødekt terrasse utenfor en hytte.',
    1440,
    1800
  ),
  ...MICROFIBER_BLACK_STUDIO_IMAGES
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
  ...MICROFIBER_BLUE_STUDIO_IMAGES
]

// Studio originals use the shared desktop 4:5 frame, followed by the existing lifestyle image.
export const MICROFIBER_PRODUCT_GALLERY_IMAGES: Image[] = [
  ...MICROFIBER_BLUE_STUDIO_IMAGES,
  productImage(
    'utekos-mikrofiber-desktop-still-44',
    'https://cdn.shopify.com/s/files/1/0634/2154/6744/files/Mikrofiber_44.webp?v=1791293769',
    'To kvinner i Utekos Mikrofiber™ sitter på en stein i skogen.',
    1440,
    1800
  )
]
