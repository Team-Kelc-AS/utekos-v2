import type {
  ItemAvailability,
  MerchantReturnEnumeration,
  MerchantReturnPolicy,
  Offer,
  OfferShippingDetails,
  Review,
  Product,
  ProductGroup,
  ReturnFeesEnumeration,
  ReturnMethodEnumeration,
  WithContext,
} from 'schema-dts';

/** Egne fargeforslag for JSON-LD. Dette endrer ikke Shopify-dataene. */
export type DunColor = 'Vargnatt' | 'Fjellblå' | 'Havdyp' | 'Fjellnatt';

// Rene URL-alternativer gir verdiforslag uten Schema.orgs øvrige objektformer.
type SchemaUrl<T> = Extract<T, `https://schema.org/${string}`>;

export type DunReturnPolicy = Omit<
  MerchantReturnPolicy,
  'returnPolicyCategory' | 'returnFees' | 'returnMethod'
> & {
  applicableCountry: string | string[];
  returnPolicyCategory: SchemaUrl<MerchantReturnEnumeration>;
  returnFees?: SchemaUrl<ReturnFeesEnumeration>;
  returnMethod?: SchemaUrl<ReturnMethodEnumeration> | SchemaUrl<ReturnMethodEnumeration>[];
};

/** Pris, valuta og lagerstatus tilhører tilbudet på den enkelte varianten. */
export type DunOffer = Omit<
  Extract<Offer, { '@type': 'Offer' }>,
  'availability' | 'hasMerchantReturnPolicy'
> & {
  '@type': 'Offer';
  url: string;
  price: number | string;
  priceCurrency: 'NOK';
  availability: SchemaUrl<ItemAvailability>;
  hasMerchantReturnPolicy?: DunReturnPolicy;
};

/**
 * Ett Product per kjøpbar kombinasjon av farge og størrelse.
 * SKU må være unik, og URL-en må åpne siden med riktig variant valgt.
 * Øvrige Schema.org-felter foreslås også av editoren.
 */
export type DunVariant = Omit<Extract<Product, { '@type': 'Product' }>, 'color' | 'offers'> & {
  '@type': 'Product';
  name: string;
  sku: string;
  url: string;
  image: string[];
  color: DunColor;
  size: string;
  offers: DunOffer;
};

export type UtekosDun = Omit<WithContext<ProductGroup>, 'hasVariant'> & {
  productGroupID: string;
  hasVariant: DunVariant[];
};

/**
 * Manuelt redigerbart øyeblikksbilde, hentet 2026-10-08. Ingen automatisk oppdatering.
 * Kilder: Shopify Admin (produkt, SKU/GTIN, kategori og metafelt/metaobjekter),
 * Storefront API 2026-10 med country: NO (varianter, pris, vekt og bilder),
 * Judge.me offentlig produktwidget (1 omtaler, alle hentet),
 * src/lib/products/content.ts og sizeGuideData.ts der relevant, samt
 * https://utekos.no/frakt-og-retur (frakt/retur kontrollert samme dag).
 *
 * Til gjennomgang:
 * - Alle fire varianter er utsolgt ved oppslaget.
 * - Fjellblå-variantene er knyttet til Mikrofiber-Fjell-Full-Front-1200x1200.webp
 * - i Shopify. Bildet viser et blått Utekos-plagg, men fylltype kan ikke bekreftes
 * - visuelt. Kontroller denne bildekoblingen før bruk.
 * - Vekt følger Shopify (1,1 kg), mens lokal produkttekst sier ca. 1000 g.
 * - Mål følger gjeldende utekosData i sizeGuideData.ts.
 * - Bilder følger eksplisitte variantkoblinger i Shopify og er åpnet visuelt.
 *   Størrelsen og fyllmaterialet kan ikke bekreftes fra bilder alene.
 * - colorSwatch er utelatt: fargemetafeltene har hex, men ingen bilde-URL.
 * - hasGS1DigitalLink, mpn, importør og produsent er ikke gjettet.
 * - Beskrivelsen er Shopifys tekst. Pris, kjøpbarhet og omtaler er ferskvare.
 * - Produktlayouten bruker kontrollerte fakta herfra; pris, lager og omtaler hentes live.
 */

const dunDescription = "Utekos Dun™ er det varmeste alternativet i Utekos sitt banebrytende konsept for utendørs velvære. Skapt for hytte, båt, bobil og terrasseliv. Lar deg skreddersy passform, regulere ventilasjonen og veksle mellom ulike funksjonelle moduser. Varianten har kolleksjonens beste varme-til-vekt-forhold og består av en fordeling mellom 90% andedun og 10% fjær.";

// Frakt gjelder én enhet til oppgitt pris. 2–5 virkedager etter henting; ingen gjettet håndteringstid.
export const dunShippingDetails: OfferShippingDetails = {
  "@type": "OfferShippingDetails",
  "shippingDestination": {
    "@type": "DefinedRegion",
    "addressCountry": "NO"
  },
  "shippingRate": {
    "@type": "MonetaryAmount",
    "value": 0,
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

export const dunReturnPolicy: DunReturnPolicy = {
  "@type": "MerchantReturnPolicy",
  "applicableCountry": "NO",
  "returnPolicyCountry": "NO",
  "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
  "merchantReturnDays": 14,
  "returnMethod": "https://schema.org/ReturnByMail",
  "returnFees": "https://schema.org/ReturnFeesCustomerResponsibility",
  "merchantReturnLink": "https://utekos.no/frakt-og-retur"
};

export const dunVariants: DunVariant[] = [
  {
    "@type": "Product",
    "@id": "https://utekos.no/produkter/utekos-dun#variant-42903234609400",
    "name": "Utekos Dun™ Vargnatt, Medium",
    "sku": "UTEKOS-DUN-M-SVART",
    "productID": "gid://shopify/ProductVariant/42903234609400",
    "gtin14": "07090062980139",
    "url": "https://utekos.no/produkter/utekos-dun?variant=42903234609400",
    "image": [
      "https://cdn.shopify.com/s/files/1/0634/2154/6744/files/Dun-Vargnatt-Full-Front-1200x1200.webp?v=1786208128"
    ],
    "color": "Vargnatt",
    "size": "Medium",
    "description": dunDescription,
    "isVariantOf": {
      "@id": "https://utekos.no/produkter/utekos-dun#product-group"
    },
    "weight": {
      "@type": "QuantitativeValue",
      "value": 1.1,
      "unitCode": "KGM"
    },
    "hasMeasurement": [
      {
        "@type": "QuantitativeValue",
        "name": "Total lengde (nakke til bunn)",
        "value": 170,
        "unitCode": "CMT"
      },
      {
        "@type": "QuantitativeValue",
        "name": "Brystvidde (flatmål)",
        "value": 66,
        "unitCode": "CMT"
      },
      {
        "@type": "QuantitativeValue",
        "name": "Armlengde (fra senter bryst)",
        "value": 85,
        "unitCode": "CMT"
      },
      {
        "@type": "QuantitativeValue",
        "name": "Armlengde (fra kropp)",
        "value": 55,
        "unitCode": "CMT"
      },
      {
        "@type": "QuantitativeValue",
        "name": "Bredde nederst (flatmål)",
        "value": 66,
        "unitCode": "CMT"
      },
      {
        "@type": "QuantitativeValue",
        "name": "Lengde på glidelås (V-hals)",
        "value": 73,
        "unitCode": "CMT"
      },
      {
        "@type": "QuantitativeValue",
        "name": "Høyde på hette",
        "value": 35,
        "unitCode": "CMT"
      },
      {
        "@type": "QuantitativeValue",
        "name": "Høyde på baklomme",
        "value": 42,
        "unitCode": "CMT"
      },
      {
        "@type": "QuantitativeValue",
        "name": "Fullengde inkl. hette",
        "value": 205,
        "unitCode": "CMT"
      }
    ],
    "offers": {
      "@type": "Offer",
      "url": "https://utekos.no/produkter/utekos-dun?variant=42903234609400",
      "price": "2490.0",
      "priceCurrency": "NOK",
      "availability": "https://schema.org/OutOfStock",
      "itemCondition": "https://schema.org/NewCondition",
      "seller": {
        "@type": "Organization",
        "name": "Utekos",
        "legalName": "KELC AS",
        "url": "https://utekos.no"
      },
      "shippingDetails": dunShippingDetails,
      "hasMerchantReturnPolicy": dunReturnPolicy
    }
  },
  {
    "@type": "Product",
    "@id": "https://utekos.no/produkter/utekos-dun#variant-42903234674936",
    "name": "Utekos Dun™ Vargnatt, Large",
    "sku": "UTEKOS-DUN-L-SVART",
    "productID": "gid://shopify/ProductVariant/42903234674936",
    "gtin14": "07090062980146",
    "url": "https://utekos.no/produkter/utekos-dun?variant=42903234674936",
    "image": [
      "https://cdn.shopify.com/s/files/1/0634/2154/6744/files/Dun-Vargnatt-Full-Front-1200x1200.webp?v=1786208128"
    ],
    "color": "Vargnatt",
    "size": "Large",
    "description": dunDescription,
    "isVariantOf": {
      "@id": "https://utekos.no/produkter/utekos-dun#product-group"
    },
    "weight": {
      "@type": "QuantitativeValue",
      "value": 1.1,
      "unitCode": "KGM"
    },
    "hasMeasurement": [
      {
        "@type": "QuantitativeValue",
        "name": "Total lengde (nakke til bunn)",
        "value": 200,
        "unitCode": "CMT"
      },
      {
        "@type": "QuantitativeValue",
        "name": "Brystvidde (flatmål)",
        "value": 75,
        "unitCode": "CMT"
      },
      {
        "@type": "QuantitativeValue",
        "name": "Armlengde (fra senter bryst)",
        "value": 100,
        "unitCode": "CMT"
      },
      {
        "@type": "QuantitativeValue",
        "name": "Armlengde (fra kropp)",
        "value": 65,
        "unitCode": "CMT"
      },
      {
        "@type": "QuantitativeValue",
        "name": "Bredde nederst (flatmål)",
        "value": 75,
        "unitCode": "CMT"
      },
      {
        "@type": "QuantitativeValue",
        "name": "Lengde på glidelås (V-hals)",
        "value": 85.5,
        "unitCode": "CMT"
      },
      {
        "@type": "QuantitativeValue",
        "name": "Høyde på hette",
        "value": 35,
        "unitCode": "CMT"
      },
      {
        "@type": "QuantitativeValue",
        "name": "Høyde på baklomme",
        "value": 42,
        "unitCode": "CMT"
      },
      {
        "@type": "QuantitativeValue",
        "name": "Fullengde inkl. hette",
        "value": 235,
        "unitCode": "CMT"
      }
    ],
    "offers": {
      "@type": "Offer",
      "url": "https://utekos.no/produkter/utekos-dun?variant=42903234674936",
      "price": "2490.0",
      "priceCurrency": "NOK",
      "availability": "https://schema.org/OutOfStock",
      "itemCondition": "https://schema.org/NewCondition",
      "seller": {
        "@type": "Organization",
        "name": "Utekos",
        "legalName": "KELC AS",
        "url": "https://utekos.no"
      },
      "shippingDetails": dunShippingDetails,
      "hasMerchantReturnPolicy": dunReturnPolicy
    }
  },
  {
    "@type": "Product",
    "@id": "https://utekos.no/produkter/utekos-dun#variant-42903234642168",
    "name": "Utekos Dun™ Fjellblå, Medium",
    "sku": "UTEKOS-DUN-M-BLUE",
    "productID": "gid://shopify/ProductVariant/42903234642168",
    "gtin14": "07090062980115",
    "url": "https://utekos.no/produkter/utekos-dun?variant=42903234642168",
    "image": [
      "https://cdn.shopify.com/s/files/1/0634/2154/6744/files/Mikrofiber-Fjell-Full-Front-1200x1200.webp?v=1786208323"
    ],
    "color": "Fjellblå",
    "size": "Medium",
    "description": dunDescription,
    "isVariantOf": {
      "@id": "https://utekos.no/produkter/utekos-dun#product-group"
    },
    "weight": {
      "@type": "QuantitativeValue",
      "value": 1.1,
      "unitCode": "KGM"
    },
    "hasMeasurement": [
      {
        "@type": "QuantitativeValue",
        "name": "Total lengde (nakke til bunn)",
        "value": 170,
        "unitCode": "CMT"
      },
      {
        "@type": "QuantitativeValue",
        "name": "Brystvidde (flatmål)",
        "value": 66,
        "unitCode": "CMT"
      },
      {
        "@type": "QuantitativeValue",
        "name": "Armlengde (fra senter bryst)",
        "value": 85,
        "unitCode": "CMT"
      },
      {
        "@type": "QuantitativeValue",
        "name": "Armlengde (fra kropp)",
        "value": 55,
        "unitCode": "CMT"
      },
      {
        "@type": "QuantitativeValue",
        "name": "Bredde nederst (flatmål)",
        "value": 66,
        "unitCode": "CMT"
      },
      {
        "@type": "QuantitativeValue",
        "name": "Lengde på glidelås (V-hals)",
        "value": 73,
        "unitCode": "CMT"
      },
      {
        "@type": "QuantitativeValue",
        "name": "Høyde på hette",
        "value": 35,
        "unitCode": "CMT"
      },
      {
        "@type": "QuantitativeValue",
        "name": "Høyde på baklomme",
        "value": 42,
        "unitCode": "CMT"
      },
      {
        "@type": "QuantitativeValue",
        "name": "Fullengde inkl. hette",
        "value": 205,
        "unitCode": "CMT"
      }
    ],
    "offers": {
      "@type": "Offer",
      "url": "https://utekos.no/produkter/utekos-dun?variant=42903234642168",
      "price": "2490.0",
      "priceCurrency": "NOK",
      "availability": "https://schema.org/OutOfStock",
      "itemCondition": "https://schema.org/NewCondition",
      "seller": {
        "@type": "Organization",
        "name": "Utekos",
        "legalName": "KELC AS",
        "url": "https://utekos.no"
      },
      "shippingDetails": dunShippingDetails,
      "hasMerchantReturnPolicy": dunReturnPolicy
    }
  },
  {
    "@type": "Product",
    "@id": "https://utekos.no/produkter/utekos-dun#variant-42903234707704",
    "name": "Utekos Dun™ Fjellblå, Large",
    "sku": "UTEKOS-DUN-L-BLUE",
    "productID": "gid://shopify/ProductVariant/42903234707704",
    "gtin14": "07090062980122",
    "url": "https://utekos.no/produkter/utekos-dun?variant=42903234707704",
    "image": [
      "https://cdn.shopify.com/s/files/1/0634/2154/6744/files/Mikrofiber-Fjell-Full-Front-1200x1200.webp?v=1786208323"
    ],
    "color": "Fjellblå",
    "size": "Large",
    "description": dunDescription,
    "isVariantOf": {
      "@id": "https://utekos.no/produkter/utekos-dun#product-group"
    },
    "weight": {
      "@type": "QuantitativeValue",
      "value": 1.1,
      "unitCode": "KGM"
    },
    "hasMeasurement": [
      {
        "@type": "QuantitativeValue",
        "name": "Total lengde (nakke til bunn)",
        "value": 200,
        "unitCode": "CMT"
      },
      {
        "@type": "QuantitativeValue",
        "name": "Brystvidde (flatmål)",
        "value": 75,
        "unitCode": "CMT"
      },
      {
        "@type": "QuantitativeValue",
        "name": "Armlengde (fra senter bryst)",
        "value": 100,
        "unitCode": "CMT"
      },
      {
        "@type": "QuantitativeValue",
        "name": "Armlengde (fra kropp)",
        "value": 65,
        "unitCode": "CMT"
      },
      {
        "@type": "QuantitativeValue",
        "name": "Bredde nederst (flatmål)",
        "value": 75,
        "unitCode": "CMT"
      },
      {
        "@type": "QuantitativeValue",
        "name": "Lengde på glidelås (V-hals)",
        "value": 85.5,
        "unitCode": "CMT"
      },
      {
        "@type": "QuantitativeValue",
        "name": "Høyde på hette",
        "value": 35,
        "unitCode": "CMT"
      },
      {
        "@type": "QuantitativeValue",
        "name": "Høyde på baklomme",
        "value": 42,
        "unitCode": "CMT"
      },
      {
        "@type": "QuantitativeValue",
        "name": "Fullengde inkl. hette",
        "value": 235,
        "unitCode": "CMT"
      }
    ],
    "offers": {
      "@type": "Offer",
      "url": "https://utekos.no/produkter/utekos-dun?variant=42903234707704",
      "price": "2490.0",
      "priceCurrency": "NOK",
      "availability": "https://schema.org/OutOfStock",
      "itemCondition": "https://schema.org/NewCondition",
      "seller": {
        "@type": "Organization",
        "name": "Utekos",
        "legalName": "KELC AS",
        "url": "https://utekos.no"
      },
      "shippingDetails": dunShippingDetails,
      "hasMerchantReturnPolicy": dunReturnPolicy
    }
  }
];

export const dunReviews: Review[] = [
  {
    "@type": "Review",
    "@id": "https://utekos.no/produkter/utekos-dun#review-f93c1f4a-14e4-41b6-bd89-f423129ca4b7",
    "author": {
      "@type": "Person",
      "name": "Mathias"
    },
    "datePublished": "2025-11-01T14:21:24Z",
    "reviewBody": "Helt genialt å dra frem i veldig mange situasjoner. Anbefales!",
    "reviewRating": {
      "@type": "Rating",
      "ratingValue": 5,
      "bestRating": 5,
      "worstRating": 1
    }
  }
];

export const utekosDun: UtekosDun = {
  "@context": "https://schema.org",
  "@type": "ProductGroup",
  "@id": "https://utekos.no/produkter/utekos-dun#product-group",
  "productGroupID": "7710040391928",
  "name": "Utekos Dun™",
  "url": "https://utekos.no/produkter/utekos-dun",
  "description": dunDescription,
  "image": [
    "https://cdn.shopify.com/s/files/1/0634/2154/6744/files/Dun-Vargnatt-Full-Front-1200x1200.webp?v=1786208128",
    "https://cdn.shopify.com/s/files/1/0634/2154/6744/files/Mikrofiber-Fjell-Full-Front-1200x1200.webp?v=1786208323"
  ],
  "brand": {
    "@type": "Brand",
    "name": "Utekos"
  },
  "category": "Apparel & Accessories > Clothing > Outerwear > Coats & Jackets",
  "material": [
    "Nylon",
    "Andedun",
    "Fjær"
  ],
  "audience": {
    "@type": "PeopleAudience",
    "suggestedGender": "unisex",
    "audienceType": "Voksne"
  },
  "variesBy": [
    "https://schema.org/color",
    "https://schema.org/size"
  ],
  "additionalProperty": [
    {
      "@type": "PropertyValue",
      "name": "Skallstoff",
      "value": "20D 380T nylon med DWR"
    },
    {
      "@type": "PropertyValue",
      "name": "Fyllfordeling",
      "value": "90 % andedun og 10 % fjær"
    },
    {
      "@type": "PropertyValue",
      "name": "Fyllvekt",
      "value": "400 g"
    },
    {
      "@type": "PropertyValue",
      "name": "Fill power",
      "value": "650+ fp"
    },
    {
      "@type": "PropertyValue",
      "name": "Glidelåser",
      "value": "YKK®"
    }
  ],
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": 5,
    "reviewCount": 1,
    "bestRating": 5,
    "worstRating": 1
  },
  "review": dunReviews,
  "hasVariant": dunVariants
};
