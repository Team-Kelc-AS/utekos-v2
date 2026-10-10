import type { ProductVariant } from '@/lib/shopify/product-types';
import { optionParam } from './variants';

export type ProductColorSheet = { src: string; alt: string };

const maritime: ProductColorSheet = {
  src: '/images/PANTONE_MARITIME_BLUE_1000x1500.png',
  alt: 'Fargeark: PANTONE 19-3831 FHI Cotton TCX Maritime Blue. HEX 27293D, RGB 39, 41, 61.',
};
const maritimeMoonstruck: ProductColorSheet = {
  src: '/images/PANTONE_MARITIME_BLUE_MOONSTUCK_1000x1500.png',
  alt: 'Fargeark: PANTONE 19-3831 FHI Cotton TCX Maritime Blue med Moonstruck-farget tekst. HEX 27293D, RGB 39, 41, 61.',
};
const anthracite: ProductColorSheet = {
  src: '/images/PANTONE_ANTHRACITE_1000x1500.png',
  alt: 'Fargeark: PANTONE 19-4007 FHI Cotton TCX Anthracite. HEX 28282D, RGB 40, 40, 45.',
};
const patriot: ProductColorSheet = {
  src: '/images/PANTONE_PATRIOT_BLUE_1000x1500.png',
  alt: 'Fargeark: PANTONE 19-3935 FHI Cotton TCX Patriot Blue. HEX 363756, RGB 54, 55, 86.',
};

export function productVariantColorSheet(handle: string, variant: Pick<ProductVariant, 'selectedOptions'>): ProductColorSheet | undefined {
  const color = variant.selectedOptions.find(option => optionParam(option.name) === 'farge')?.value;
  // Svale's existing variants have size only; its product imagery and gallery
  // document the Havdyp fabric and Moonstruck details.
  if (handle === 'utekos-svale' && (!color || color === 'Havdyp')) return maritimeMoonstruck;
  if (handle === 'utekos-techdown' && color === 'Havdyp') return maritime;
  // Explicit color assignments confirmed by the user; Comfyrobe is excluded.
  if (['utekos-dun', 'utekos-mikrofiber'].includes(handle)) {
    if (color === 'Vargnatt') return anthracite;
    if (color === 'Fjellblå') return patriot;
  }
  return undefined;
}
