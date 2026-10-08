import type {
  ItemAvailability,
  MerchantReturnEnumeration,
  MerchantReturnPolicy,
  Offer,
  OfferShippingDetails,
  Review,
  Product,
  ReturnFeesEnumeration,
  ReturnMethodEnumeration,
  WithContext,
} from 'schema-dts';

/** Egne fargeforslag for JSON-LD. Dette endrer ikke Shopify-dataene. */
export type StapperColor = 'Vargnatt' | 'Fjellblå' | 'Havdyp' | 'Fjellnatt';

// Rene URL-alternativer gir verdiforslag uten Schema.orgs øvrige objektformer.
type SchemaUrl<T> = Extract<T, `https://schema.org/${string}`>;

export type StapperReturnPolicy = Omit<
  MerchantReturnPolicy,
  'returnPolicyCategory' | 'returnFees' | 'returnMethod'
> & {
  applicableCountry: string | string[];
  returnPolicyCategory: SchemaUrl<MerchantReturnEnumeration>;
  returnFees?: SchemaUrl<ReturnFeesEnumeration>;
  returnMethod?: SchemaUrl<ReturnMethodEnumeration> | SchemaUrl<ReturnMethodEnumeration>[];
};

/** Pris, valuta og lagerstatus tilhører tilbudet på den enkelte varianten. */
export type StapperOffer = Omit<
  Extract<Offer, { '@type': 'Offer' }>,
  'availability' | 'hasMerchantReturnPolicy'
> & {
  '@type': 'Offer';
  url: string;
  price: number | string;
  priceCurrency: 'NOK';
  availability: SchemaUrl<ItemAvailability>;
  hasMerchantReturnPolicy?: StapperReturnPolicy;
};

/**
 * Ett Product per kjøpbar kombinasjon av farge og størrelse.
 * SKU må være unik, og URL-en må åpne siden med riktig variant valgt.
 * Øvrige Schema.org-felter foreslås også av editoren.
 */
export type StapperVariant = Omit<Extract<Product, { '@type': 'Product' }>, 'color' | 'offers'> & {
  '@type': 'Product';
  name: string;
  sku: string;
  url: string;
  image: string[];
  color: StapperColor;
  size: string;
  offers: StapperOffer;
};

export type Stapper = WithContext<StapperVariant>;

/**
 * Manuelt redigerbart øyeblikksbilde, hentet 2026-10-08. Ingen automatisk oppdatering.
 * Kilder: Shopify Admin (produkt, SKU/GTIN, kategori og metafelt/metaobjekter),
 * Storefront API 2026-10 med country: NO (varianter, pris, vekt og bilder),
 * Judge.me offentlig produktwidget (2 omtaler, alle hentet),
 * src/lib/products/content.ts og sizeGuideData.ts der relevant, samt
 * https://utekos.no/frakt-og-retur (frakt/retur kontrollert samme dag).
 *
 * Til gjennomgang:
 * - Én faktisk variant: ett Product, ingen kunstig ProductGroup.
 * - Polyester er hentet fra Shopifys fabric-metafelt. Ingen fysiske mål er funnet.
 * - Frakten er 99 kr ved kjøp av én; ordresum over 999 kr gir fri frakt.
 * - Bilder følger eksplisitte variantkoblinger i Shopify og er åpnet visuelt.
 *   Størrelsen og fyllmaterialet kan ikke bekreftes fra bilder alene.
 * - colorSwatch er utelatt: fargemetafeltene har hex, men ingen bilde-URL.
 * - hasGS1DigitalLink, mpn, importør og produsent er ikke gjettet.
 * - Beskrivelsen er Shopifys tekst. Pris, kjøpbarhet og omtaler er ferskvare.
 * - Produktlayouten bruker kontrollerte fakta herfra; pris, lager og omtaler hentes live.
 */

const stapperDescription = "Lett og brukervennlig kompresjonsbag som reduserer volumet på din Utekosen din med over 50 %. Perfekt for transport og oppbevaring – både i sekken, bilen eller bagasjen. Laget i slitesterkt materiale og veier kun ca. 100 gram. En smart løsning når plass og effektiv pakking teller.";

// Frakt gjelder én enhet til oppgitt pris. 2–5 virkedager etter henting; ingen gjettet håndteringstid.
export const stapperShippingDetails: OfferShippingDetails = {
  "@type": "OfferShippingDetails",
  "shippingDestination": {
    "@type": "DefinedRegion",
    "addressCountry": "NO"
  },
  "shippingRate": {
    "@type": "MonetaryAmount",
    "value": 99,
    "currency": "NOK"
  },
  "deliveryTime": {
    "@type": "ShippingDeliveryTime",
    "businessDays": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": [
        "https://schema.org/Monday",
        "https://schema.org/Tuesday",
        "https://schema.org/Wednesday",
        "https://schema.org/Thursday",
        "https://schema.org/Friday"
      ]
    },
    "transitTime": {
      "@type": "QuantitativeValue",
      "minValue": 2,
      "maxValue": 5,
      "unitCode": "DAY"
    }
  }
};

export const stapperReturnPolicy: StapperReturnPolicy = {
  "@type": "MerchantReturnPolicy",
  "applicableCountry": "NO",
  "returnPolicyCountry": "NO",
  "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
  "merchantReturnDays": 14,
  "returnMethod": "https://schema.org/ReturnByMail",
  "returnFees": "https://schema.org/ReturnFeesCustomerResponsibility",
  "merchantReturnLink": "https://utekos.no/frakt-og-retur"
};

export const stapperReviews: Review[] = [
  {
    "@type": "Review",
    "@id": "https://utekos.no/produkter/utekos-stapper#review-7c74938d-b90a-4b61-b5a1-43606897e3a9",
    "author": {
      "@type": "Person",
      "name": "Christian Hafsmoe"
    },
    "datePublished": "2026-06-21T09:04:19Z",
    "reviewBody": "Samboeren min elsker denne❤️",
    "reviewRating": {
      "@type": "Rating",
      "ratingValue": 5,
      "bestRating": 5,
      "worstRating": 1
    }
  },
  {
    "@type": "Review",
    "@id": "https://utekos.no/produkter/utekos-stapper#review-4a39c398-c751-4a28-ab3f-b0990b54cf2a",
    "author": {
      "@type": "Person",
      "name": "Knut Arne Nygaard"
    },
    "datePublished": "2026-01-05T13:51:40Z",
    "reviewBody": "Etter å ha ringt inn å snakket med en hyggelig mannsperson fikk vi til å gjøre Utekosen om til en jakke. Varm og god samtidig som den er veldig lett og heldekkende med hette. Denne holder en varm fra hode til tå",
    "reviewRating": {
      "@type": "Rating",
      "ratingValue": 5,
      "bestRating": 5,
      "worstRating": 1
    }
  }
];

export const stapper: Stapper = {
  "@context": "https://schema.org",
  "@type": "Product",
  "@id": "https://utekos.no/produkter/utekos-stapper#variant-42903954292984",
  "name": "Utekos Stapper™ Vargnatt, OneSize",
  "sku": "UTEKOS-STAPPER-UNISEX-SVART",
  "productID": "gid://shopify/ProductVariant/42903954292984",
  "gtin14": "07090062980108",
  "url": "https://utekos.no/produkter/utekos-stapper?variant=42903954292984",
  "image": [
    "https://cdn.shopify.com/s/files/1/0634/2154/6744/files/07090062980108.png?v=1781140958"
  ],
  "color": "Vargnatt",
  "size": "OneSize",
  "description": stapperDescription,
  "weight": {
    "@type": "QuantitativeValue",
    "value": 100,
    "unitCode": "GRM"
  },
  "offers": {
    "@type": "Offer",
    "url": "https://utekos.no/produkter/utekos-stapper?variant=42903954292984",
    "price": "199.0",
    "priceCurrency": "NOK",
    "availability": "https://schema.org/InStock",
    "itemCondition": "https://schema.org/NewCondition",
    "seller": {
      "@type": "Organization",
      "name": "Utekos",
      "legalName": "KELC AS",
      "url": "https://utekos.no"
    },
    "shippingDetails": stapperShippingDetails,
    "hasMerchantReturnPolicy": stapperReturnPolicy
  },
  "brand": {
    "@type": "Brand",
    "name": "Utekos"
  },
  "category": "Luggage & Bags",
  "material": [
    "Polyester"
  ],
  "additionalProperty": [
    {
      "@type": "PropertyValue",
      "name": "Strammestropper",
      "value": "Fire justerbare strammestropper"
    }
  ],
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": 5,
    "reviewCount": 2,
    "bestRating": 5,
    "worstRating": 1
  },
  "review": stapperReviews
};
