import type { CollectionPage, ListItem, WithContext } from "schema-dts";
import { cacheLife, cacheTag } from "next/cache";
import { christmasCampaignPrices } from "../prices";
export async function ChristmasCampaignJsonLd() {
  "use cache";
  cacheLife("max");
  cacheTag("campaign-julegaver");

  const baseUrl = "https://utekos.no";

  const products = [
    {
      position: 1,
      name: "Utekos TechDown™",
      url: `${baseUrl}/produkter/utekos-techdown`,
      image: `${baseUrl}/images/campaigns/julegaver/techdown-1080.png`,
      ...christmasCampaignPrices["utekos-techdown"],
      description:
        "Vår varmeste mest allsidige modell. Optimalisert etter erfaringer og tilbakemeldinger.",
    },
    {
      position: 2,
      name: "Utekos Mikrofiber",
      url: `${baseUrl}/produkter/utekos-mikrofiber`,
      image: `${baseUrl}/images/campaigns/julegaver/mikro-front-1080.png`,
      ...christmasCampaignPrices["utekos-mikrofiber"],
      description:
        "Lettvekt møter varme og allsidighet. Gir deg følelsen av dun med ekstra fordeler.",
    },
    {
      position: 3,
      name: "Utekos Dun",
      url: `${baseUrl}/produkter/utekos-dun`,
      image: `${baseUrl}/images/campaigns/julegaver/dun-front-hvit-bakgrunn-1080.png`,
      ...christmasCampaignPrices["utekos-dun"],
      description: "Klassisk dun-kvalitet for de kaldeste dagene.",
    },
    {
      position: 4,
      name: "Utekos Comfyrobe",
      url: `${baseUrl}/produkter/comfyrobe`,
      image: `${baseUrl}/images/campaigns/julegaver/comfy-front-u-bakgrunn-1080.png`,
      ...christmasCampaignPrices.comfyrobe,
      description: "Den ultimate skifteroben. Vindtett, vanntett og foret.",
    },
  ];

  const itemListElement: ListItem[] = products.map((product) => ({
    "@type": "ListItem",
    position: product.position,
    url: product.url,
    item: {
      "@type": "Product",
      name: product.name,
      description: product.description,
      image: product.image,
      url: product.url,
      offers: {
        "@type": "Offer",
        price: product.price,
        priceCurrency: "NOK",
        ...(product.originalPrice && {
          priceSpecification: {
            "@type": "UnitPriceSpecification",
            priceType: "https://schema.org/ListPrice",
            price: product.originalPrice,
            priceCurrency: "NOK",
          },
        }),
        url: product.url,
      },
    },
  }));

  const jsonLd: WithContext<CollectionPage> = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Julegavetips | Utekos",
    description: "Gi bort funksjonell varme | Julegavetips fra Utekos.",
    url: `${baseUrl}/kampanje/julegaver`,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: itemListElement,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
      }}
    />
  );
}
