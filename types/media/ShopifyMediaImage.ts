// Path: types/media/ShopifyMediaImage.ts
import type { Image } from './Image'

export type ShopifyMediaImage = {
  id: string
  image: Image
}

export type ShopifyImageEdge = {
  node: ShopifyMediaImage
}
export type ShopifyImageConnection = {
  edges: ShopifyImageEdge[]
}
