import { absoluteUrl } from './site';

// Public facts: storefront footer + BRREG entity 925820393, checked 2026-10-09.
// Shopify's primary domain belongs to checkout; it is not the canonical storefront.
export const SITE_ORGANIZATION_ID = absoluteUrl('/#organization');
export const SITE_WEBSITE_ID = absoluteUrl('/#website');
export const SITE_CUSTOMER_SERVICE_ID = absoluteUrl('/#customer-service');
export const siteIdentity = {
  name: 'Utekos',
  legalName: 'KELC AS',
  organizationNumber: '925820393',
  url: absoluteUrl('/'),
  aboutUrl: absoluteUrl('/om-oss'),
  language: 'nb-NO',
  logo: { src: '/icon.png', width: 1000, height: 1000 },
  customerService: {
    url: absoluteUrl('/kontaktskjema'),
    email: 'kundeservice@utekos.no',
    telephone: '+4740216343',
  },
  address: {
    streetAddress: 'Lille Damsgårdsveien 25',
    postalCode: '5162',
    addressLocality: 'Laksevåg',
    addressCountry: 'NO',
  },
} as const;

export const SITE_DESCRIPTION = 'Oppdag Utekos varmeplagg og tilbehør til camping, hytteliv og lange kvelder ute. Finn plagget som passer deg, og gjør deg klar for mer tid utendørs.';

// Existing original composition, inspected at its native 1200 × 630 dimensions.
export const siteSocialImage = {
  url: absoluteUrl('/og-image-skreddersy-varmen.jpg'),
  width: 1200,
  height: 630,
  type: 'image/jpeg',
  alt: 'To personer sitter ute på en terrasse i blå Utekos-varmeplagg.',
} as const;
