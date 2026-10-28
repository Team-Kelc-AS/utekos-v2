export const comfyBuyNowVariants = {
  xs: "gid://shopify/ProductVariant/43959919051000",
  xl: "gid://shopify/ProductVariant/43959919116536",
} as const;

export type ComfyBuyNowSize = keyof typeof comfyBuyNowVariants;

export const COMFY_BUY_NOW_CART_COOKIE = "utekos_comfy_buy_now_cart";
