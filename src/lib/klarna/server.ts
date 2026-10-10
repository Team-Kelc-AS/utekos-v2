import 'server-only';
import { cartIdentity } from '@/lib/cart/identity';
import { Buffer } from 'node:buffer';
import { shopifyFetch } from '@/lib/shopify/client';
import type { Money } from '@/lib/shopify/product-types';
import type { CursorConnection } from '@/lib/catalog/paginateConnection';
import type { KlarnaOrderAttribution } from './attribution';
import type { NextRequest } from 'next/server';
import { prepareKlarnaOrderForwarder } from './backend';
import {
  completedOrderSchema, orderPayloadSchema, publicConfigSchema,
  type KlarnaCreateOrderRequest, type KlarnaExpressOrderPayload,
} from './contracts';

export class KlarnaBridgeError extends Error {
  constructor(message: string, public status = 422, public paymentStatus: 'not_submitted' | 'unknown' = 'not_submitted') { super(message); }
}

export function headlessOrigin(requestOrigin: string): string {
  const configured = process.env.KLARNA_HEADLESS_ORIGIN ?? 'https://backend.utekos.no';
  if (!URL.canParse(configured)) throw new KlarnaBridgeError('Klarna er midlertidig utilgjengelig.', 503);
  const url = new URL(configured);
  if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/' || url.search || url.hash || url.origin === requestOrigin) {
    throw new KlarnaBridgeError('Klarna er midlertidig utilgjengelig.', 503);
  }
  return url.origin;
}

function minorUnits(money: Money) {
  // NOK has two decimal places. Parse decimal strings without float rounding.
  const match = /^(\d+)(?:\.(\d{1,2})0*)?$/.exec(money.amount);
  if (money.currencyCode !== 'NOK' || !match) throw new KlarnaBridgeError('Denne handlekurven må betales i vanlig kasse.');
  const amount = Number(match[1]) * 100 + Number((match[2] ?? '').padEnd(2, '0'));
  if (!Number.isSafeInteger(amount) || amount > 200_000_000) throw new KlarnaBridgeError('Ugyldig handlekurvbeløp.');
  return amount;
}

type PaymentLine = {
  id: string; quantity: number;
  cost: { amountPerQuantity: Money; totalAmount: Money };
  merchandise: { __typename: string; id: string; title: string; price: Money; availableForSale: boolean; currentlyNotInStock: boolean; product: { title: string; handle: string } };
};
type PaymentCart = { id: string; cost: { totalAmount: Money }; lines: CursorConnection<PaymentLine> };
const CART_QUERY = `query KlarnaCart($id: ID!, $after: String) {
  cart(id: $id) {
    id cost { totalAmount { amount currencyCode } }
    lines(first: 100, after: $after) {
      nodes { id quantity cost { amountPerQuantity { amount currencyCode } totalAmount { amount currencyCode } }
        merchandise { __typename ... on ProductVariant { id title price { amount currencyCode } availableForSale currentlyNotInStock product { title handle } } }
      }
      pageInfo { hasNextPage endCursor }
    }
  }
}`;

export async function cartOrderPayload(fullId: string, backendOrigin: string, buyerIp?: string): Promise<KlarnaExpressOrderPayload> {
  const identity = cartIdentity(fullId);
  if (!identity) throw new KlarnaBridgeError('Handlekurven er utløpt. Åpne den på nytt.', 409);
  let after: string | null = null;
  let orderAmount: number | undefined;
  const lines: PaymentLine[] = [];
  const cursors = new Set<string>();
  const lineIds = new Set<string>();
  do {
    const result: { cart: PaymentCart | null } = await shopifyFetch<{ cart: PaymentCart | null }, { id: string; after: string | null }>({
      query: CART_QUERY, variables: { id: fullId, after }, buyerIp, cache: 'no-store',
    });
    const cart = result.cart;
    if (!cart || cart.id !== fullId) throw new KlarnaBridgeError('Handlekurven er utløpt. Åpne den på nytt.', 409);
    const pageAmount = minorUnits(cart.cost.totalAmount);
    if (orderAmount !== undefined && pageAmount !== orderAmount) throw new KlarnaBridgeError('Handlekurven ble endret. Start betalingen på nytt.', 409);
    orderAmount = pageAmount;
    for (const line of cart.lines.nodes) {
      if (lineIds.has(line.id)) throw new KlarnaBridgeError('Handlekurven ble endret. Start betalingen på nytt.', 409);
      lineIds.add(line.id); lines.push(line);
    }
    if (!cart.lines.pageInfo.hasNextPage) break;
    after = cart.lines.pageInfo.endCursor;
    if (!after || cursors.has(after) || lines.length >= 1000) throw new KlarnaBridgeError('Denne handlekurven må betales i vanlig kasse.');
    cursors.add(after);
  } while (after);

  const orderLines = lines.map(line => {
    const variant = line.merchandise;
    if (variant.__typename !== 'ProductVariant' || !variant.availableForSale || variant.currentlyNotInStock !== false || !Number.isSafeInteger(line.quantity) || line.quantity < 1) {
      throw new KlarnaBridgeError('En variant er ikke på lager. Kontroller handlekurven.', 409);
    }
    const unitPrice = minorUnits(variant.price);
    const total = minorUnits(line.cost.totalAmount);
    // Headless creates Shopify draft lines from variant ID and quantity only.
    // It cannot preserve cart discounts or overridden prices in that order.
    if (minorUnits(line.cost.amountPerQuantity) !== unitPrice || total !== line.quantity * unitPrice) {
      throw new KlarnaBridgeError('Denne handlekurven må betales i vanlig kasse.');
    }
    return {
      name: variant.title && variant.title !== 'Default Title' ? `${variant.product.title} — ${variant.title}` : variant.product.title,
      quantity: line.quantity, unit_price: unitPrice, total_amount: total,
      reference: variant.id, product_url: `${backendOrigin}/produkter/${variant.product.handle}`, type: 'physical' as const,
    };
  });
  const result = orderPayloadSchema.safeParse({
    purchase_country: 'NO', purchase_currency: 'NOK', locale: 'nb-NO',
    order_amount: orderAmount, order_lines: orderLines, merchant_reference1: identity.publicId,
    merchant_urls: {
      confirmation: `${backendOrigin}/kjop/fullfort?klarna_order_id={order.id}`,
      notification: `${backendOrigin}/api/klarna/notifications?klarna_order_id={order.id}`,
    },
  });
  // Never guess unallocated discounts, shipping or taxes when totals differ.
  if (!result.success) throw new KlarnaBridgeError('Denne handlekurven må betales i vanlig kasse.');
  return result.data;
}

export function readPublicConfig() {
  // Rendering the official button only needs the public client identifier.
  // Keep it independent of the production-only authenticated order backend.
  const parsed = publicConfigSchema.safeParse({
    client_id: process.env.NEXT_PUBLIC_KLARNA_CLIENT_ID,
    environment: process.env.NEXT_PUBLIC_KLARNA_ENVIRONMENT?.trim() || 'production',
  });
  if (!parsed.success) throw new KlarnaBridgeError('Klarna er midlertidig utilgjengelig.', 503);
  return parsed.data;
}

export async function forwardOrder(input: KlarnaCreateOrderRequest, fullId: string, backendOrigin: string, buyerIp?: string, attribution?: KlarnaOrderAttribution, request?: NextRequest) {
  try {
    const identity = cartIdentity(fullId);
    if (!identity || input.shopifyCartId !== identity.publicId || input.orderPayload.merchant_reference1 !== identity.publicId) {
      throw new KlarnaBridgeError('Handlekurven kunne ikke bekreftes.', 403);
    }
    const currentPayload = await cartOrderPayload(fullId, backendOrigin, buyerIp);
    if (JSON.stringify(currentPayload) !== JSON.stringify(input.orderPayload)) {
      throw new KlarnaBridgeError('Handlekurven ble endret. Start betalingen på nytt.', 409);
    }
  } catch (error) {
    if (error instanceof KlarnaBridgeError) throw error;
    throw new KlarnaBridgeError('Handlekurven kunne ikke bekreftes. Ingen betaling er sendt.', 502);
  }
  const body = JSON.stringify({ ...input, ...attribution });
  if (Buffer.byteLength(body, 'utf8') > 1024 * 1024) {
    throw new KlarnaBridgeError('Denne handlekurven må betales i vanlig kasse.', 413);
  }
  let send: Awaited<ReturnType<typeof prepareKlarnaOrderForwarder>>;
  try {
    send = await prepareKlarnaOrderForwarder(request, fullId);
  } catch {
    throw new KlarnaBridgeError('Klarna er midlertidig utilgjengelig. Ingen betaling er sendt.', 503);
  }
  // No retries: an interrupted response does not prove the payment failed.
  try {
    const response = await send(body);
    if (!response.ok) throw new Error('Unconfirmed upstream order');
    const result = completedOrderSchema.safeParse(await response.json());
    if (!result.success) throw new Error('Unconfirmed upstream response');
    const redirect = new URL(result.data.redirect_url);
    if (redirect.origin !== backendOrigin || redirect.pathname !== '/kjop/fullfort' || redirect.username || redirect.password || redirect.searchParams.get('klarna_order_id') !== result.data.klarna_order_id) {
      throw new KlarnaBridgeError('Ordren er opprettet, men bekreftelsessiden kunne ikke åpnes. Kontroller hos Klarna.', 502, 'unknown');
    }
    return result.data;
  } catch (error) {
    if (error instanceof KlarnaBridgeError) throw error;
    throw new KlarnaBridgeError('Betalingsstatus kunne ikke bekreftes. Kontroller hos Klarna før du prøver igjen.', 502, 'unknown');
  }
}
