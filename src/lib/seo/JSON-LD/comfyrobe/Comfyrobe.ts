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
export type ComfyrobeColor = 'Vargnatt' | 'Fjellblå' | 'Havdyp' | 'Fjellnatt';

// Rene URL-alternativer gir verdiforslag uten Schema.orgs øvrige objektformer.
type SchemaUrl<T> = Extract<T, `https://schema.org/${string}`>;

export type ComfyrobeReturnPolicy = Omit<
  MerchantReturnPolicy,
  'returnPolicyCategory' | 'returnFees' | 'returnMethod'
> & {
  applicableCountry: string | string[];
  returnPolicyCategory: SchemaUrl<MerchantReturnEnumeration>;
  returnFees?: SchemaUrl<ReturnFeesEnumeration>;
  returnMethod?: SchemaUrl<ReturnMethodEnumeration> | SchemaUrl<ReturnMethodEnumeration>[];
};

/** Pris, valuta og lagerstatus tilhører tilbudet på den enkelte varianten. */
export type ComfyrobeOffer = Omit<
  Extract<Offer, { '@type': 'Offer' }>,
  'availability' | 'hasMerchantReturnPolicy'
> & {
  '@type': 'Offer';
  url: string;
  price: number | string;
  priceCurrency: 'NOK';
  availability: SchemaUrl<ItemAvailability>;
  hasMerchantReturnPolicy?: ComfyrobeReturnPolicy;
};

/**
 * Ett Product per kjøpbar kombinasjon av farge og størrelse.
 * SKU må være unik, og URL-en må åpne siden med riktig variant valgt.
 * Øvrige Schema.org-felter foreslås også av editoren.
 */
export type ComfyrobeVariant = Omit<Extract<Product, { '@type': 'Product' }>, 'color' | 'offers'> & {
  '@type': 'Product';
  name: string;
  sku: string;
  url: string;
  image: string[];
  color: ComfyrobeColor;
  size: string;
  offers: ComfyrobeOffer;
};

export type Comfyrobe = Omit<WithContext<ProductGroup>, 'hasVariant'> & {
  productGroupID: string;
  hasVariant: ComfyrobeVariant[];
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
 * - Variantnavnene er XS, M og XL; SKU-ene slutter på S, M og L. Begge er
 * - beholdt slik Shopify oppgir dem. GTIN mangler for M og er derfor utelatt.
 * - Metafeltet mc-facebook.colour sier Vargnatt, men variantvalgene sier Fjellnatt.
 * - color følger derfor variantvalgene. Bildene viser mørkeblå kåper med lyst fôr.
 * - Vekt følger Shopify: XS 600 g, M 900 g, XL 700 g; kontroller dette ved behov.
 * - Mål for XS og XL følger sizeGuideData.ts. M er utelatt fordi tabellen bruker M/L.
 * - Judge.me returnerte 0 omtaler: aggregateRating og review er utelatt.
 * - Frakten er 99 kr ved kjøp av én til dagens pris; ordresum over 999 kr gir fri frakt.
 * - Bilder følger eksplisitte variantkoblinger i Shopify og er åpnet visuelt.
 *   Størrelsen og fyllmaterialet kan ikke bekreftes fra bilder alene.
 * - colorSwatch er utelatt: fargemetafeltene har hex, men ingen bilde-URL.
 * - hasGS1DigitalLink, mpn, importør og produsent er ikke gjettet.
 * - Beskrivelsen er Shopifys tekst. Pris, kjøpbarhet og omtaler er ferskvare.
 * - Produktlayouten bruker kontrollerte fakta herfra; pris, lager og omtaler hentes live.
 */

const comfyrobeDescription = "Tøff mot været - komfortabel mot deg. Comfyrobe™ kombinerer en vanntett skalljakke (8000mm) med myk og isolerende Sherpa-fleece. Resultatet er en robust helårsjakke som holder deg varm og tørr uansett om du lufter hunden i storm, nyter kaffen på hytteterrassen eller trenger varmen etter et isbad. Med tapede sømmer, pustende membran og smart lufting holder du deg tørr, beskyttet og komfortabel i alle værforhold.";

// Frakt gjelder én enhet til oppgitt pris. 2–5 virkedager etter henting; ingen gjettet håndteringstid.
export const comfyrobeShippingDetails: OfferShippingDetails = {
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

export const comfyrobeReturnPolicy: ComfyrobeReturnPolicy = {
  "@type": "MerchantReturnPolicy",
  "applicableCountry": "NO",
  "returnPolicyCountry": "NO",
  "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
  "merchantReturnDays": 14,
  "returnMethod": "https://schema.org/ReturnByMail",
  "returnFees": "https://schema.org/ReturnFeesCustomerResponsibility",
  "merchantReturnLink": "https://utekos.no/frakt-og-retur"
};

export const comfyrobeVariants: ComfyrobeVariant[] = [
  {
    "@type": "Product",
    "@id": "https://utekos.no/produkter/comfyrobe#variant-43959919051000",
    "name": "Comfyrobe™ Fjellnatt, XS",
    "sku": "COMFYROBE-FJELLNATT-S",
    "productID": "gid://shopify/ProductVariant/43959919051000",
    "gtin14": "07090062980085",
    "url": "https://utekos.no/produkter/comfyrobe?variant=43959919051000",
    "image": [
      "https://cdn.shopify.com/s/files/1/0634/2154/6744/files/Marinebla_vinterparka_med_sherpahette_2_5973a7d8-a150-47e8-853c-9aa2ca1d1094.png?v=1791293034"
    ],
    "color": "Fjellnatt",
    "size": "XS",
    "description": comfyrobeDescription,
    "isVariantOf": {
      "@id": "https://utekos.no/produkter/comfyrobe#product-group"
    },
    "weight": {
      "@type": "QuantitativeValue",
      "value": 600,
      "unitCode": "GRM"
    },
    "hasMeasurement": [
      {
        "@type": "QuantitativeValue",
        "name": "Total lengde (fra HSP til front)",
        "value": 97,
        "unitCode": "CMT"
      },
      {
        "@type": "QuantitativeValue",
        "name": "Glidelåslengde",
        "value": 85,
        "unitCode": "CMT"
      },
      {
        "@type": "QuantitativeValue",
        "name": "Bredde over bryst",
        "value": 65,
        "unitCode": "CMT"
      },
      {
        "@type": "QuantitativeValue",
        "name": "Ermelengde",
        "value": 57,
        "unitCode": "CMT"
      },
      {
        "@type": "QuantitativeValue",
        "name": "Skulderbredde",
        "value": 53,
        "unitCode": "CMT"
      },
      {
        "@type": "QuantitativeValue",
        "name": "Mansjettbredde",
        "value": 14.5,
        "unitCode": "CMT"
      },
      {
        "@type": "QuantitativeValue",
        "name": "Mansjetthøyde",
        "value": 6,
        "unitCode": "CMT"
      },
      {
        "@type": "QuantitativeValue",
        "name": "Splitt-høyde",
        "value": 16,
        "unitCode": "CMT"
      },
      {
        "@type": "QuantitativeValue",
        "name": "Kragehøyde",
        "value": 11,
        "unitCode": "CMT"
      },
      {
        "@type": "QuantitativeValue",
        "name": "Lommehøyde",
        "value": 18,
        "unitCode": "CMT"
      },
      {
        "@type": "QuantitativeValue",
        "name": "Hettehøyde",
        "value": 35,
        "unitCode": "CMT"
      },
      {
        "@type": "QuantitativeValue",
        "name": "Hettebredde",
        "value": 27,
        "unitCode": "CMT"
      },
      {
        "@type": "QuantitativeValue",
        "name": "Underarmsbredde",
        "value": 19,
        "unitCode": "CMT"
      },
      {
        "@type": "QuantitativeValue",
        "name": "Ermehull",
        "value": 32,
        "unitCode": "CMT"
      }
    ],
    "offers": {
      "@type": "Offer",
      "url": "https://utekos.no/produkter/comfyrobe?variant=43959919051000",
      "price": "845.0",
      "priceCurrency": "NOK",
      "availability": "https://schema.org/InStock",
      "itemCondition": "https://schema.org/NewCondition",
      "seller": {
        "@type": "Organization",
        "name": "Utekos",
        "legalName": "KELC AS",
        "url": "https://utekos.no"
      },
      "shippingDetails": comfyrobeShippingDetails,
      "hasMerchantReturnPolicy": comfyrobeReturnPolicy
    }
  },
  {
    "@type": "Product",
    "@id": "https://utekos.no/produkter/comfyrobe#variant-43959919083768",
    "name": "Comfyrobe™ Fjellnatt, M",
    "sku": "COMFYROBE-FJELLNATT-M",
    "productID": "gid://shopify/ProductVariant/43959919083768",
    "url": "https://utekos.no/produkter/comfyrobe?variant=43959919083768",
    "image": [
      "https://cdn.shopify.com/s/files/1/0634/2154/6744/files/07090062980092.png?v=1781139229"
    ],
    "color": "Fjellnatt",
    "size": "M",
    "description": comfyrobeDescription,
    "isVariantOf": {
      "@id": "https://utekos.no/produkter/comfyrobe#product-group"
    },
    "weight": {
      "@type": "QuantitativeValue",
      "value": 900,
      "unitCode": "GRM"
    },
    "offers": {
      "@type": "Offer",
      "url": "https://utekos.no/produkter/comfyrobe?variant=43959919083768",
      "price": "845.0",
      "priceCurrency": "NOK",
      "availability": "https://schema.org/OutOfStock",
      "itemCondition": "https://schema.org/NewCondition",
      "seller": {
        "@type": "Organization",
        "name": "Utekos",
        "legalName": "KELC AS",
        "url": "https://utekos.no"
      },
      "shippingDetails": comfyrobeShippingDetails,
      "hasMerchantReturnPolicy": comfyrobeReturnPolicy
    }
  },
  {
    "@type": "Product",
    "@id": "https://utekos.no/produkter/comfyrobe#variant-43959919116536",
    "name": "Comfyrobe™ Fjellnatt, XL",
    "sku": "COMFYROBE-FJELLNATT-L",
    "productID": "gid://shopify/ProductVariant/43959919116536",
    "gtin14": "07090062980092",
    "url": "https://utekos.no/produkter/comfyrobe?variant=43959919116536",
    "image": [
      "https://cdn.shopify.com/s/files/1/0634/2154/6744/files/Marinebla_vinterparkas_med_hette.png?v=1791293202"
    ],
    "color": "Fjellnatt",
    "size": "XL",
    "description": comfyrobeDescription,
    "isVariantOf": {
      "@id": "https://utekos.no/produkter/comfyrobe#product-group"
    },
    "weight": {
      "@type": "QuantitativeValue",
      "value": 700,
      "unitCode": "GRM"
    },
    "hasMeasurement": [
      {
        "@type": "QuantitativeValue",
        "name": "Total lengde (fra HSP til front)",
        "value": 113,
        "unitCode": "CMT"
      },
      {
        "@type": "QuantitativeValue",
        "name": "Glidelåslengde",
        "value": 95,
        "unitCode": "CMT"
      },
      {
        "@type": "QuantitativeValue",
        "name": "Bredde over bryst",
        "value": 77,
        "unitCode": "CMT"
      },
      {
        "@type": "QuantitativeValue",
        "name": "Ermelengde",
        "value": 66,
        "unitCode": "CMT"
      },
      {
        "@type": "QuantitativeValue",
        "name": "Skulderbredde",
        "value": 71,
        "unitCode": "CMT"
      },
      {
        "@type": "QuantitativeValue",
        "name": "Mansjettbredde",
        "value": 18.5,
        "unitCode": "CMT"
      },
      {
        "@type": "QuantitativeValue",
        "name": "Mansjetthøyde",
        "value": 6,
        "unitCode": "CMT"
      },
      {
        "@type": "QuantitativeValue",
        "name": "Splitt-høyde",
        "value": 20,
        "unitCode": "CMT"
      },
      {
        "@type": "QuantitativeValue",
        "name": "Kragehøyde",
        "value": 11,
        "unitCode": "CMT"
      },
      {
        "@type": "QuantitativeValue",
        "name": "Lommehøyde",
        "value": 22,
        "unitCode": "CMT"
      },
      {
        "@type": "QuantitativeValue",
        "name": "Hettehøyde",
        "value": 40,
        "unitCode": "CMT"
      },
      {
        "@type": "QuantitativeValue",
        "name": "Hettebredde",
        "value": 32,
        "unitCode": "CMT"
      },
      {
        "@type": "QuantitativeValue",
        "name": "Underarmsbredde",
        "value": 23,
        "unitCode": "CMT"
      },
      {
        "@type": "QuantitativeValue",
        "name": "Ermehull",
        "value": 38,
        "unitCode": "CMT"
      }
    ],
    "offers": {
      "@type": "Offer",
      "url": "https://utekos.no/produkter/comfyrobe?variant=43959919116536",
      "price": "845.0",
      "priceCurrency": "NOK",
      "availability": "https://schema.org/InStock",
      "itemCondition": "https://schema.org/NewCondition",
      "seller": {
        "@type": "Organization",
        "name": "Utekos",
        "legalName": "KELC AS",
        "url": "https://utekos.no"
      },
      "shippingDetails": comfyrobeShippingDetails,
      "hasMerchantReturnPolicy": comfyrobeReturnPolicy
    }
  }
];

export const comfyrobe: Comfyrobe = {
  "@context": "https://schema.org",
  "@type": "ProductGroup",
  "@id": "https://utekos.no/produkter/comfyrobe#product-group",
  "productGroupID": "8036341448952",
  "name": "Comfyrobe™",
  "url": "https://utekos.no/produkter/comfyrobe",
  "description": comfyrobeDescription,
  "image": [
    "https://cdn.shopify.com/s/files/1/0634/2154/6744/files/Marinebla_vinterparka_med_sherpahette_2_5973a7d8-a150-47e8-853c-9aa2ca1d1094.png?v=1791293034",
    "https://cdn.shopify.com/s/files/1/0634/2154/6744/files/07090062980092.png?v=1781139229",
    "https://cdn.shopify.com/s/files/1/0634/2154/6744/files/Marinebla_vinterparkas_med_hette.png?v=1791293202"
  ],
  "brand": {
    "@type": "Brand",
    "name": "Utekos"
  },
  "category": "Apparel & Accessories > Clothing > Outerwear > Coats & Jackets > Rain Coats",
  "material": [
    "Polyester",
    "Polyuretan",
    "Hamp"
  ],
  "audience": {
    "@type": "PeopleAudience",
    "suggestedGender": "unisex",
    "audienceType": "Voksne"
  },
  "variesBy": [
    "https://schema.org/size"
  ],
  "color": "Fjellnatt",
  "additionalProperty": [
    {
      "@type": "PropertyValue",
      "name": "Ytterstoff",
      "value": "100 % polyester, 130 g/m², med PU-membran"
    },
    {
      "@type": "PropertyValue",
      "name": "Fôrstoff",
      "value": "Sherpa-fleece, 100 % polyester, 250 g/m²"
    },
    {
      "@type": "PropertyValue",
      "name": "Krage",
      "value": "Forsterket med hamp"
    },
    {
      "@type": "PropertyValue",
      "name": "Vannsøyle",
      "value": "8000 mm"
    },
    {
      "@type": "PropertyValue",
      "name": "Pusteevne",
      "value": "3000 g/m²/24 t"
    },
    {
      "@type": "PropertyValue",
      "name": "Glidelåser",
      "value": "YKK®"
    }
  ],
  "hasVariant": comfyrobeVariants
};
