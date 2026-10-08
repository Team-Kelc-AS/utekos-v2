import 'server-only';

import { cacheLife, cacheTag } from 'next/cache';
import type { CursorConnection } from '@/lib/catalog/paginateConnection';
import { publicVariants } from '@/lib/products/variants';
import { shopifyFetch } from './client';
import type { ProductVariant, ProductCollection, ShopifyProduct } from './product-types';
import { completeConnection } from './getProduct';
import { PRODUCT_COLLECTIONS_QUERY } from './queries/products';
import { PRODUCT_CARDS_QUERY, PRODUCT_CARD_VARIANTS_QUERY } from './queries/productCards';

type StockVariant = ProductVariant & { currentlyNotInStock: boolean };
type CardProduct = Pick<ShopifyProduct, 'id' | 'handle' | 'title' | 'vendor' | 'productType' | 'collections' | 'variants'>;
type ProductResponse = CardProduct & { variants: CursorConnection<StockVariant>; collections: CursorConnection<ProductCollection> };
export type ProductCardData = { product: CardProduct; variant: StockVariant };

async function readAll<T>(read: (after: string | null) => Promise<CursorConnection<T>>): Promise<T[]> {
  const nodes: T[] = [];
  const cursors = new Set<string>();
  let after: string | null = null;
  while (true) {
    const page = await read(after);
    nodes.push(...page.nodes);
    if (!page.pageInfo.hasNextPage) return nodes;
    const next = page.pageInfo.endCursor;
    if (!next || cursors.has(next)) throw new Error('Product card pagination did not advance');
    cursors.add(next);
    after = next;
  }
}

export async function getProductCards(): Promise<ProductCardData[]> {
  'use cache';
  // Inventory is short-lived; failures throw instead of caching an empty carousel.
  cacheLife('seconds');
  cacheTag('shopify:products');

  const products = await readAll<ProductResponse>(async (after) => {
    const data = await shopifyFetch<{ products: CursorConnection<ProductResponse> }, { after: string | null }>({
      query: PRODUCT_CARDS_QUERY, variables: { after },
    });
    return data.products;
  });

  const cards = await Promise.all(products.map(async (product) => {
    const collections = await completeConnection(product.collections, async after => {
      const data = await shopifyFetch<{ product: Pick<ProductResponse, 'collections'> | null }, { handle: string; after: string }>({
        query: PRODUCT_COLLECTIONS_QUERY, variables: { handle: product.handle, after },
      });
      if (!data.product) throw new Error('Product disappeared during card collection pagination');
      return data.product.collections;
    });
    const variants = product.variants.pageInfo.hasNextPage
      ? await readAll<StockVariant>(async (after) => {
          if (after === null) return product.variants;
          const data = await shopifyFetch<{ product: Pick<ProductResponse, 'variants'> | null }, { handle: string; after: string }>({
            query: PRODUCT_CARD_VARIANTS_QUERY, variables: { handle: product.handle, after },
          });
          if (!data.product) throw new Error('Product disappeared during card pagination');
          return data.product.variants;
        })
      : product.variants.nodes;

    return publicVariants({ handle: product.handle, variants: { nodes: variants } })
      .filter(variant => variant.availableForSale && variant.currentlyNotInStock === false)
      .map(variant => ({ product: { id: product.id, handle: product.handle, title: product.title, vendor: product.vendor, productType: product.productType, collections, variants: { nodes: variants } }, variant }));
  }));
  return cards.flat();
}
