import 'server-only';
import type { MerchantReturnPolicy, Offer, OfferShippingDetails } from 'schema-dts';
import type { Money } from '@/lib/shopify/product-types';
import { absoluteUrl } from '@/lib/seo/site';

// Scope verified against src/app/(storefront)/frakt-og-retur/page.mdx (2026-10-05)
// and the six existing product definitions. Future products require review.
const policyHandles = new Set([
  'utekos-techdown', 'utekos-svale', 'utekos-mikrofiber',
  'utekos-dun', 'comfyrobe', 'utekos-stapper',
]);

const returnPolicy: MerchantReturnPolicy = {
  '@type': 'MerchantReturnPolicy',
  applicableCountry: 'NO', returnPolicyCountry: 'NO',
  returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
  merchantReturnDays: 14,
  returnMethod: 'https://schema.org/ReturnByMail',
  returnFees: 'https://schema.org/ReturnFeesCustomerResponsibility',
  merchantReturnLink: absoluteUrl('/frakt-og-retur'),
};

/** Apply policies to new variants of known products without a snapshot-ID dependency. */
export function productOfferPolicies(handle: string, money: Money): Pick<Offer, 'shippingDetails' | 'hasMerchantReturnPolicy'> {
  if (!policyHandles.has(handle) || money.currencyCode !== 'NOK') return {};
  const shippingDetails: OfferShippingDetails = {
    '@type': 'OfferShippingDetails',
    shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'NO' },
    shippingRate: { '@type': 'MonetaryAmount', value: Number(money.amount) >= 999 ? 0 : 99, currency: 'NOK' },
    deliveryTime: {
      '@type': 'ShippingDeliveryTime',
      businessDays: {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['https://schema.org/Monday', 'https://schema.org/Tuesday', 'https://schema.org/Wednesday', 'https://schema.org/Thursday', 'https://schema.org/Friday'],
      },
      // Transit after carrier collection, NOT total time from order placement.
      // Handling time remains missing evidence; do not invent 0 or 1 day.
      transitTime: { '@type': 'QuantitativeValue', minValue: 2, maxValue: 5, unitCode: 'DAY' },
    },
  };
  return { shippingDetails, hasMerchantReturnPolicy: returnPolicy };
}
