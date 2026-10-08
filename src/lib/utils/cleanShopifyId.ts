// src/lib/utils/cleanShopifyId.ts
export function cleanShopifyId(
  id: string | number | undefined | null
): string | undefined {
  if (!id) return undefined
  const stringId = String(id)

  return stringId.split('/').pop()?.split('?')[0]
}
