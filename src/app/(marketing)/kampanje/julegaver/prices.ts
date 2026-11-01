type CampaignPrice = {
  price: string;
  originalPrice: string | null;
};

export type ChristmasCampaignProductHandle =
  | "utekos-techdown"
  | "utekos-mikrofiber"
  | "utekos-dun"
  | "comfyrobe";

// Shopify prices checked on 2026-10-28; Comfyrobe restored per merchant on 2026-11-01.
// Keep UI and JSON-LD aligned.
export const christmasCampaignPrices: Record<ChristmasCampaignProductHandle, CampaignPrice> = {
  "utekos-techdown": { price: "1990", originalPrice: null },
  "utekos-mikrofiber": { price: "1790", originalPrice: null },
  "utekos-dun": { price: "2990", originalPrice: null },
  comfyrobe: { price: "1690", originalPrice: null },
};
