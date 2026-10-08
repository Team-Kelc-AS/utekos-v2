import { absoluteUrl } from "@/lib/seo/site";
import { retailers, retailerPath, retailerHeading, retailerIntro, retailerMapsUrl, type Retailer } from "@/lib/retailers";

function breadcrumbs(items: { name: string; path: string }[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: [{ name: "Forsiden", path: "/" }, ...items].map(({ name, path }, index) => ({
      "@type": "ListItem", position: index + 1, name, item: absoluteUrl(path),
    })),
  };
}

export function retailerOverviewStructuredData() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage", "@id": `${absoluteUrl("/forhandlere")}#webpage`,
        url: absoluteUrl("/forhandlere"), name: retailerHeading, description: retailerIntro, inLanguage: "nb-NO",
        mainEntity: {
          "@type": "ItemList",
          itemListElement: retailers.map((retailer, index) => ({
            "@type": "ListItem", position: index + 1, name: retailer.name, url: absoluteUrl(retailerPath(retailer)),
          })),
        },
      },
      breadcrumbs([{ name: "Forhandlere", path: "/forhandlere" }]),
    ],
  };
}

export function retailerStructuredData(retailer: Retailer) {
  const url = absoluteUrl(retailerPath(retailer));
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage", "@id": `${url}#webpage`, url, name: `Utekos hos ${retailer.name}`,
        description: retailer.description, inLanguage: "nb-NO", mainEntity: { "@id": `${url}#store` },
      },
      {
        "@type": "Store", "@id": `${url}#store`, name: retailer.name, legalName: retailer.legalName,
        url: retailer.website, sameAs: [retailer.website], hasMap: retailerMapsUrl(retailer),
        image: absoluteUrl(retailer.image.src), logo: absoluteUrl(retailer.logo.src), telephone: retailer.telephone,
        address: {
          "@type": "PostalAddress", streetAddress: retailer.street, postalCode: retailer.postalCode,
          addressLocality: retailer.locality, addressCountry: "NO",
        },
      },
      breadcrumbs([{ name: "Forhandlere", path: "/forhandlere" }, { name: retailer.name, path: retailerPath(retailer) }]),
    ],
  };
}

export function dealerStructuredData() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "ContactPage", url: absoluteUrl("/bli-forhandler"), name: "Bli Utekos-forhandler", inLanguage: "nb-NO" },
      breadcrumbs([{ name: "Bli forhandler", path: "/bli-forhandler" }]),
    ],
  };
}
