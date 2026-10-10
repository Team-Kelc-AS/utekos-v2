import 'server-only';
import type { MerchantReturnPolicy, ShippingService } from 'schema-dts';
import { absoluteUrl } from '../site';
import { supportPages } from '../supportPages';

const policyUrl = absoluteUrl(supportPages.shippingReturns.path);
export const MERCHANT_RETURN_POLICY_ID = `${policyUrl}#return-policy`;
export const MERCHANT_SHIPPING_SERVICE_ID = `${policyUrl}#shipping-service`;

// Google's link-only organization policy profile preserves the full withdrawal,
// refund and size-exchange terms instead of reducing them to one return window.
export const merchantReturnPolicy: MerchantReturnPolicy = {
  '@type': 'MerchantReturnPolicy', '@id': MERCHANT_RETURN_POLICY_ID,
  merchantReturnLink: policyUrl,
};

// Public standard Norway rates in /frakt-og-retur. When both conditions apply,
// Google selects the lowest shipping rate: NOK 0 from an order value of NOK 999.
// No handling/cutoff/total-delivery time is documented. Existing offer-level
// product policies remain independent and take precedence for product exceptions.
export const merchantShippingService: ShippingService = {
  '@type': 'ShippingService', '@id': MERCHANT_SHIPPING_SERVICE_ID,
  name: 'Ordinær frakt i Norge', url: `${policyUrl}#frakt-og-levering`,
  description: 'Ordinær frakt i Norge koster 99 kr på bestillinger under 999 kr. Fra 999 kr er ordinær frakt gratis.',
  shippingConditions: [
    {
      '@type': 'ShippingConditions',
      shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'NO' },
      shippingRate: { '@type': 'MonetaryAmount', value: 99, currency: 'NOK' },
    },
    {
      '@type': 'ShippingConditions',
      shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'NO' },
      orderValue: { '@type': 'MonetaryAmount', minValue: 999, currency: 'NOK' },
      shippingRate: { '@type': 'MonetaryAmount', value: 0, currency: 'NOK' },
    },
  ],
};
