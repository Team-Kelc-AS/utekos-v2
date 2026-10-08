import { productTitle } from './productTitle';
import { optionParam, publicVariants } from '@/lib/products/variants';
import type { ProductImage, ProductVariant, ShopifyProduct } from '@/lib/shopify/product-types';

type Selection = { size: string; color?: string; label?: string; image: string; width?: number; height?: number };
type Definition = { id: string; handle: string; label: string; color?: string; cards: Selection[] };

// Exact ordering, display labels and image assignments from headless's
// helpChooseCarouselConfig. A missing size/color must never select a substitute.
const definitions: Definition[] = [
  { id: 'svale', handle: 'utekos-svale', label: 'Utekos Svale', cards: [
    { size: 'Middels', image: '/Svale_1.webp' },
    { size: 'Stor', image: '/Svale_2.webp' },
    { size: 'Større', image: '/Svale_3.webp' },
  ] },
  { id: 'techdown', handle: 'utekos-techdown', label: 'Utekos TechDown™', color: 'Havdyp', cards: [
    { size: 'Stor', image: '/TechDown_2000x3000_2.webp' },
    { size: 'Større', image: '/TechDown_2000x3000_8.webp' },
    { size: 'Middels', image: '/TechDown_2000x3000_1.webp' },
    { size: 'Liten', image: '/TechDown-Liten.webp' },
  ] },
  { id: 'dun', handle: 'utekos-dun', label: 'Utekos Dun™', cards: [
    { size: 'Medium', color: 'Vargnatt', label: 'Vargnatt M', image: '/Soveposejakke_Black_1.webp', width: 2000, height: 3000 },
    { size: 'Large', color: 'Vargnatt', label: 'Vargnatt L', image: '/Mikrfofiber_1000x1500_Back_Black.webp' },
    { size: 'Medium', color: 'Fjellblå', label: 'Fjellblå M', image: '/Mikro_1000x1500_Bakside.webp' },
    { size: 'Large', color: 'Fjellblå', label: 'Fjellblå L', image: '/Mikro_1000x1500_Diagonal.webp' },
  ] },
  { id: 'mikrofiber', handle: 'utekos-mikrofiber', label: 'Utekos Mikrofiber™', cards: [
    { size: 'Medium', color: 'Fjellblå', label: 'Fjellblå M', image: '/Mikro_1000x1500_Front.webp' },
    { size: 'Large', color: 'Fjellblå', label: 'Fjellblå L', image: '/Mikro_1000x1500_Diagonal.webp' },
    { size: 'Medium', color: 'Vargnatt', label: 'Vargnatt M', image: '/Soveposejakke_Black_3.webp', width: 2000, height: 3000 },
    { size: 'Large', color: 'Vargnatt', label: 'Vargnatt L', image: '/Soveposejakke_Black_4.webp', width: 1333, height: 2000 },
  ] },
  { id: 'comfyrobe', handle: 'comfyrobe', label: 'Comfyrobe™', color: 'Fjellnatt', cards: [
    { size: 'XS', label: 'S/XS', image: '/Comfy_1000x1500_1.webp' },
    { size: 'M', label: 'M/L', image: '/Comfy_1000x1500_Fly.webp' },
    { size: 'XL', label: 'L/XXL', image: '/Comfy_1000x1500_Open.webp' },
  ] },
];

export type OverviewCard = {
  product: ShopifyProduct;
  variant: ProductVariant;
  title: string;
  color?: string;
  image: ProductImage;
};
export type OverviewRow = { id: string; label: string; cards: OverviewCard[] };

export function productOverviewRows(products: ShopifyProduct[]): OverviewRow[] {
  const rows = new Map<string, OverviewRow>();
  for (const definition of definitions) {
    const product = products.find(product => product.handle === definition.handle);
    if (!product) continue;
    for (const card of definition.cards) {
      const color = card.color ?? definition.color;
      const matches = publicVariants(product).filter(variant =>
        variant.selectedOptions.some(option => optionParam(option.name) === 'storrelse' && option.value === card.size) &&
        (!color || variant.selectedOptions.some(option => optionParam(option.name) === 'farge' && option.value === color)),
      );
      // Ambiguous options are not safe to assign to a fixed purchase card.
      if (matches.length !== 1) continue;
      const groupByColor = definition.id === 'dun' || definition.id === 'mikrofiber';
      const id = groupByColor ? `color-${color}` : definition.id;
      const label = groupByColor ? `Utekos Dun™ og Mikrofiber™ – ${color}` : definition.label;
      const row = rows.get(id) ?? { id, label, cards: [] };
      const title = `${definition.label} ${card.label ?? card.size}`;
      row.cards.push({ product, variant: matches[0], title, color, image: {
        url: card.image, altText: `${title}${color && !card.label?.includes(color) ? ` i ${color}` : ''}`,
        width: card.width ?? 1000, height: card.height ?? 1500,
      } });
      rows.set(id, row);
    }
  }
  // Keep accessories and future products visible, using their own variant media.
  for (const product of products.filter(product => !definitions.some(definition => definition.handle === product.handle))) {
    const title = productTitle(product);
    rows.set(product.handle, { id: product.handle, label: title, cards: publicVariants(product).map(variant => ({
      product, variant,
      title: product.variants.nodes.length === 1 ? title : `${title} ${variant.title}`,
      image: variant.image ?? product.images.nodes[0],
    })).filter(card => !!card.image) });
  }
  return [...rows.values()].filter(row => row.cards.length > 0);
}
