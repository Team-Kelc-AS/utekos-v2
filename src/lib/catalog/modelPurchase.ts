import type { Money, ProductImage, ProductVariant, ShopifyProduct } from '@/lib/shopify/product-types';

/** Public fields only. No inventory quantities, SKU, backend or marketing data. */
export type ModelVariant = {
  id: string;
  selectedOptions: { name: string; value: string }[];
  price: Money;
  available: boolean;
  image: ProductImage | null;
};
export type ModelPurchase = { handle: string; title: string; variants: ModelVariant[] };
export type ModelChoice = Record<string, string>;

export function isSizeOption(name: string) {
  return /^(størrelse|size|str)$/i.test(name);
}

export function modelVariants(product: ShopifyProduct): ModelVariant[] {
  return product.variants.nodes.map(variant => ({
    id: variant.id,
    selectedOptions: variant.selectedOptions.map(({ name, value }) => ({ name, value })),
    price: variant.price,
    available: variant.availableForSale && variant.currentlyNotInStock === false,
    image: variant.image,
  }));
}

export function modelOptions(variants: ModelVariant[]) {
  const options = new Map<string, Set<string>>();
  for (const variant of variants) for (const { name, value } of variant.selectedOptions) {
    if (!options.has(name)) options.set(name, new Set());
    options.get(name)!.add(value);
  }
  return [...options].map(([name, values]) => ({ name, values: [...values] }))
    .sort((a, b) => Number(isSizeOption(b.name)) - Number(isSizeOption(a.name)));
}

/** Even a single size requires an explicit choice. Constant color/gender is safe to fill. */
export function initialModelChoice(variants: ModelVariant[]): ModelChoice {
  return Object.fromEntries(modelOptions(variants)
    .filter(option => !isSizeOption(option.name) && option.values.length === 1)
    .map(option => [option.name, option.values[0]]));
}

/** Never substitute a compatible or available sibling for the exact selection. */
export function selectedModelVariant(variants: ModelVariant[], choice: ModelChoice) {
  const matches = variants.filter(variant => variant.selectedOptions.every(option => choice[option.name] === option.value));
  return matches.length === 1 ? matches[0] : undefined;
}

export function modelOptionAvailable(variants: ModelVariant[], choice: ModelChoice, name: string, value: string) {
  const proposed = { ...choice, [name]: value };
  return variants.some(variant => variant.available && variant.selectedOptions.every(option =>
    !proposed[option.name] || proposed[option.name] === option.value));
}

export function modelPreviewVariant(variants: ProductVariant[]) {
  return variants.find(variant => variant.availableForSale && variant.currentlyNotInStock === false) ?? variants[0];
}

export function modelPriceRange(variants: { price: Money }[]) {
  const prices = variants.map(variant => variant.price).sort((a, b) => Number(a.amount) - Number(b.amount));
  return prices.length ? { min: prices[0], max: prices.at(-1)! } : null;
}
