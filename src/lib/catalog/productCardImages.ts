type ProductCardImage = {
  src: string;
  alt: string;
  width: number;
  height: number;
};

// Keep the supplied posters at their native dimensions, without cropping.
export const productCardImages: Readonly<Partial<Record<string, ProductCardImage>>> = {
  "utekos-mikrofiber": {
    src: "/images/kunnskap/mikro_poster_16-9.webp",
    alt: "Fjellblå Utekos Mikrofiber™ vist forfra, bakfra og i parkaslengde.",
    width: 533,
    height: 300,
  },
  "utekos-dun": {
    src: "/images/kunnskap/dun_poster_1600x900.webp",
    alt: "Svart Utekos Dun™ med oransje fôr og informasjon om påmeldingslisten.",
    width: 533,
    height: 300,
  },
  comfyrobe: {
    src: "/images/kunnskap/comfy_poster_16-9.webp",
    alt: "Comfyrobe™ i Fjellnatt vist forfra, bakfra og på modell.",
    width: 533,
    height: 300,
  },
  "utekos-techdown": {
    src: "/images/kunnskap/tech_poster_16-9.webp",
    alt: "Person i Utekos TechDown™ på en fjelltopp ved solnedgang.",
    width: 533,
    height: 300,
  },
};
