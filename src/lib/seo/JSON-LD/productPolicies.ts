import 'server-only';
import type { Offer, OfferShippingDetails } from 'schema-dts';
import type { Money } from '@/lib/shopify/product-types';

// Shipping terms confirmed by the merchant on 2026-11-06.
// Future products require review before applying these rates.
const policyHandles = new Set([
  'utekos-techdown', 'utekos-mikrofiber',
  'utekos-dun', 'comfyrobe', 'utekos-stapper',
]);

/** Apply policies to new variants of known products without a snapshot-ID dependency. */
export function productOfferPolicies(handle: string, money: Money): Pick<Offer, 'shippingDetails'> {
  if (!policyHandles.has(handle) || money.currencyCode !== 'NOK') return {};
  const shippingDetails: OfferShippingDetails = {
    '@type': 'OfferShippingDetails',
    shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'NO' },
    shippingRate: { '@type': 'MonetaryAmount', value: Number(money.amount) >= 999 ? 0 : 99, currency: 'NOK' },
    deliveryTime: {
      '@type': 'ShippingDeliveryTime',
      businessDays: {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['https://schema.org/Monday', 'https://schema.org/Tuesday', 'https://schema.org/Wednesday', 'https://schema.org/Thursday', 'https://schema.org/Friday', 'https://schema.org/Saturday'],
      },
      // Transit after carrier collection, NOT total time from order placement.
      // Handling time remains missing evidence; do not invent 0 or 1 day.
      transitTime: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 4, unitCode: 'DAY' },
    },
  };
  return { shippingDetails };
}
