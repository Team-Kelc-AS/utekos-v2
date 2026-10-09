import 'server-only';
import { cacheLife, cacheTag } from 'next/cache';
import { PRODUCT_QUERY, PRODUCT_IMAGES_QUERY, PRODUCT_VARIANTS_QUERY, PRODUCT_COLLECTIONS_QUERY } from './queries/products';
import { shopifyFetch } from './client';
import type { CursorConnection } from '@/lib/catalog/paginateConnection';
import type { ShopifyProduct, ProductImage, ProductVariant, ProductCollection } from './product-types';

export type { ShopifyProduct } from './product-types';
type ProductResponse = Omit<ShopifyProduct, 'options'> & {
  options: { name: string; optionValues: { name: string }[] }[];
  images: CursorConnection<ProductImage>;
  variants: CursorConnection<ProductVariant>;
  collections: CursorConnection<ProductCollection>;
};

export async function completeConnection<T>(first: CursorConnection<T>, next: (after: string) => Promise<CursorConnection<T>>) {
  const nodes = [...first.nodes];
  const seen = new Set<string>();
  let page = first;
  while (page.pageInfo.hasNextPage) {
    const cursor = page.pageInfo.endCursor;
    if (!cursor || seen.has(cursor)) throw new Error('Product pagination did not advance');
    seen.add(cursor);
    page = await next(cursor);
    nodes.push(...page.nodes);
  }
  return { nodes };
}

export async function getProduct(handle: string): Promise<ShopifyProduct | null> {
  'use cache';
  cacheTag('shopify:products', `shopify:product:${handle}`);
  const { product } = await shopifyFetch<{ product: ProductResponse | null }, { handle: string }>({
    query: PRODUCT_QUERY, variables: { handle },
  });
  if (!product) { cacheLife('seconds'); return null; }
  const [images, variants, collections] = await Promise.all([
    completeConnection(product.images, async (after) => {
      const data = await shopifyFetch<{ product: Pick<ProductResponse, 'images'> | null }, { handle: string; after: string }>({
        query: PRODUCT_IMAGES_QUERY, variables: { handle, after },
      });
      if (!data.product) throw new Error('Product disappeared during image pagination');
      return data.product.images;
    }),
    completeConnection(product.variants, async (after) => {
      const data = await shopifyFetch<{ product: Pick<ProductResponse, 'variants'> | null }, { handle: string; after: string }>({
        query: PRODUCT_VARIANTS_QUERY, variables: { handle, after },
      });
      if (!data.product) throw new Error('Product disappeared during variant pagination');
      return data.product.variants;
    }),
    completeConnection(product.collections, async (after) => {
      const data = await shopifyFetch<{ product: Pick<ProductResponse, 'collections'> | null }, { handle: string; after: string }>({
        query: PRODUCT_COLLECTIONS_QUERY, variables: { handle, after },
      });
      if (!data.product) throw new Error('Product disappeared during collection pagination');
      return data.product.collections;
    }),
  ]);
  cacheLife('minutes');
  return {
    ...product, images, variants, collections,
    // Preserve the UI contract while using Storefront 2026-10's optionValues.
    options: product.options.map(option => ({ name: option.name, values: option.optionValues.map(value => value.name) })),
  };
}
