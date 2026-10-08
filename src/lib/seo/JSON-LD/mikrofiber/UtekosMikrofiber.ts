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
export type MikrofiberColor = 'Vargnatt' | 'Fjellblå' | 'Havdyp' | 'Fjellnatt';

// Rene URL-alternativer gir verdiforslag uten Schema.orgs øvrige objektformer.
type SchemaUrl<T> = Extract<T, `https://schema.org/${string}`>;

export type MikrofiberReturnPolicy = Omit<
  MerchantReturnPolicy,
  'returnPolicyCategory' | 'returnFees' | 'returnMethod'
> & {
  applicableCountry: string | string[];
  returnPolicyCategory: SchemaUrl<MerchantReturnEnumeration>;
  returnFees?: SchemaUrl<ReturnFeesEnumeration>;
  returnMethod?: SchemaUrl<ReturnMethodEnumeration> | SchemaUrl<ReturnMethodEnumeration>[];
};

/** Pris, valuta og lagerstatus tilhører tilbudet på den enkelte varianten. */
export type MikrofiberOffer = Omit<
  Extract<Offer, { '@type': 'Offer' }>,
  'availability' | 'hasMerchantReturnPolicy'
> & {
  '@type': 'Offer';
  url: string;
  price: number | string;
  priceCurrency: 'NOK';
  availability: SchemaUrl<ItemAvailability>;
  hasMerchantReturnPolicy?: MikrofiberReturnPolicy;
};

/**
 * Ett Product per kjøpbar kombinasjon av farge og størrelse.
 * SKU må være unik, og URL-en må åpne siden med riktig variant valgt.
 * Øvrige Schema.org-felter foreslås også av editoren.
 */
export type MikrofiberVariant = Omit<Extract<Product, { '@type': 'Product' }>, 'color' | 'offers'> & {
  '@type': 'Product';
  name: string;
  sku: string;
  url: string;
  image: string[];
  color: MikrofiberColor;
  size: string;
  offers: MikrofiberOffer;
};

export type UtekosMikrofiber = Omit<WithContext<ProductGroup>, 'hasVariant'> & {
  productGroupID: string;
  hasVariant: MikrofiberVariant[];
};

/**
 * Manuelt redigerbart øyeblikksbilde, hentet 2026-10-08. Ingen automatisk oppdatering.
 * Kilder: Shopify Admin (produkt, SKU/GTIN, kategori og metafelt/metaobjekter),
 * Storefront API 2026-10 med country: NO (varianter, pris, vekt og bilder),
 * Judge.me offentlig produktwidget (5 omtaler, alle hentet),
 * src/lib/products/content.ts og sizeGuideData.ts der relevant, samt
 * https://utekos.no/frakt-og-retur (frakt/retur kontrollert samme dag).
 *
 * Til gjennomgang:
 * - Vekt følger hver Shopify-variant (700/800 g), ikke generell ca.-vekt.
 * - Mål følger utekosData i sizeGuideData.ts. Eldre resolved_data har andre mål;
 * - den nåværende størrelsestabellen er brukt. Large Fjellblå-bildet viser to farger;
 * - koblingen til den blå varianten kommer fra Shopify, ikke bilderekkefølge.
 * - Bilder følger eksplisitte variantkoblinger i Shopify og er åpnet visuelt.
 *   Størrelsen og fyllmaterialet kan ikke bekreftes fra bilder alene.
 * - colorSwatch er utelatt: fargemetafeltene har hex, men ingen bilde-URL.
 * - hasGS1DigitalLink, mpn, importør og produsent er ikke gjettet.
 * - Beskrivelsen er Shopifys tekst. Pris, kjøpbarhet og omtaler er ferskvare.
 * - Produktlayouten bruker kontrollerte fakta herfra; pris, lager og omtaler hentes live.
 */

const mikrofiberDescription = "Opplev definisjonen av uanstrengt varme. Utekos Mikrofiber™ er vår letteste signaturmodell – konstruert for deg som verdsetter friheten i lav vekt kombinert med robust beskyttelse. Vi har foredlet balansen mellom vekt og styrke: Den avanserte fiber-isolasjonen tørker lynraskt og varmer selv i fuktig klima, mens det flammehemmende ytterstoffet gir en bekymringsfri robusthet som tåler gnister fra bålpannen. Kjernen er den originale 3-i-1 funksjonaliteten som lar deg tilpasse opplevelsen sømløst:Nyt total isolasjon i fulldekket modus, bruk oppfestet modus med utvendige strammere for rask mobilitet over korte avstander, eller transformer plagget fullstendig til en stilig parkas for varig bevegelsesfrihet. Det er her YKK® Dual V-Zip™ spiller hovedrollen. Det V-formede midtpartiet fungerer som en portal til innsiden. Gjennom de to parallelle sporene får du friksjonsfri tilgang til det innvendige heisesystemet, slik at du kan trekke opp lengden og låse den i parkasmodus – alt mens du beholder varmen rundt kroppen. Det er full kontroll over temperatur og uttrykk, uten at du noen gang må eksponere deg for kulden. Dette er mer enn et plagg; det er din mest trofaste følgesvenn. En alltid tilgjengelig ressurs som tar minimal plass, men som leverer maksimal komfort. En investering i forutsigbar komfort og friheten til å forlenge øyeblikket.";

// Frakt gjelder én enhet til oppgitt pris. 2–5 virkedager etter henting; ingen gjettet håndteringstid.
export const mikrofiberShippingDetails: OfferShippingDetails = {
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

export const mikrofiberReturnPolicy: MikrofiberReturnPolicy = {
  "@type": "MerchantReturnPolicy",
  "applicableCountry": "NO",
  "returnPolicyCountry": "NO",
  "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
  "merchantReturnDays": 14,
  "returnMethod": "https://schema.org/ReturnByMail",
  "returnFees": "https://schema.org/ReturnFeesCustomerResponsibility",
  "merchantReturnLink": "https://utekos.no/frakt-og-retur"
};

export const mikrofiberVariants: MikrofiberVariant[] = [
  {
    "@type": "Product",
    "@id": "https://utekos.no/produkter/utekos-mikrofiber#variant-42903231004920",
    "name": "Utekos Mikrofiber™ Vargnatt, Medium",
    "sku": "UTEKOS-MIKRO-M-SVART",
    "productID": "gid://shopify/ProductVariant/42903231004920",
    "gtin14": "07090062980061",
    "url": "https://utekos.no/produkter/utekos-mikrofiber?variant=42903231004920",
    "image": [
      "https://cdn.shopify.com/s/files/1/0634/2154/6744/files/Koselig_vinterkveld_med_oppblasbart_uteantrekk.webp?v=1791290713"
    ],
    "color": "Vargnatt",
    "size": "Medium",
    "description": mikrofiberDescription,
    "isVariantOf": {
      "@id": "https://utekos.no/produkter/utekos-mikrofiber#product-group"
    },
    "weight": {
      "@type": "QuantitativeValue",
      "value": 700,
      "unitCode": "GRM"
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
      "url": "https://utekos.no/produkter/utekos-mikrofiber?variant=42903231004920",
      "price": "1790.0",
      "priceCurrency": "NOK",
      "availability": "https://schema.org/OutOfStock",
      "itemCondition": "https://schema.org/NewCondition",
      "seller": {
        "@type": "Organization",
        "name": "Utekos",
        "legalName": "KELC AS",
        "url": "https://utekos.no"
      },
      "shippingDetails": mikrofiberShippingDetails,
      "hasMerchantReturnPolicy": mikrofiberReturnPolicy
    }
  },
  {
    "@type": "Product",
    "@id": "https://utekos.no/produkter/utekos-mikrofiber#variant-42903231070456",
    "name": "Utekos Mikrofiber™ Vargnatt, Large",
    "sku": "UTEKOS-MIKRO-L-SVART",
    "productID": "gid://shopify/ProductVariant/42903231070456",
    "gtin14": "07090062980078",
    "url": "https://utekos.no/produkter/utekos-mikrofiber?variant=42903231070456",
    "image": [
      "https://cdn.shopify.com/s/files/1/0634/2154/6744/files/Vinterro_ved_fjellsolnedgang.webp?v=1791290911"
    ],
    "color": "Vargnatt",
    "size": "Large",
    "description": mikrofiberDescription,
    "isVariantOf": {
      "@id": "https://utekos.no/produkter/utekos-mikrofiber#product-group"
    },
    "weight": {
      "@type": "QuantitativeValue",
      "value": 800,
      "unitCode": "GRM"
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
      "url": "https://utekos.no/produkter/utekos-mikrofiber?variant=42903231070456",
      "price": "1790.0",
      "priceCurrency": "NOK",
      "availability": "https://schema.org/OutOfStock",
      "itemCondition": "https://schema.org/NewCondition",
      "seller": {
        "@type": "Organization",
        "name": "Utekos",
        "legalName": "KELC AS",
        "url": "https://utekos.no"
      },
      "shippingDetails": mikrofiberShippingDetails,
      "hasMerchantReturnPolicy": mikrofiberReturnPolicy
    }
  },
  {
    "@type": "Product",
    "@id": "https://utekos.no/produkter/utekos-mikrofiber#variant-42903231037688",
    "name": "Utekos Mikrofiber™ Fjellblå, Medium",
    "sku": "UTEKOS-MIKRO-M-BLUE",
    "productID": "gid://shopify/ProductVariant/42903231037688",
    "gtin14": "07090062980047",
    "url": "https://utekos.no/produkter/utekos-mikrofiber?variant=42903231037688",
    "image": [
      "https://cdn.shopify.com/s/files/1/0634/2154/6744/files/Vinterkos_med_Utekos_i_fjellheimen.webp?v=1791293329"
    ],
    "color": "Fjellblå",
    "size": "Medium",
    "description": mikrofiberDescription,
    "isVariantOf": {
      "@id": "https://utekos.no/produkter/utekos-mikrofiber#product-group"
    },
    "weight": {
      "@type": "QuantitativeValue",
      "value": 700,
      "unitCode": "GRM"
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
      "url": "https://utekos.no/produkter/utekos-mikrofiber?variant=42903231037688",
      "price": "1790.0",
      "priceCurrency": "NOK",
      "availability": "https://schema.org/InStock",
      "itemCondition": "https://schema.org/NewCondition",
      "seller": {
        "@type": "Organization",
        "name": "Utekos",
        "legalName": "KELC AS",
        "url": "https://utekos.no"
      },
      "shippingDetails": mikrofiberShippingDetails,
      "hasMerchantReturnPolicy": mikrofiberReturnPolicy
    }
  },
  {
    "@type": "Product",
    "@id": "https://utekos.no/produkter/utekos-mikrofiber#variant-42903231103224",
    "name": "Utekos Mikrofiber™ Fjellblå, Large",
    "sku": "UTEKOS-MIKRO-L-BLUE",
    "productID": "gid://shopify/ProductVariant/42903231103224",
    "gtin14": "07090062980054",
    "url": "https://utekos.no/produkter/utekos-mikrofiber?variant=42903231103224",
    "image": [
      "https://cdn.shopify.com/s/files/1/0634/2154/6744/files/Mikrofiber_44.webp?v=1791293769"
    ],
    "color": "Fjellblå",
    "size": "Large",
    "description": mikrofiberDescription,
    "isVariantOf": {
      "@id": "https://utekos.no/produkter/utekos-mikrofiber#product-group"
    },
    "weight": {
      "@type": "QuantitativeValue",
      "value": 800,
      "unitCode": "GRM"
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
      "url": "https://utekos.no/produkter/utekos-mikrofiber?variant=42903231103224",
      "price": "1790.0",
      "priceCurrency": "NOK",
      "availability": "https://schema.org/InStock",
      "itemCondition": "https://schema.org/NewCondition",
      "seller": {
        "@type": "Organization",
        "name": "Utekos",
        "legalName": "KELC AS",
        "url": "https://utekos.no"
      },
      "shippingDetails": mikrofiberShippingDetails,
      "hasMerchantReturnPolicy": mikrofiberReturnPolicy
    }
  }
];

export const mikrofiberReviews: Review[] = [
  {
    "@type": "Review",
    "@id": "https://utekos.no/produkter/utekos-mikrofiber#review-00bfb52c-7e20-49ee-b624-253e4fc5028b",
    "author": {
      "@type": "Person",
      "name": "Anonym"
    },
    "datePublished": "2026-05-18T19:17:12Z",
    "reviewBody": "Kjempe fornøyd.",
    "reviewRating": {
      "@type": "Rating",
      "ratingValue": 5,
      "bestRating": 5,
      "worstRating": 1
    }
  },
  {
    "@type": "Review",
    "@id": "https://utekos.no/produkter/utekos-mikrofiber#review-d4146dd9-d548-44f4-8f98-49a1eceea489",
    "author": {
      "@type": "Person",
      "name": "Gunnar Lie Eide"
    },
    "datePublished": "2026-04-05T15:34:19Z",
    "reviewBody": "Utekos er prøvd på altan i sur nordaustavind og 4 grader. Den svarte til forventningene. Lurt å lære seg rett bruk av snøring. Den holdt meg varm og god. 🤩",
    "reviewRating": {
      "@type": "Rating",
      "ratingValue": 5,
      "bestRating": 5,
      "worstRating": 1
    }
  },
  {
    "@type": "Review",
    "@id": "https://utekos.no/produkter/utekos-mikrofiber#review-8194b24f-4221-440e-92b3-dcc5b1bd0984",
    "author": {
      "@type": "Person",
      "name": "Ørjan"
    },
    "datePublished": "2026-02-28T17:06:19Z",
    "reviewBody": "Veldig behagelig på. Veldig hyggelig og hjelpsom betjening som stilte opp med varene under 24 timer etter bestilling.",
    "reviewRating": {
      "@type": "Rating",
      "ratingValue": 5,
      "bestRating": 5,
      "worstRating": 1
    }
  },
  {
    "@type": "Review",
    "@id": "https://utekos.no/produkter/utekos-mikrofiber#review-de6fe126-74dc-45f0-8cc5-dbd8418a22fd",
    "author": {
      "@type": "Person",
      "name": "Carina Johansen"
    },
    "datePublished": "2026-01-24T21:53:25Z",
    "reviewBody": "Fantastisk 😊",
    "reviewRating": {
      "@type": "Rating",
      "ratingValue": 5,
      "bestRating": 5,
      "worstRating": 1
    }
  },
  {
    "@type": "Review",
    "@id": "https://utekos.no/produkter/utekos-mikrofiber#review-8d9951e4-d067-4be8-b90e-c23502cc0b81",
    "author": {
      "@type": "Person",
      "name": "Anonym"
    },
    "datePublished": "2026-01-06T17:12:10Z",
    "reviewBody": "Super utekosdress 🤩",
    "reviewRating": {
      "@type": "Rating",
      "ratingValue": 5,
      "bestRating": 5,
      "worstRating": 1
    }
  }
];

export const utekosMikrofiber: UtekosMikrofiber = {
  "@context": "https://schema.org",
  "@type": "ProductGroup",
  "@id": "https://utekos.no/produkter/utekos-mikrofiber#product-group",
  "productGroupID": "7710040752376",
  "name": "Utekos Mikrofiber™",
  "url": "https://utekos.no/produkter/utekos-mikrofiber",
  "description": mikrofiberDescription,
  "image": [
    "https://cdn.shopify.com/s/files/1/0634/2154/6744/files/Koselig_vinterkveld_med_oppblasbart_uteantrekk.webp?v=1791290713",
    "https://cdn.shopify.com/s/files/1/0634/2154/6744/files/Vinterro_ved_fjellsolnedgang.webp?v=1791290911",
    "https://cdn.shopify.com/s/files/1/0634/2154/6744/files/Vinterkos_med_Utekos_i_fjellheimen.webp?v=1791293329",
    "https://cdn.shopify.com/s/files/1/0634/2154/6744/files/Mikrofiber_44.webp?v=1791293769"
  ],
  "brand": {
    "@type": "Brand",
    "name": "Utekos"
  },
  "category": "Apparel & Accessories > Clothing > Outerwear",
  "material": [
    "Nylon",
    "Polyester",
    "Syntetisk hulfiber"
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
      "name": "Fôrstoff",
      "value": "Taffeta"
    },
    {
      "@type": "PropertyValue",
      "name": "Isolasjonsfyll",
      "value": "Syntetisk hulfiber, 140 g/m²"
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
    "reviewCount": 5,
    "bestRating": 5,
    "worstRating": 1
  },
  "review": mikrofiberReviews,
  "hasVariant": mikrofiberVariants
};
