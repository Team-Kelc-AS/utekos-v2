export type Retailer = Readonly<{
  slug: string;
  name: string;
  legalName: string;
  place: string;
  street: string;
  postalCode: string;
  locality: string;
  phone: string;
  telephone: string;
  website: string;
  hoursUrl: string;
  placeId: string;
  description: string;
  image: { src: string; width: number; height: number; alt: string };
  logo: { src: string; width: number; height: number; lightSurface?: boolean };
}>;

export const retailerHeading = "Hvor kan du kjøpe Utekos i butikk?";
export const retailerIntro = "Utekos selges hos Intersport på Laksevåg Senter, MLS Fritid AS og Os Caravan & Fritid. Her finner du kontaktinformasjon og veibeskrivelse til forhandlerne.";
export const retailerAvailability = "Kontakt butikken for tilgjengelige størrelser og farger";
export const dealerHeading = "Vil du selge Utekos i din butikk?";
export const dealerIntro = "Ta kontakt for å høre mer om produktene og muligheten for et forhandlersamarbeid. Fortell gjerne hvilken butikk du representerer, og hvor den ligger.";

// Contact details: retailers' own pages, checked 2026-10-08. TechDown assortment:
// confirmed by Utekos. Places IDs verified with Google, but Google addresses do
// not overwrite these independently sourced visitor addresses.
export const retailers: readonly Retailer[] = [
  {
    slug: "intersport-laksevag", name: "Intersport Laksevåg", legalName: "Intersport Laksevåg (Sentersport AS)",
    place: "Laksevåg Senter · Bergen", street: "Kringsjåveien 83–89", postalCode: "5163", locality: "Laksevåg",
    phone: "55 34 80 08", telephone: "+4755348008",
    website: "https://www.intersport.no/butikker/intersport-laksevag",
    hoursUrl: "https://www.intersport.no/butikker/intersport-laksevag",
    placeId: "ChIJ48v9snT8PEYRmBkalZRODmE",
    description: "Du finner Utekos TechDown™ hos Intersport på Laksevåg Senter i Bergen. Her kan du se, prøve og kjenne på plagget før du bestemmer deg.",
    image: { src: "/images/partnere/intersport-inngang.webp", width: 1122, height: 1402, alt: "Inngangen til Intersport med butikkskilt på Laksevåg Senter" },
    logo: { src: "/Intersport_logo.svg", width: 1024, height: 112, lightSurface: true },
  },
  {
    slug: "mls-fritid", name: "MLS Fritid AS", legalName: "MLS Fritid AS",
    place: "Alta", street: "Bronseveien 1", postalCode: "9518", locality: "Alta",
    phone: "78 43 69 33", telephone: "+4778436933",
    website: "https://mlsfritid.no/", hoursUrl: "https://mlsfritid.no/kontakt/",
    placeId: "ChIJm4-ukqEWz0URKRXiiadw4E0",
    description: "MLS Fritid AS fører Utekos TechDown™ i Alta. Butikken ligger i Bronseveien 1, der du også finner caravan- og fritidsutstyr.",
    image: { src: "/images/partnere/mls-fritid-inngang.webp", width: 1122, height: 1402, alt: "Fasaden til MLS Fritid i Alta med butikkens oransje skilt" },
    logo: { src: "/images/partnere/MLS-Fritid-logo.svg", width: 404.26, height: 91.92, lightSurface: true },
  },
  {
    slug: "os-caravan-fritid", name: "Os Caravan & Fritid", legalName: "Os Caravan & Fritid AS",
    place: "Os · Bjørnafjorden", street: "Industrivegen 2", postalCode: "5210", locality: "Os",
    phone: "90 70 77 00", telephone: "+4790707700",
    website: "https://www.oscaravan.no/", hoursUrl: "https://www.oscaravan.no/kontakt-oss",
    placeId: "ChIJjVLtiF9ZPEYRyzDbjoTMijE",
    description: "Hos Os Caravan & Fritid finner du Utekos TechDown™. Besøk butikken i Industrivegen 2 på Os, og ta kontakt før turen for å høre hvilke størrelser og farger de har inne.",
    image: { src: "/images/partnere/os-caravan-inngang.webp", width: 1440, height: 1800, alt: "Inngangen til Os Caravan med bobiler foran bygningen" },
    logo: { src: "/logo-os-caravan.svg", width: 1372, height: 398 },
  },
];

export function retailerPath(retailer: Retailer) {
  return `/forhandlere/${retailer.slug}`;
}

export function getRetailer(slug: string) {
  return retailers.find((retailer) => retailer.slug === slug);
}

export function retailerDirectionsUrl(retailer: Retailer) {
  const query = new URLSearchParams({
    api: "1",
    destination: `${retailer.name}, ${retailer.street}, ${retailer.postalCode} ${retailer.locality}`,
    destination_place_id: retailer.placeId,
  });
  return `https://www.google.com/maps/dir/?${query}`;
}

export function retailerMapsUrl(retailer: Retailer) {
  return `https://www.google.com/maps/search/?${new URLSearchParams({ api: "1", query: retailer.name, query_place_id: retailer.placeId })}`;
}
