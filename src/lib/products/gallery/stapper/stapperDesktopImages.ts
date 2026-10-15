import { productImage } from '@/lib/products/productImage'
import type { ProductImage as Image } from '@/lib/shopify/product-types'

export const STAPPER_PRODUCT_GALLERY_IMAGES: Image[] = [
  productImage(
    'utekos-stapper-1440-white',
    '/images/kunnskap/Stapper_1440x1800_White.webp',
    'Svart Utekos Stapper™ kompresjonsbag med hvit logo.',
    1440,
    1800
  ),
  productImage(
    'utekos-stapper-1440-orange',
    '/images/kunnskap/Stapper_1440x1800_Orange.webp',
    'Svart Utekos Stapper™ kompresjonsbag med oransje logo.',
    1440,
    1800
  ),
]

export const STAPPER_MOBILE_GALLERY_IMAGES: Image[] = [
  productImage(
    'utekos-stapper-1000-white',
    '/images/kunnskap/Stapper_1000x1500_White.webp',
    'Svart Utekos Stapper™ kompresjonsbag med hvit logo.',
    1000,
    1500
  ),
  productImage(
    'utekos-stapper-1000-orange',
    '/images/kunnskap/Stapper_1000x1500_Orange.webp',
    'Svart Utekos Stapper™ kompresjonsbag med oransje logo.',
    1000,
    1500
  ),
]
