export type ProductSizeGuideFamily =
  | 'comfyrobe'
  | 'techdown'
  | 'stapper'
  | 'utekos'

export function resolveProductSizeGuideFamily(
  productHandle: string
): ProductSizeGuideFamily {
  if (productHandle === 'comfyrobe') {
    return 'comfyrobe'
  }

  if (productHandle === 'utekos-techdown' || productHandle === 'utekos-svale') {
    return 'techdown'
  }

  if (productHandle === 'utekos-stapper') {
    return 'stapper'
  }

  return 'utekos'
}
