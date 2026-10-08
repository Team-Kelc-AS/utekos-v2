import { z } from 'zod';

const minorAmount = z.number().int().min(0).max(200_000_000);
const lineSchema = z.strictObject({
  name: z.string().min(1).max(255),
  quantity: z.number().int().min(1),
  unit_price: minorAmount,
  total_amount: minorAmount,
  reference: z.string().max(255),
  product_url: z.url().max(1024),
  type: z.literal('physical'),
}).refine(line => line.total_amount === line.quantity * line.unit_price);

// Match the existing headless Express contract; no Klarna credentials enter v2.
export const orderPayloadSchema = z.strictObject({
  purchase_country: z.literal('NO'),
  purchase_currency: z.literal('NOK'),
  locale: z.literal('nb-NO'),
  order_amount: minorAmount.min(1),
  order_lines: z.array(lineSchema).min(1).max(1000),
  merchant_reference1: z.string().min(1).max(255),
  merchant_urls: z.strictObject({ confirmation: z.url(), notification: z.url() }),
}).refine(order => order.order_lines.reduce((sum, line) => sum + line.total_amount, 0) === order.order_amount);

export const collectedShippingAddressSchema = z.object({
  given_name: z.string().max(99).optional(),
  family_name: z.string().max(99).optional(),
  email: z.string().max(99).optional(),
  phone: z.string().max(99).optional(),
  street_address: z.string().max(100).optional(),
  street_address2: z.string().max(100).optional(),
  postal_code: z.string().max(10).optional(),
  city: z.string().max(99).optional(),
  region: z.string().max(99).optional(),
  country: z.string().length(2).optional(),
});

export const prepareSchema = z.strictObject({
  handle: z.string().regex(/^[a-z0-9-]{1,100}$/),
  variantId: z.string().regex(/^gid:\/\/shopify\/ProductVariant\/\d+$/),
});
export const createOrderSchema = z.strictObject({
  authorizationToken: z.string().min(1).max(4096),
  orderPayload: orderPayloadSchema,
  collectedShippingAddress: collectedShippingAddressSchema,
  shopifyCartId: z.string().min(1).max(255),
});
export const publicConfigSchema = z.object({
  client_id: z.string().regex(/^klarna_live_client_\S+$/),
  environment: z.enum(['production', 'playground']),
});
export const completedOrderSchema = z.object({
  klarna_order_id: z.string().min(1),
  redirect_url: z.url(),
  fraud_status: z.enum(['ACCEPTED', 'PENDING', 'REJECTED']).optional(),
  shopify_order_id: z.string().min(1),
  shopify_order_name: z.string().optional(),
  session_storage_key: z.string().optional(),
});

export type KlarnaExpressOrderPayload = z.infer<typeof orderPayloadSchema>;
export type KlarnaCollectedShippingAddress = z.infer<typeof collectedShippingAddressSchema>;
export type KlarnaCreateOrderRequest = z.infer<typeof createOrderSchema>;
