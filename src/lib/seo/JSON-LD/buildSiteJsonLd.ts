import 'server-only';
import type { Graph, OnlineStore, WebSite } from 'schema-dts';
import { absoluteUrl } from '../site';
import { SITE_CUSTOMER_SERVICE_ID, SITE_DESCRIPTION, SITE_ORGANIZATION_ID, SITE_WEBSITE_ID, siteIdentity } from '../siteIdentity';
import { merchantReturnPolicy, merchantShippingService } from './merchantPolicies';

/** One shared identity graph per document, emitted by the root server layout. */
export function buildSiteJsonLd(): Graph {
  const organization: OnlineStore = {
    '@type': 'OnlineStore', '@id': SITE_ORGANIZATION_ID,
    name: siteIdentity.name, legalName: siteIdentity.legalName,
    url: siteIdentity.url, description: SITE_DESCRIPTION,
    logo: absoluteUrl(siteIdentity.logo.src),
    identifier: {
      '@type': 'PropertyValue', propertyID: 'Organisasjonsnummer', value: siteIdentity.organizationNumber,
    },
    address: { '@type': 'PostalAddress', ...siteIdentity.address },
    email: siteIdentity.customerService.email,
    telephone: siteIdentity.customerService.telephone,
    hasMerchantReturnPolicy: merchantReturnPolicy,
    hasShippingService: merchantShippingService,
    contactPoint: {
      '@type': 'ContactPoint', '@id': SITE_CUSTOMER_SERVICE_ID, contactType: 'kundeservice',
      ...siteIdentity.customerService, availableLanguage: siteIdentity.language,
    },
  };
  const website: WebSite = {
    '@type': 'WebSite', '@id': SITE_WEBSITE_ID,
    name: siteIdentity.name, url: siteIdentity.url,
    inLanguage: siteIdentity.language, publisher: { '@id': SITE_ORGANIZATION_ID },
  };
  return { '@context': 'https://schema.org', '@graph': [organization, website] };
}
