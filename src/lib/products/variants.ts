import { isPublicProduct } from '@/lib/products/publicProduct';
import type { ProductVariant, ShopifyProduct } from '@/lib/shopify/product-types';
import { slugifyVariantOption } from './slugifyVariantOption';
import { resolveTechDownSizeValue } from './techDownSizes';
export type ProductSearchParams = Record<string, string | string[] | undefined>;
const optionNames: Record<string, string> = { 'Størrelse': 'storrelse', Size: 'storrelse', Str: 'storrelse', Farge: 'farge', Color: 'farge', 'Kjønn': 'kjonn', Gender: 'kjonn' };
export function optionParam(name: string) { return optionNames[name] ?? null; }
export function optionLabel(name: string) { return optionParam(name) === 'storrelse' ? 'Størrelse' : name; }
export function publicVariants<T extends ProductVariant>(product: { handle: string; variants: { nodes: T[] } }) {
  return isPublicProduct(product.handle) ? product.variants.nodes : [];
}
function preferred(variants: ProductVariant[]) {
  return variants.find(v => v.availableForSale && v.selectedOptions.some(o => optionParam(o.name) === 'storrelse' && o.value === 'Stor')) ?? variants.find(v => v.availableForSale) ?? variants[0];
}
export function resolveVariant(product: Pick<ShopifyProduct, 'handle' | 'variants'>, params: ProductSearchParams = {}) {
  const keys = ['variant', 'farge', 'storrelse', 'kjonn'];
  if (keys.some(k => params[k] !== undefined && (typeof params[k] !== 'string' || !params[k]!.trim() || params[k]!.length > 256))) return undefined;
  const id = params.variant as string | undefined;
  if (id && !/^(?:gid:\/\/shopify\/ProductVariant\/)?\d+$/.test(id)) return undefined;
  const variants = publicVariants(product);
  const matches = variants.filter(v => (!id || v.id.split('/').at(-1) === id.split('/').at(-1)) && keys.slice(1).every(key => {
    if (!params[key]) return true;
    const value = v.selectedOptions.find(o => optionParam(o.name) === key)?.value;
    if (!value) return false;
    const query = params[key] as string;
    return slugifyVariantOption(value) === query || (['Liten', 'Middels', 'Stor', 'Større'].includes(value) && resolveTechDownSizeValue(query) === value);
  }));
  const defaultVariant = (product.handle === 'comfyrobe'
    ? variants.find(v => v.selectedOptions.some(o => optionParam(o.name) === 'storrelse' && o.value === 'XL'))
    : undefined) ?? preferred(variants);
  return matches.find(v => v.id === defaultVariant?.id) ?? preferred(matches);
}
export function variantHref(handle: string, variant: ProductVariant, siblings?: ProductVariant[], sourceParams?: ProductSearchParams) {
  const params = new URLSearchParams();
  // Keep the public URL order stable regardless of Shopify's option order.
  for (const key of ['farge', 'storrelse', 'kjonn']) {
    const option = variant.selectedOptions.find(option => optionParam(option.name) === key);
    if (!option) continue;
    const value = slugifyVariantOption(option.value);
    if (key === 'kjonn' && value === 'unisex' && siblings?.length && siblings.every(sibling =>
      sibling.selectedOptions.some(option => optionParam(option.name) === key && slugifyVariantOption(option.value) === value)
    )) continue;
    params.set(key, value);
  }
  const unsupported = variant.selectedOptions.some(option => !optionParam(option.name));
  const matches = siblings?.filter(sibling => [...params].every(([key, value]) =>
    sibling.selectedOptions.some(option => optionParam(option.name) === key && slugifyVariantOption(option.value) === value)
  ));
  // Unknown options and colliding slugs must never link to a different variant.
  const resolvesExactly = !siblings || resolveVariant({ handle, variants: { nodes: siblings } }, Object.fromEntries(params))?.id === variant.id;
  if (!params.size || unsupported || !resolvesExactly || (matches && (matches.length !== 1 || matches[0].id !== variant.id))) {
    params.set('variant', variant.id.split('/').at(-1)!);
  }
  for (const [key, value] of Object.entries(sourceParams ?? {})) {
    if (['variant', 'farge', 'storrelse', 'kjonn'].includes(key)) continue;
    for (const item of Array.isArray(value) ? value : value === undefined ? [] : [value]) {
      params.append(key, item);
    }
  }
  return `/produkter/${handle}?${params}` as const;
}
export function variantOptions(product: ShopifyProduct, selected: ProductVariant, sourceParams?: ProductSearchParams) {
  const variants = publicVariants(product);
  return product.options.filter(o => optionParam(o.name) !== 'kjonn').sort((a, b) => Number(optionParam(b.name) === 'storrelse') - Number(optionParam(a.name) === 'storrelse')).map(option => ({
    name: optionLabel(option.name),
    values: [...new Set(variants.flatMap(v => v.selectedOptions.filter(o => o.name === option.name).map(o => o.value)))].map(value => {
      const exact = variants.filter(v => v.selectedOptions.some(o => o.name === option.name && o.value === value));
      const compatible = exact.filter(v => v.selectedOptions.every(o => o.name === option.name || selected.selectedOptions.some(s => s.name === o.name && s.value === o.value)));
      // A color is available if any of its sizes can be purchased. Preserve the
      // current size when possible; otherwise link to an available size in that color.
      // Size choices still describe availability within the selected color.
      const availableColorMatch = optionParam(option.name) === 'farge'
        ? preferred(compatible.filter(v => v.availableForSale)) ?? preferred(exact.filter(v => v.availableForSale))
        : undefined;
      const match = availableColorMatch ?? preferred(compatible) ?? preferred(exact);
      return { value, selected: selected.selectedOptions.some(o => o.name === option.name && o.value === value), available: !!match?.availableForSale, href: match ? variantHref(product.handle, match, variants, sourceParams) : null };
    }),
  }));
}
