// Path: src/lib/utils/slugifyVariantOption.ts

export function slugifyVariantOption(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replaceAll('æ', 'ae')
    .replaceAll('ø', 'o')
    .replaceAll('å', 'a')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
