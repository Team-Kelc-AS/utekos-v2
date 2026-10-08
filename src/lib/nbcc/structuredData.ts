import { NBCC_PATH, nbccFaqItems, nbccPage } from "./content";
import { absoluteUrl, SITE_ORIGIN } from "@/lib/seo/site";

// The source NBCC page owned WebPage, FAQPage and BreadcrumbList markup.
// Keep it local to this route; product offers belong to the product pages.
export function nbccStructuredData() {
  const url = absoluteUrl(NBCC_PATH);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${url}#webpage`,
        url,
        name: nbccPage.heading,
        description: nbccPage.description,
        inLanguage: "nb-NO",
        about: [
          { "@type": "Organization", name: "Utekos", url: SITE_ORIGIN },
          { "@type": "Organization", name: "Norsk Bobil og Caravan Club", alternateName: "NBCC", url: "https://www.nbocc.no" },
        ],
        breadcrumb: { "@id": `${url}#breadcrumb` },
        primaryImageOfPage: {
          "@type": "ImageObject", url: absoluteUrl("/og-utekos-nbcc-1200x630.jpg"), width: 1200, height: 630,
        },
      },
      {
        "@type": "FAQPage", "@id": `${url}#faq`, inLanguage: "nb-NO",
        isPartOf: { "@id": `${url}#webpage` },
        mainEntity: nbccFaqItems.map(({ question, answer }) => ({
          "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer },
        })),
      },
      {
        "@type": "BreadcrumbList", "@id": `${url}#breadcrumb`,
        itemListElement: [
          { name: "Forsiden", path: "/" },
          { name: "Produkter", path: "/produkter" },
          { name: "Camping og bobil", path: "/produkter/camping-og-bobil" },
          { name: "NBCC-medlemsfordel", path: NBCC_PATH },
        ].map(({ name, path }, index) => ({ "@type": "ListItem", position: index + 1, name, item: absoluteUrl(path) })),
      },
    ],
  };
}
