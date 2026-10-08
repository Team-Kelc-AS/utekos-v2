import 'server-only';
import { randomUUID } from 'node:crypto';
import { shopifyFetch } from '@/lib/shopify/client';
import { productTitle } from '@/lib/catalog/productTitle';
import type { CursorConnection } from '@/lib/catalog/paginateConnection';
import type { ProductVariant, ProductCollection, Money } from '@/lib/shopify/product-types';
import type { Cart, CartOperation, CartResult } from './types';
import { emptyCart } from './types';
import { getProduct } from '@/lib/shopify/getProduct';
import { publicVariants } from '@/lib/products/variants';
import { cartLineCommerce, authoritativeCartCommerce, confirmedCartMutation } from './commerce';
import { cartCheckoutIdentity } from './checkout-identity';
import { cartIdentity } from '@/lib/klarna/server';
import type { CommerceProduct } from '@/lib/shopify/commerce';
import { completeConnection } from '@/lib/shopify/getProduct';
import { PRODUCT_COLLECTIONS_QUERY } from '@/lib/shopify/queries/products';

export const CART_COOKIE = 'utekos_cart';
type RawLine = { id: string; quantity: number; cost: { totalAmount: Money }; merchandise: ProductVariant & { __typename: string; product: CommerceProduct & { collections: CursorConnection<ProductCollection> } } };
export type RawCart = { id: string; checkoutUrl: string; totalQuantity: number; cost: { subtotalAmount: Money; totalAmount: Money }; lines: CursorConnection<RawLine> };
const LINE_FIELDS = `id quantity cost { totalAmount { amount currencyCode } } merchandise { __typename ... on ProductVariant { id title availableForSale currentlyNotInStock quantityAvailable taxable sku barcode price { amount currencyCode } compareAtPrice { amount currencyCode } selectedOptions { name value } image { url altText width height } product { id handle title vendor productType collections(first: 100) { nodes { id title } pageInfo { hasNextPage endCursor } } } } }`;
const CART_FIELDS = `id checkoutUrl totalQuantity cost { subtotalAmount { amount currencyCode } totalAmount { amount currencyCode } } lines(first: 100) { nodes { ${LINE_FIELDS} } pageInfo { hasNextPage endCursor } }`;
export class CartError extends Error { constructor(message: string, public status = 422) { super(message); } }

async function request<T>(query: string, variables: Record<string, unknown>, buyerIp?: string) {
  return shopifyFetch<T, Record<string, unknown>>({ query, variables, buyerIp, cache: 'no-store' });
}
export async function readCart(id: string, buyerIp?: string): Promise<RawCart | null> {
  const result = await request<{ cart: RawCart | null }>(`query Cart($id: ID!) { cart(id: $id) { ${CART_FIELDS} } }`, { id }, buyerIp);
  return result.cart;
}
export async function cartView(raw: RawCart | null, buyerIp?: string): Promise<Cart> {
  if (!raw) return emptyCart;
  const lines = [...raw.lines.nodes];
  let page = raw.lines;
  const cursors = new Set<string>();
  while (page.pageInfo.hasNextPage) {
    const after = page.pageInfo.endCursor;
    if (!after || cursors.has(after)) throw new Error('Cart pagination did not advance');
    cursors.add(after);
    const result = await request<{ cart: { lines: CursorConnection<RawLine> } | null }>(`query CartLines($id: ID!, $after: String!) { cart(id: $id) { lines(first: 100, after: $after) { nodes { ${LINE_FIELDS} } pageInfo { hasNextPage endCursor } } }`, { id: raw.id, after }, buyerIp);
    if (!result.cart) throw new CartError('Handlekurven er utløpt. Åpne den på nytt.', 409);
    page = result.cart.lines; lines.push(...page.nodes);
  }
  if (lines.some(l => l.merchandise.__typename !== 'ProductVariant')) throw new Error('Unsupported cart merchandise');
  const identity = cartIdentity(raw.id);
  if (!identity) throw new CartError('Handlekurven kunne ikke bekreftes.', 409);
  const mappedLines = await Promise.all(lines.map(async l => {
    const product = l.merchandise.product;
    const collections = await completeConnection(product.collections, async after => {
      const data = await request<{ product: { collections: CursorConnection<ProductCollection> } | null }>(PRODUCT_COLLECTIONS_QUERY, { handle: product.handle, after }, buyerIp);
      if (!data.product) throw new Error('Product disappeared during cart collection pagination');
      return data.product.collections;
    });
    return {
      id: l.id, variantId: l.merchandise.id, quantity: l.quantity, title: productTitle(product), handle: product.handle,
      variantTitle: l.merchandise.title, available: l.merchandise.availableForSale, image: l.merchandise.image, total: l.cost.totalAmount,
      commerce: cartLineCommerce({ ...product, collections }, l.merchandise, l.quantity, l.cost.totalAmount),
    };
  }));
  return { id: identity.publicId, checkout: cartCheckoutIdentity(identity.publicId, raw.checkoutUrl), totalQuantity: raw.totalQuantity, subtotal: raw.cost.subtotalAmount, total: raw.cost.totalAmount, lines: mappedLines, commerce: authoritativeCartCommerce(mappedLines.map(line => line.commerce), raw.cost.totalAmount) };
}
export async function mutateCart(operation: CartOperation, id: string | undefined, buyerIp?: string): Promise<CartResult & { id: string }> {
  if (operation.action === 'add') {
    const product = await getProduct(operation.handle);
    if (!product || !publicVariants(product).some(v => v.id === operation.variantId)) throw new CartError('Denne varianten kan ikke legges i handlekurven.');
  }
  const existingId = id;
  const before = id ? await cartView(await readCart(id, buyerIp), buyerIp) : emptyCart;
  if (!existingId && operation.action !== 'add') throw new CartError('Handlekurven er utløpt. Åpne den på nytt.', 409);
  let name: string, declaration: string, args: string, variables: Record<string, unknown>;
  if (operation.action === 'add' && !existingId) {
    name = 'cartCreate'; declaration = '$input: CartInput!'; args = 'input: $input';
    variables = { input: { buyerIdentity: { countryCode: 'NO' }, lines: [{ merchandiseId: operation.variantId, quantity: operation.quantity }] } };
  } else if (operation.action === 'add') {
    name = 'cartLinesAdd'; declaration = '$id: ID!, $lines: [CartLineInput!]!'; args = 'cartId: $id, lines: $lines';
    variables = { id: existingId, lines: [{ merchandiseId: operation.variantId, quantity: operation.quantity }] };
  } else if (operation.action === 'update') {
    name = 'cartLinesUpdate'; declaration = '$id: ID!, $lines: [CartLineUpdateInput!]!'; args = 'cartId: $id, lines: $lines';
    variables = { id: existingId, lines: [{ id: operation.lineId, quantity: operation.quantity }] };
  } else {
    name = 'cartLinesRemove'; declaration = '$id: ID!, $lineIds: [ID!]!'; args = 'cartId: $id, lineIds: $lineIds';
    variables = { id: existingId, lineIds: [operation.lineId] };
  }
  const result = await request<Record<string, { cart: RawCart | null; userErrors: { code: string | null; field: string[] | null; message: string }[]; warnings: { message: string }[] }>>(
    `mutation CartMutation(${declaration}) { ${name}(${args}) { cart { ${CART_FIELDS} } userErrors { code field message } warnings { message } } }`, variables, buyerIp,
  );
  const payload = result[name];
  // Shopify user errors confirm a failed mutation. Only recreate after a fresh
  // read also confirms that the cart is absent; never retry transport failures,
  // whose write outcome is unknown. Existing carts need one request to add.
  if (operation.action === 'add' && existingId && !payload.cart && payload.userErrors.length && !await readCart(existingId, buyerIp)) {
    return mutateCart(operation, undefined, buyerIp);
  }
  if (payload.userErrors.length) throw new CartError(payload.userErrors.map(e => e.message).join(' '));
  if (!payload.cart) throw new CartError('Handlekurven kunne ikke oppdateres. Prøv igjen.', 409);
  const cart = await cartView(payload.cart, buyerIp);
  return { id: payload.cart.id, cart, warnings: payload.warnings?.map(w => w.message) ?? [], mutation: confirmedCartMutation(before, cart, randomUUID(), new Date().toISOString(), operation) };
}
