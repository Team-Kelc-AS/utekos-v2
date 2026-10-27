type CampaignPrice = {
  price: string;
  originalPrice: string | null;
};

// Verified against all Shopify Admin variants on 2026-10-28. Keep UI and JSON-LD aligned.
export const christmasCampaignPrices = {
  "utekos-techdown": { price: "1990", originalPrice: null },
  "utekos-mikrofiber": { price: "1790", originalPrice: null },
  "utekos-dun": { price: "2990", originalPrice: null },
  comfyrobe: { price: "845", originalPrice: "1690" },
} satisfies Record<string, CampaignPrice>;

export type ChristmasCampaignProductHandle = keyof typeof christmasCampaignPrices;
