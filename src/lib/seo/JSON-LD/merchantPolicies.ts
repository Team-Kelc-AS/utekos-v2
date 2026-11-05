import 'server-only';
import type { MerchantReturnPolicy, ShippingService } from 'schema-dts';
import { absoluteUrl } from '../site';
import { supportPages } from '../supportPages';
import { christmasReturnPolicy } from '@/lib/commerce/returnPolicy';

const policyUrl = absoluteUrl(supportPages.shippingReturns.path);
export const MERCHANT_RETURN_POLICY_ID = `${policyUrl}#return-policy`;
export const MERCHANT_SHIPPING_SERVICE_ID = `${policyUrl}#shipping-service`;

// All products share this policy. Offer-level windows would override the
// organization policy and hide its seasonal extension in Google.
export const merchantReturnPolicy: MerchantReturnPolicy = {
  '@type': 'MerchantReturnPolicy', '@id': MERCHANT_RETURN_POLICY_ID,
  merchantReturnLink: policyUrl,
  applicableCountry: 'NO', returnPolicyCountry: 'NO',
  returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
  merchantReturnDays: 14,
  returnMethod: 'https://schema.org/ReturnByMail',
  returnFees: 'https://schema.org/ReturnFeesCustomerResponsibility',
  returnLabelSource: 'https://schema.org/ReturnLabelCustomerResponsibility',
  itemDefectReturnFees: 'https://schema.org/FreeReturn',
  refundType: 'https://schema.org/FullRefund',
  returnPolicySeasonalOverride: {
    '@type': 'MerchantReturnPolicySeasonalOverride',
    returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
    startDate: christmasReturnPolicy.startDate,
    endDate: christmasReturnPolicy.endDate,
    merchantReturnDays: christmasReturnPolicy.days,
  },
};

// Public standard Norway rates in /frakt-og-retur. When both conditions apply,
// Google selects the lowest shipping rate: NOK 0 from an order value of NOK 999.
// Offer-level shipping details carry the confirmed transit window and weekdays.
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
