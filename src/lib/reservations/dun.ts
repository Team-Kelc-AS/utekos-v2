import type { ProductVariant } from '@/lib/shopify/product-types';

export const dunColors = ['Vargnatt', 'Fjellblå'] as const;
export const dunSizes = ['Small', 'Medium', 'Large'] as const;
export const dunReservationConsent = 'Ja, hold av en jakke til meg og send uforpliktende betalingslenke på e-post og SMS når den er på lager.';
export type DunSelection = { color: typeof dunColors[number]; size: typeof dunSizes[number] };
export type DunReservationState = { status: 'idle' | 'success' | 'error'; message?: string; errors?: Record<string, string[] | undefined> };

export function dunSelection(variant: Pick<ProductVariant, 'selectedOptions'>): DunSelection {
  const color = variant.selectedOptions.find(option => ['Farge', 'Color'].includes(option.name))?.value;
  const size = variant.selectedOptions.find(option => ['Størrelse', 'Size', 'Str'].includes(option.name))?.value;
  return {
    color: dunColors.find(value => value === color) ?? 'Vargnatt',
    size: dunSizes.find(value => value === size) ?? 'Medium',
  };
}
