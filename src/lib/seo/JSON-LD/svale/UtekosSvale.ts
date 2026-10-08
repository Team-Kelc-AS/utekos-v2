import type {
  ItemAvailability,
  MerchantReturnEnumeration,
  MerchantReturnPolicy,
  Offer,
  OfferShippingDetails,
  Product,
  ProductGroup,
  ReturnFeesEnumeration,
  ReturnMethodEnumeration,
  WithContext,
} from 'schema-dts';

/** Egne fargeforslag for JSON-LD. Dette endrer ikke Shopify-dataene. */
export type SvaleColor = 'Vargnatt' | 'Fjellblå' | 'Havdyp' | 'Fjellnatt' | 'Overcast';

// Rene URL-alternativer gir verdiforslag uten Schema.orgs øvrige objektformer.
type SchemaUrl<T> = Extract<T, `https://schema.org/${string}`>;

export type SvaleReturnPolicy = Omit<
  MerchantReturnPolicy,
  'returnPolicyCategory' | 'returnFees' | 'returnMethod'
> & {
  applicableCountry: string | string[];
  returnPolicyCategory: SchemaUrl<MerchantReturnEnumeration>;
  returnFees?: SchemaUrl<ReturnFeesEnumeration>;
  returnMethod?: SchemaUrl<ReturnMethodEnumeration> | SchemaUrl<ReturnMethodEnumeration>[];
};

/** Pris, valuta og lagerstatus tilhører tilbudet på den enkelte varianten. */
export type SvaleOffer = Omit<
  Extract<Offer, { '@type': 'Offer' }>,
  'availability' | 'hasMerchantReturnPolicy'
> & {
  '@type': 'Offer';
  url: string;
  price: number | string;
  priceCurrency: 'NOK';
  availability: SchemaUrl<ItemAvailability>;
  hasMerchantReturnPolicy?: SvaleReturnPolicy;
};

/**
 * Ett Product per kjøpbar kombinasjon av farge og størrelse.
 * SKU må være unik, og URL-en må åpne siden med riktig variant valgt.
 * Øvrige Schema.org-felter foreslås også av editoren.
 */
export type SvaleVariant = Omit<Extract<Product, { '@type': 'Product' }>, 'color' | 'offers'> & {
  '@type': 'Product';
  name: string;
  sku: string;
  url: string;
  image: string[];
  color?: SvaleColor;
  size: string;
  offers: SvaleOffer;
};

export type UtekosSvale = Omit<WithContext<ProductGroup>, 'hasVariant'> & {
  productGroupID: string;
  hasVariant: SvaleVariant[];
};

/**
 * Manuelt redigerbart øyeblikksbilde, hentet 2026-10-08. Ingen automatisk oppdatering.
 * Kilder: Shopify Admin (produkt, SKU/GTIN, kategori og metafelt/metaobjekter),
 * Storefront API 2026-10 med country: NO (varianter, pris, vekt og bilder),
 * Judge.me offentlig produktwidget (0 omtaler, alle hentet),
 * src/lib/products/content.ts og sizeGuideData.ts der relevant, samt
 * https://utekos.no/frakt-og-retur (frakt/retur kontrollert samme dag).
 *
 * Til gjennomgang:
 * - Alle tre tilbud er bekreftet i Norge-markedet ved siste kontroll.
 * - Shopify har fargemetafeltene Overcast og Havdyp, men variantene har bare Size.
 * - Bildene viser mørke plagg. color er utelatt fordi fargekoblingen ikke er entydig.
 * - CloudWave™ står i fabric-metafeltet; materialer bruker generiske materialnavn.
 * - Ingen mål eller materialprosenter er kopiert fra TechDown. Svale arver foreløpig
 * - TechDown-tekst i lokal UI, så her brukes Svales egen Shopify-beskrivelse.
 * - Judge.me returnerte 0 omtaler: aggregateRating og review er utelatt.
 * - Bilder følger eksplisitte variantkoblinger i Shopify og er åpnet visuelt.
 *   Størrelsen og fyllmaterialet kan ikke bekreftes fra bilder alene.
 * - colorSwatch er utelatt: fargemetafeltene har hex, men ingen bilde-URL.
 * - hasGS1DigitalLink, mpn, importør og produsent er ikke gjettet.
 * - Beskrivelsen er Shopifys tekst. Pris, kjøpbarhet og omtaler er ferskvare.
 * - Produktlayouten bruker kontrollerte fakta herfra; pris, lager og omtaler hentes live.
 */

const svaleDescription = "Skapt for kveldene der du ganske enkelt vil bli sittende ute litt lenger. Svale kombinerer den geniale YKK® Dual V-Zip™-ventilasjonen med perfekt avstemt varme for ren utendørs velvære.";

// Frakt gjelder én enhet til oppgitt pris. 2–5 virkedager etter henting; ingen gjettet håndteringstid.
export const svaleShippingDetails: OfferShippingDetails = {
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

export const svaleReturnPolicy: SvaleReturnPolicy = {
  "@type": "MerchantReturnPolicy",
  "applicableCountry": "NO",
  "returnPolicyCountry": "NO",
  "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
  "merchantReturnDays": 14,
  "returnMethod": "https://schema.org/ReturnByMail",
  "returnFees": "https://schema.org/ReturnFeesCustomerResponsibility",
  "merchantReturnLink": "https://utekos.no/frakt-og-retur"
};

export const svaleVariants: SvaleVariant[] = [
  {
    "@type": "Product",
    "@id": "https://utekos.no/produkter/utekos-svale#variant-67548601123064",
    "name": "Utekos Svale™, Middels",
    "sku": "UTK-SVA-MID",
    "productID": "gid://shopify/ProductVariant/67548601123064",
    "gtin14": "07090062980191",
    "url": "https://utekos.no/produkter/utekos-svale?variant=67548601123064",
    "image": [
      "https://cdn.shopify.com/s/files/1/0634/2154/6744/files/Svale_2_2_abd01753-a361-4911-b38b-2e55cb322b13.webp?v=1791283537"
    ],
    "size": "Middels",
    "description": svaleDescription,
    "isVariantOf": {
      "@id": "https://utekos.no/produkter/utekos-svale#product-group"
    },
    "weight": {
      "@type": "QuantitativeValue",
      "value": 1.1,
      "unitCode": "KGM"
    },
    "offers": {
      "@type": "Offer",
      "url": "https://utekos.no/produkter/utekos-svale?variant=67548601123064",
      "price": "1990.0",
      "priceCurrency": "NOK",
      "itemCondition": "https://schema.org/NewCondition",
      "seller": {
        "@type": "Organization",
        "name": "Utekos",
        "legalName": "KELC AS",
        "url": "https://utekos.no"
      },
      "shippingDetails": svaleShippingDetails,
      "hasMerchantReturnPolicy": svaleReturnPolicy,
      "availability": "https://schema.org/InStock"
    }
  },
  {
    "@type": "Product",
    "@id": "https://utekos.no/produkter/utekos-svale#variant-67548601155832",
    "name": "Utekos Svale™, Stor",
    "sku": "UTK-SVA-STOR",
    "productID": "gid://shopify/ProductVariant/67548601155832",
    "gtin14": "07090062980214",
    "url": "https://utekos.no/produkter/utekos-svale?variant=67548601155832",
    "image": [
      "https://cdn.shopify.com/s/files/1/0634/2154/6744/files/Svale_3_2_da4d298b-6961-4801-bfce-16e91dfde6a3.webp?v=1791283556"
    ],
    "size": "Stor",
    "description": svaleDescription,
    "isVariantOf": {
      "@id": "https://utekos.no/produkter/utekos-svale#product-group"
    },
    "weight": {
      "@type": "QuantitativeValue",
      "value": 1.2,
      "unitCode": "KGM"
    },
    "offers": {
      "@type": "Offer",
      "url": "https://utekos.no/produkter/utekos-svale?variant=67548601155832",
      "price": "1990.0",
      "priceCurrency": "NOK",
      "itemCondition": "https://schema.org/NewCondition",
      "seller": {
        "@type": "Organization",
        "name": "Utekos",
        "legalName": "KELC AS",
        "url": "https://utekos.no"
      },
      "shippingDetails": svaleShippingDetails,
      "hasMerchantReturnPolicy": svaleReturnPolicy,
      "availability": "https://schema.org/InStock"
    }
  },
  {
    "@type": "Product",
    "@id": "https://utekos.no/produkter/utekos-svale#variant-67548601188600",
    "name": "Utekos Svale™, Større",
    "sku": "UTK-SVA-XXL",
    "productID": "gid://shopify/ProductVariant/67548601188600",
    "gtin14": "07090062980207",
    "url": "https://utekos.no/produkter/utekos-svale?variant=67548601188600",
    "image": [
      "https://cdn.shopify.com/s/files/1/0634/2154/6744/files/Svale_1_1_de964587-391f-457d-9a58-6f1146818276.webp?v=1791283571"
    ],
    "size": "Større",
    "description": svaleDescription,
    "isVariantOf": {
      "@id": "https://utekos.no/produkter/utekos-svale#product-group"
    },
    "weight": {
      "@type": "QuantitativeValue",
      "value": 1.3,
      "unitCode": "KGM"
    },
    "offers": {
      "@type": "Offer",
      "url": "https://utekos.no/produkter/utekos-svale?variant=67548601188600",
      "price": "1990.0",
      "priceCurrency": "NOK",
      "itemCondition": "https://schema.org/NewCondition",
      "seller": {
        "@type": "Organization",
        "name": "Utekos",
        "legalName": "KELC AS",
        "url": "https://utekos.no"
      },
      "shippingDetails": svaleShippingDetails,
      "hasMerchantReturnPolicy": svaleReturnPolicy,
      "availability": "https://schema.org/InStock"
    }
  }
];

export const utekosSvale: UtekosSvale = {
  "@context": "https://schema.org",
  "@type": "ProductGroup",
  "@id": "https://utekos.no/produkter/utekos-svale#product-group",
  "productGroupID": "15381098889464",
  "name": "Utekos Svale™",
  "url": "https://utekos.no/produkter/utekos-svale",
  "description": svaleDescription,
  "image": [
    "https://cdn.shopify.com/s/files/1/0634/2154/6744/files/Svale_2_2_abd01753-a361-4911-b38b-2e55cb322b13.webp?v=1791283537",
    "https://cdn.shopify.com/s/files/1/0634/2154/6744/files/Svale_3_2_da4d298b-6961-4801-bfce-16e91dfde6a3.webp?v=1791283556",
    "https://cdn.shopify.com/s/files/1/0634/2154/6744/files/Svale_1_1_de964587-391f-457d-9a58-6f1146818276.webp?v=1791283571"
  ],
  "brand": {
    "@type": "Brand",
    "name": "Utekos"
  },
  "category": "Apparel & Accessories > Clothing > Outerwear > Coats & Jackets > Puffer Jackets",
  "material": [
    "Nylon",
    "Polyester",
    "Syntetisk isolasjon"
  ],
  "audience": {
    "@type": "PeopleAudience",
    "suggestedGender": "unisex",
    "audienceType": "Voksne"
  },
  "variesBy": [
    "https://schema.org/size"
  ],
  "additionalProperty": [
    {
      "@type": "PropertyValue",
      "name": "Glidelåser",
      "value": "YKK® Dual V-Zip™"
    }
  ],
  "hasVariant": svaleVariants
};
