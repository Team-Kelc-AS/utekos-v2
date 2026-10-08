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
export type TechDownColor = 'Vargnatt' | 'Fjellblå' | 'Havdyp' | 'Fjellnatt';

// Rene URL-alternativer gir verdiforslag uten Schema.orgs øvrige objektformer.
type SchemaUrl<T> = Extract<T, `https://schema.org/${string}`>;

export type TechDownReturnPolicy = Omit<
  MerchantReturnPolicy,
  'returnPolicyCategory' | 'returnFees' | 'returnMethod'
> & {
  applicableCountry: string | string[];
  returnPolicyCategory: SchemaUrl<MerchantReturnEnumeration>;
  returnFees?: SchemaUrl<ReturnFeesEnumeration>;
  returnMethod?: SchemaUrl<ReturnMethodEnumeration> | SchemaUrl<ReturnMethodEnumeration>[];
};

/** Pris, valuta og lagerstatus tilhører tilbudet på den enkelte varianten. */
export type TechDownOffer = Omit<
  Extract<Offer, { '@type': 'Offer' }>,
  'availability' | 'hasMerchantReturnPolicy'
> & {
  '@type': 'Offer';
  url: string;
  price: number | string;
  priceCurrency: 'NOK';
  availability: SchemaUrl<ItemAvailability>;
  hasMerchantReturnPolicy?: TechDownReturnPolicy;
};

/**
 * Ett Product per kjøpbar kombinasjon av farge og størrelse.
 * SKU må være unik, og URL-en må åpne siden med riktig variant valgt.
 * Øvrige Schema.org-felter foreslås også av editoren.
 */
export type TechDownVariant = Omit<Extract<Product, { '@type': 'Product' }>, 'color' | 'offers'> & {
  '@type': 'Product';
  name: string;
  sku: string;
  url: string;
  image: string[];
  color: TechDownColor;
  size: string;
  offers: TechDownOffer;
};

export type UtekosTechDown = Omit<WithContext<ProductGroup>, 'hasVariant'> & {
  productGroupID: string;
  hasVariant: TechDownVariant[];
};

/**
 * Manuelt redigerbart øyeblikksbilde, hentet 2026-10-08. Ingen automatisk oppdatering.
 * Kilder:
 * - Shopify Admin: produkt, SKU/GTIN, kategori og metafeltet shopify.color-pattern.
 * - Storefront API 2026-10, country: NO: pris, kjøpbarhet, vekt og variantbilder.
 * - Judge.me offentlig produktwidget: 4,93 / 15 omtaler (alle 15 hentet).
 * - src/lib/products/content.ts: materialfordeling og glidelåser.
 * - src/lib/products/techDownSizes.ts: mål for Middels, Stor og Større.
 * - https://utekos.no/frakt-og-retur: frakt og retur, kontrollert samme dag.
 *
 * Til gjennomgang:
 * - Importør, produsent, logo og slagord er beholdt fra ditt utkast, ikke bekreftet
 *   av Shopify-oppslaget. KELC AS er bekreftet som selger på vilkårssiden.
 * - Shopify har både CloudWave™ (metafelt) og CloudWeave™ (produktbeskrivelse).
 *   Beskrivelsen er beholdt ordrett; materialene bruker tekst fra produktsiden.
 * - Google-kategori er 203 i mc-facebook og 5909 i mm-google-shopping.
 *   category nedenfor bruker derfor Shopifys hovedkategori, ikke et gjettet ID-valg.
 * - Bildene følger Shopifys eksplisitte variantkobling. De er åpnet og viser
 *   TechDown Havdyp; størrelsen kan ikke bekreftes visuelt fra modellbildene alene.
 * - Liten mangler mål i størrelsestabellen. Ingen mål er gjettet for den.
 * - hasGS1DigitalLink, mpn og pattern er utelatt fordi bekreftede verdier mangler.
 * - Produktlayouten bruker kontrollerte fakta herfra. Pris, lagerstatus og omtaler
 *   hentes live; disse øyeblikksbildene brukes ikke som reserveverdier.
 */

const techDownDescription = "Utekos TechDown™ Havdyp kombinerer banebrytende innovasjon med tidløs eleganse.Det eksklusive Luméa™-skallet gir en sofistikert finish og fungerer som et beskyttende skjold, mens hydrofobisk CloudWeave™-isolasjon gir pålitelig varme under varierende forhold. Med YKK® Dual V-Zip™ regulerer du enkelt ventilasjon og veksler mellom parkas, oppfestet mobilitet og fullengde-modus. En ren helgardering for kvelder på terrassen, ved bobilen, i båten og hytteveggen. Like ideell for morgenturen med hunden, fotballsidelinjen eller kalde strømbrudd.";

// Alle fire variantene koster over fraktgrensen på 999 kr ved dette oppslaget.
// 2–5 virkedager gjelder transport etter henting. Håndteringstid er ikke gjettet.
export const techDownShippingDetails: OfferShippingDetails = {
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

export const techDownReturnPolicy: TechDownReturnPolicy = {
  "@type": "MerchantReturnPolicy",
  "applicableCountry": "NO",
  "returnPolicyCountry": "NO",
  "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
  "merchantReturnDays": 14,
  "returnMethod": "https://schema.org/ReturnByMail",
  "returnFees": "https://schema.org/ReturnFeesCustomerResponsibility",
  "merchantReturnLink": "https://utekos.no/frakt-og-retur"
};

// Ett objekt per faktisk variant. Alle fire har fargen Havdyp.
export const techDownVariants: TechDownVariant[] = [
  {
    "@type": "Product",
    "@id": "https://utekos.no/produkter/utekos-techdown#variant-46944403849464",
    "name": "Utekos TechDown™ Havdyp, Liten",
    "sku": "TECHDOWN-HAVDYP-S",
    "productID": "gid://shopify/ProductVariant/46944403849464",
    "gtin14": "07090062980009",
    "url": "https://utekos.no/produkter/utekos-techdown?variant=46944403849464",
    "image": [
      "https://cdn.shopify.com/s/files/1/0634/2154/6744/files/07090062980009_A2C0.png?v=1780673986"
    ],
    "color": "Havdyp",
    "colorSwatch": "https://utekos.no/images/kunnskap/HavdypSwatch.png",
    "size": "Liten",
    "description": techDownDescription,
    "isVariantOf": {
      "@id": "https://utekos.no/produkter/utekos-techdown#product-group"
    },
    "weight": {
      "@type": "QuantitativeValue",
      "value": 1.1,
      "unitCode": "KGM"
    },
    "offers": {
      "@type": "Offer",
      "url": "https://utekos.no/produkter/utekos-techdown?variant=46944403849464",
      "price": "1990.0",
      "priceCurrency": "NOK",
      "availability": "https://schema.org/OutOfStock",
      "itemCondition": "https://schema.org/NewCondition",
      "seller": {
        "@type": "Organization",
        "name": "Utekos",
        "legalName": "KELC AS",
        "url": "https://utekos.no"
      },
      "shippingDetails": techDownShippingDetails,
      "hasMerchantReturnPolicy": techDownReturnPolicy
    }
  },
  {
    "@type": "Product",
    "@id": "https://utekos.no/produkter/utekos-techdown#variant-46944403882232",
    "name": "Utekos TechDown™ Havdyp, Middels",
    "sku": "TECHDOWN-HAVDYP-M",
    "productID": "gid://shopify/ProductVariant/46944403882232",
    "gtin14": "07090062980016",
    "url": "https://utekos.no/produkter/utekos-techdown?variant=46944403882232",
    "image": [
      "https://cdn.shopify.com/s/files/1/0634/2154/6744/files/TECHDOWN_1_45_f3819f80-7078-4045-98d3-068e6f6362a9.png?v=1790837336"
    ],
    "color": "Havdyp",
    "colorSwatch": "https://utekos.no/images/kunnskap/HavdypSwatch.png",
    "size": "Middels",
    "description": techDownDescription,
    "isVariantOf": {
      "@id": "https://utekos.no/produkter/utekos-techdown#product-group"
    },
    "weight": {
      "@type": "QuantitativeValue",
      "value": 1.3,
      "unitCode": "KGM"
    },
    "hasMeasurement": [
      {
        "@type": "QuantitativeValue",
        "name": "Lengde",
        "value": 162,
        "unitCode": "CMT"
      },
      {
        "@type": "QuantitativeValue",
        "name": "Bryst",
        "value": 56,
        "unitCode": "CMT"
      },
      {
        "@type": "QuantitativeValue",
        "name": "Ermlengde",
        "value": 82,
        "unitCode": "CMT"
      }
    ],
    "offers": {
      "@type": "Offer",
      "url": "https://utekos.no/produkter/utekos-techdown?variant=46944403882232",
      "price": "1990.0",
      "priceCurrency": "NOK",
      "availability": "https://schema.org/InStock",
      "itemCondition": "https://schema.org/NewCondition",
      "seller": {
        "@type": "Organization",
        "name": "Utekos",
        "legalName": "KELC AS",
        "url": "https://utekos.no"
      },
      "shippingDetails": techDownShippingDetails,
      "hasMerchantReturnPolicy": techDownReturnPolicy
    }
  },
  {
    "@type": "Product",
    "@id": "https://utekos.no/produkter/utekos-techdown#variant-46944403915000",
    "name": "Utekos TechDown™ Havdyp, Stor",
    "sku": "TECHDOWN-HAVDYP-L",
    "productID": "gid://shopify/ProductVariant/46944403915000",
    "gtin14": "07090062980023",
    "url": "https://utekos.no/produkter/utekos-techdown?variant=46944403915000",
    "image": [
      "https://cdn.shopify.com/s/files/1/0634/2154/6744/files/TECHDOWN_Stor_11_1.png?v=1790837295"
    ],
    "color": "Havdyp",
    "colorSwatch": "https://utekos.no/images/kunnskap/HavdypSwatch.png",
    "size": "Stor",
    "description": techDownDescription,
    "isVariantOf": {
      "@id": "https://utekos.no/produkter/utekos-techdown#product-group"
    },
    "weight": {
      "@type": "QuantitativeValue",
      "value": 1.5,
      "unitCode": "KGM"
    },
    "hasMeasurement": [
      {
        "@type": "QuantitativeValue",
        "name": "Lengde",
        "value": 166,
        "unitCode": "CMT"
      },
      {
        "@type": "QuantitativeValue",
        "name": "Bryst",
        "value": 58,
        "unitCode": "CMT"
      },
      {
        "@type": "QuantitativeValue",
        "name": "Ermlengde",
        "value": 87,
        "unitCode": "CMT"
      }
    ],
    "offers": {
      "@type": "Offer",
      "url": "https://utekos.no/produkter/utekos-techdown?variant=46944403915000",
      "price": "1990.0",
      "priceCurrency": "NOK",
      "availability": "https://schema.org/InStock",
      "itemCondition": "https://schema.org/NewCondition",
      "seller": {
        "@type": "Organization",
        "name": "Utekos",
        "legalName": "KELC AS",
        "url": "https://utekos.no"
      },
      "shippingDetails": techDownShippingDetails,
      "hasMerchantReturnPolicy": techDownReturnPolicy
    }
  },
  {
    "@type": "Product",
    "@id": "https://utekos.no/produkter/utekos-techdown#variant-48249962135800",
    "name": "Utekos TechDown™ Havdyp, Større",
    "sku": "TECHDOWN-HAVDYP-XL",
    "productID": "gid://shopify/ProductVariant/48249962135800",
    "gtin14": "07090062980030",
    "url": "https://utekos.no/produkter/utekos-techdown?variant=48249962135800",
    "image": [
      "https://cdn.shopify.com/s/files/1/0634/2154/6744/files/Utekos_TechDown_11.webp?v=1791293551"
    ],
    "color": "Havdyp",
    "colorSwatch": "https://utekos.no/images/kunnskap/HavdypSwatch.png",
    "size": "Større",
    "description": techDownDescription,
    "isVariantOf": {
      "@id": "https://utekos.no/produkter/utekos-techdown#product-group"
    },
    "weight": {
      "@type": "QuantitativeValue",
      "value": 1.5,
      "unitCode": "KGM"
    },
    "hasMeasurement": [
      {
        "@type": "QuantitativeValue",
        "name": "Lengde",
        "value": 170,
        "unitCode": "CMT"
      },
      {
        "@type": "QuantitativeValue",
        "name": "Bryst",
        "value": 61,
        "unitCode": "CMT"
      },
      {
        "@type": "QuantitativeValue",
        "name": "Ermlengde",
        "value": 92,
        "unitCode": "CMT"
      }
    ],
    "offers": {
      "@type": "Offer",
      "url": "https://utekos.no/produkter/utekos-techdown?variant=48249962135800",
      "price": "1990.0",
      "priceCurrency": "NOK",
      "availability": "https://schema.org/InStock",
      "itemCondition": "https://schema.org/NewCondition",
      "seller": {
        "@type": "Organization",
        "name": "Utekos",
        "legalName": "KELC AS",
        "url": "https://utekos.no"
      },
      "shippingDetails": techDownShippingDetails,
      "hasMerchantReturnPolicy": techDownReturnPolicy
    }
  }
];

// Offentlig publiserte omtaler fra Judge.me, med original ordlyd og dato.
export const techDownReviews: Review[] = [
  {
    "@type": "Review",
    "@id": "https://utekos.no/produkter/utekos-techdown#review-a854eac4-592a-526d-b99e-fbb8e9e866af",
    "author": {
      "@type": "Person",
      "name": "Lisa"
    },
    "datePublished": "2026-09-01T17:29:14Z",
    "reviewBody": "Veldig bra. Kjøpt stor, og den var varm, passe romslig og lang nok, jeg er 172 cm. Kan både gå med den, og lukkes nede ved bena når jeg sitter.",
    "reviewRating": {
      "@type": "Rating",
      "ratingValue": 5,
      "bestRating": 5,
      "worstRating": 1
    }
  },
  {
    "@type": "Review",
    "@id": "https://utekos.no/produkter/utekos-techdown#review-bf3aaabb-b777-482d-8821-0e819d7034f6",
    "author": {
      "@type": "Person",
      "name": "Odd Bergesen"
    },
    "datePublished": "2026-08-07T19:05:13Z",
    "reviewBody": "Fruen var veldig glad for gaven, og den passet perfekt og var veldig varm og god.",
    "reviewRating": {
      "@type": "Rating",
      "ratingValue": 5,
      "bestRating": 5,
      "worstRating": 1
    }
  },
  {
    "@type": "Review",
    "@id": "https://utekos.no/produkter/utekos-techdown#review-d4c56c61-0724-4fe1-8efd-841378df9530",
    "author": {
      "@type": "Person",
      "name": "Heidi Schlottmann"
    },
    "datePublished": "2026-08-02T06:56:40Z",
    "reviewBody": "Super service og glede meg til å skulle bruke produktet. Virker til å levere på kvalitet.",
    "reviewRating": {
      "@type": "Rating",
      "ratingValue": 5,
      "bestRating": 5,
      "worstRating": 1
    }
  },
  {
    "@type": "Review",
    "@id": "https://utekos.no/produkter/utekos-techdown#review-4844bf30-e52b-4f3f-9ce3-c1c660fbeb12",
    "author": {
      "@type": "Person",
      "name": "Håkon Ingul"
    },
    "datePublished": "2026-06-09T20:02:54Z",
    "reviewBody": "Veldig fint og bra produkt.",
    "reviewRating": {
      "@type": "Rating",
      "ratingValue": 5,
      "bestRating": 5,
      "worstRating": 1
    }
  },
  {
    "@type": "Review",
    "@id": "https://utekos.no/produkter/utekos-techdown#review-f3de623f-8ffd-47c7-b3c4-2f6951bb4ee4",
    "author": {
      "@type": "Person",
      "name": "Anonym"
    },
    "datePublished": "2026-05-19T20:16:23Z",
    "reviewBody": "Kjæmpeplagg",
    "reviewRating": {
      "@type": "Rating",
      "ratingValue": 5,
      "bestRating": 5,
      "worstRating": 1
    }
  },
  {
    "@type": "Review",
    "@id": "https://utekos.no/produkter/utekos-techdown#review-f1d93cf1-7142-4929-9326-7850a451cbd7",
    "author": {
      "@type": "Person",
      "name": "Inger Marie Vuolab Olafsen"
    },
    "datePublished": "2026-05-18T16:44:28Z",
    "reviewBody": "Har ikke fått prøvd enda ,men den kjennes deilig ut.",
    "reviewRating": {
      "@type": "Rating",
      "ratingValue": 5,
      "bestRating": 5,
      "worstRating": 1
    }
  },
  {
    "@type": "Review",
    "@id": "https://utekos.no/produkter/utekos-techdown#review-8e6818b1-9014-49ee-9802-af278e8c259b",
    "author": {
      "@type": "Person",
      "name": "Ole Martin Grinde"
    },
    "datePublished": "2026-05-11T16:43:40Z",
    "reviewBody": "Har ikke hatt andlendnig og bruke den enda siden jeg har vært på jobb",
    "reviewRating": {
      "@type": "Rating",
      "ratingValue": 5,
      "bestRating": 5,
      "worstRating": 1
    }
  },
  {
    "@type": "Review",
    "@id": "https://utekos.no/produkter/utekos-techdown#review-0f9b395d-4363-425b-8f84-a75ee0d95029",
    "author": {
      "@type": "Person",
      "name": "Anonym"
    },
    "datePublished": "2026-03-16T18:16:11Z",
    "reviewBody": "Veldig kjekk å ha på kalde kvelder, gjør at du ikke trenger å gå pga. at du fryser😊",
    "reviewRating": {
      "@type": "Rating",
      "ratingValue": 5,
      "bestRating": 5,
      "worstRating": 1
    }
  },
  {
    "@type": "Review",
    "@id": "https://utekos.no/produkter/utekos-techdown#review-29ff574d-49b3-499e-8215-d09e87b432e8",
    "author": {
      "@type": "Person",
      "name": "Monika Hansen"
    },
    "datePublished": "2026-02-23T09:45:09Z",
    "reviewBody": "Den var utrolig deilig å ha på ute i sneborgen. Varm og god over hele kroppen.",
    "reviewRating": {
      "@type": "Rating",
      "ratingValue": 5,
      "bestRating": 5,
      "worstRating": 1
    }
  },
  {
    "@type": "Review",
    "@id": "https://utekos.no/produkter/utekos-techdown#review-092bb084-2f7a-4954-b92f-d0595d3700d5",
    "author": {
      "@type": "Person",
      "name": "Anonym"
    },
    "datePublished": "2026-02-09T00:36:38Z",
    "reviewBody": "Jeg kjøpte den til sønnen min som sitter i rullestolen og nå holder han seg godt og varmt 👍",
    "reviewRating": {
      "@type": "Rating",
      "ratingValue": 5,
      "bestRating": 5,
      "worstRating": 1
    }
  },
  {
    "@type": "Review",
    "@id": "https://utekos.no/produkter/utekos-techdown#review-b6b3d55e-7168-4d02-99cd-9b7bcc95a0ff",
    "author": {
      "@type": "Person",
      "name": "Anonym"
    },
    "datePublished": "2026-02-01T15:32:39Z",
    "reviewBody": "Bra produkt",
    "reviewRating": {
      "@type": "Rating",
      "ratingValue": 4,
      "bestRating": 5,
      "worstRating": 1
    }
  },
  {
    "@type": "Review",
    "@id": "https://utekos.no/produkter/utekos-techdown#review-8568ba22-303f-4dd2-9e2e-095a5b3f83bc",
    "author": {
      "@type": "Person",
      "name": "Karin Haugo"
    },
    "datePublished": "2026-01-14T19:00:32Z",
    "reviewBody": "Enkelt å bestille, rask levering og flott produkt! 😊👍",
    "reviewRating": {
      "@type": "Rating",
      "ratingValue": 5,
      "bestRating": 5,
      "worstRating": 1
    }
  },
  {
    "@type": "Review",
    "@id": "https://utekos.no/produkter/utekos-techdown#review-0665da23-1936-49a6-accf-342a6791ba41",
    "author": {
      "@type": "Person",
      "name": "Heidi"
    },
    "datePublished": "2025-12-30T09:44:33Z",
    "reviewBody": "Veldig fin passform og kvalitet! Blir deilig å ha ute på hytta og gjør at utesesongen på terrassen kan starte enda tidligere! Blir nok kjøpt inn noen flere",
    "reviewRating": {
      "@type": "Rating",
      "ratingValue": 5,
      "bestRating": 5,
      "worstRating": 1
    }
  },
  {
    "@type": "Review",
    "@id": "https://utekos.no/produkter/utekos-techdown#review-b7bff633-6e56-46ab-9187-0cf6a1c63b5f",
    "author": {
      "@type": "Person",
      "name": "Anonym"
    },
    "datePublished": "2025-12-17T19:37:48Z",
    "reviewBody": "I haven’t tried it outside yet, but I can’t wait! Very comfortable to wear and good fit.",
    "reviewRating": {
      "@type": "Rating",
      "ratingValue": 5,
      "bestRating": 5,
      "worstRating": 1
    }
  },
  {
    "@type": "Review",
    "@id": "https://utekos.no/produkter/utekos-techdown#review-12bf6af2-7c17-4626-a8d6-042593b8d538",
    "author": {
      "@type": "Person",
      "name": "Richard Rasmussen"
    },
    "datePublished": "2025-12-02T19:10:31Z",
    "reviewBody": "Kona ble kjempefornøyd",
    "reviewRating": {
      "@type": "Rating",
      "ratingValue": 5,
      "bestRating": 5,
      "worstRating": 1
    }
  }
];

export const utekosTechDown: UtekosTechDown = {
  "@context": "https://schema.org",
  "@type": "ProductGroup",
  "@id": "https://utekos.no/produkter/utekos-techdown#product-group",
  "productGroupID": "9240112693496",
  "name": "Utekos TechDown™",
  "url": "https://utekos.no/produkter/utekos-techdown",
  "description": techDownDescription,
  "brand": {
    "@type": "Brand",
    "name": "Utekos"
  },
  "importer": {
    "@type": "Organization",
    "name": "Navigare Sports AS"
  },
  "manufacturer": {
    "@type": "Organization",
    "name": "Utekos"
  },
  "logo": "https://utekos.no/logo.png",
  "category": "Apparel & Accessories > Clothing > Outerwear > Coats & Jackets > Parkas",
  "material": [
    "Nylon",
    "Polyester",
    "Hydrofobisk syntetisk dun"
  ],
  "slogan": "Skreddersy varmen",
  "color": "Havdyp",
  "image": [
    "https://cdn.shopify.com/s/files/1/0634/2154/6744/files/07090062980009_A2C0.png?v=1780673986",
    "https://cdn.shopify.com/s/files/1/0634/2154/6744/files/TECHDOWN_1_45_f3819f80-7078-4045-98d3-068e6f6362a9.png?v=1790837336",
    "https://cdn.shopify.com/s/files/1/0634/2154/6744/files/TECHDOWN_Stor_11_1.png?v=1790837295",
    "https://cdn.shopify.com/s/files/1/0634/2154/6744/files/Utekos_TechDown_11.webp?v=1791293551"
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
      "name": "Ytterstoff",
      "value": "100 % nylon, 38 g/m²"
    },
    {
      "@type": "PropertyValue",
      "name": "Innerfôr",
      "value": "Polyester"
    },
    {
      "@type": "PropertyValue",
      "name": "Isolasjonsfyll",
      "value": "Hydrofobisk syntetisk dun"
    },
    {
      "@type": "PropertyValue",
      "name": "Glidelåser",
      "value": "YKK®"
    }
  ],
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": 4.93,
    "reviewCount": 15,
    "bestRating": 5,
    "worstRating": 1
  },
  "review": techDownReviews,
  "hasVariant": techDownVariants
};
