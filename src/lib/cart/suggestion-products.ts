import 'server-only';
import { shopifyFetch } from '@/lib/shopify/client';
import { getProduct } from '@/lib/shopify/getProduct';
import { productTitle } from '@/lib/catalog/productTitle';
import type { Money, ProductImage } from '@/lib/shopify/product-types';
import type { CartSuggestion } from './suggestions';

const fields = `id handle title availableForSale totalInventory tags priceRange { minVariantPrice { amount currencyCode } }
 variants(first: 100) { nodes { id title availableForSale currentlyNotInStock price { amount currencyCode } image { url altText width height } } pageInfo { hasNextPage } }`;
export const CART_SUGGESTIONS_QUERY = `query CartSuggestions {
 accessories: products(first: 10, query: "tag:\\"tilbehør\\" AND available_for_sale:true") { nodes { ${fields} } }
 recommended: products(first: 10, query: "available_for_sale:true") { nodes { ${fields} } }
}`;
type Candidate = { id: string; handle: string; title: string; availableForSale: boolean; totalInventory: number | null; tags: string[]; priceRange: { minVariantPrice: Money }; variants: { nodes: { id: string; title: string; availableForSale: boolean; currentlyNotInStock: boolean; price: Money; image: ProductImage | null }[]; pageInfo: { hasNextPage: boolean } } };
export async function getCartSuggestionProducts(): Promise<CartSuggestion[]> {
  const data = await shopifyFetch<{ accessories: { nodes: Candidate[] }; recommended: { nodes: Candidate[] } }>({ query: CART_SUGGESTIONS_QUERY, cache: 'no-store' });
  const accessoryIds = new Set(data.accessories.nodes.map(product => product.id));
  const unique = [...new Map([...data.accessories.nodes, ...data.recommended.nodes].map(product => [product.id, product])).values()];
  const products = await Promise.all(unique.map(async product => {
    if (!product.availableForSale || (typeof product.totalInventory === 'number' && product.totalInventory <= 0)) return null;
    const variants = product.variants.pageInfo.hasNextPage
      ? (await getProduct(product.handle))?.variants.nodes ?? [] : product.variants.nodes;
    const available = variants.filter(variant => variant.availableForSale && !variant.currentlyNotInStock && variant.price.currencyCode === 'NOK');
    if (!available.length) return null;
    return { id: product.id, handle: product.handle, title: productTitle(product), accessory: accessoryIds.has(product.id), minimumPrice: product.priceRange.minVariantPrice,
      variants: available.map(({ id, title, price, image }) => ({ id, title, price, image })) };
  }));
  return products.filter(product => product !== null);
}
