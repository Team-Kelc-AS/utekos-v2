import { productImage } from '@/lib/products/productImage'
import type { ProductImage as Image } from '@/lib/shopify/product-types'
import stapperHvit from '@/assets/products/partners/stapper-hvit.png'


export const STAPPER_PRODUCT_GALLERY_IMAGES: Image[] = [
  productImage(
    'utekos-stapper-product',
    stapperHvit,
    'Utekos Stapper kompresjonsbag.',
    1080,
    1086
  )
]
