import 'server-only';

import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { z } from 'zod';

export const KLARNA_IDENTITY_STATE_COOKIE = 'utekos_v2_klarna_state';
export const KLARNA_IDENTITY_SESSION_COOKIE = 'utekos_v2_klarna_session';
export const KLARNA_IDENTITY_SCOPE = [
  'openid', 'offline_access', 'payment:request:create',
  'profile:name', 'profile:email', 'profile:phone',
  'profile:date_of_birth', 'profile:billing_address',
  'profile:shipping_address', 'profile:country', 'profile:locale',
].join(' ');
const SESSION_SECONDS = 60 * 60 * 24;
const STATE_SECONDS = 10 * 60;

const addressSchema = z.object({
  street_address: z.string().max(160).optional(),
  street_address2: z.string().max(160).optional(),
  postal_code: z.string().max(20).optional(),
  city: z.string().max(100).optional(),
  region: z.string().max(100).optional(),
  country: z.string().regex(/^[A-Z]{2}$/i).optional(),
});
const tokenBirthDateSchema = z.union([
  z.iso.date(),
  z.iso.datetime({ offset: true }),
]).transform(value => value.slice(0, 10));

const stateSchema = z.strictObject({
  expiresAt: z.number().int(),
  returnTo: z.string().max(2048),
});
const sessionSchema = z.strictObject({
  expiresAt: z.number().int(),
  subject: z.string().min(1).max(300),
  email: z.email().max(320),
  name: z.string().max(160),
  givenName: z.string().max(80).optional(),
  familyName: z.string().max(80).optional(),
  phone: z.string().regex(/^\+[1-9][0-9]{6,14}$/).optional(),
  dateOfBirth: z.iso.date().optional(),
  billingAddress: addressSchema.optional(),
  shippingAddress: addressSchema.optional(),
  country: z.string().regex(/^[A-Z]{2}$/i).optional(),
  locale: z.string().regex(/^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/).max(35).optional(),
});
export type KlarnaIdentitySession = z.infer<typeof sessionSchema>;

export function klarnaIdentityConfig() {
  if (process.env.KLARNA_IDENTITY_ENABLED !== 'true') return null;
  const clientId = process.env.KLARNA_IDENTITY_CLIENT_ID?.trim();
  const key = Buffer.from(process.env.KLARNA_IDENTITY_SESSION_KEY ?? '', 'base64');
  const environment = process.env.NEXT_PUBLIC_KLARNA_ENVIRONMENT?.trim() || 'production';
  if (!clientId || !/^[A-Za-z0-9._-]{8,256}$/.test(clientId) || key.length !== 32 ||
      !['production', 'playground'].includes(environment)) {
    throw new Error('Klarna identity configuration is incomplete');
  }
  const issuer = environment === 'playground'
    ? 'https://login.playground.klarna.com'
    : 'https://login.klarna.com';
  return { clientId, key, environment, issuer, scope: KLARNA_IDENTITY_SCOPE };
}

export function safeReturnTo(value: unknown): string {
  if (typeof value !== 'string' || value.length > 2048 ||
      !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return '/konto';
  return value;
}

function seal(value: object, purpose: string, key: Buffer): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  cipher.setAAD(Buffer.from(purpose));
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(value)), cipher.final()]);
  return [iv, encrypted, cipher.getAuthTag()].map(part => part.toString('base64url')).join('.');
}

function unseal(value: string | undefined, purpose: string, key: Buffer): unknown {
  if (!value || value.length > 4096) return null;
  try {
    const parts = value.split('.');
    if (parts.length !== 3) return null;
    const [iv, encrypted, tag] = parts.map(part => Buffer.from(part, 'base64url'));
    if (iv.length !== 12 || tag.length !== 16) return null;
    const decipher = createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAAD(Buffer.from(purpose));
    decipher.setAuthTag(tag);
    return JSON.parse(Buffer.concat([decipher.update(encrypted), decipher.final()]).toString());
  } catch {
    return null;
  }
}

export function createKlarnaState(returnTo: string, key: Buffer) {
  return seal({ expiresAt: Date.now() + STATE_SECONDS * 1000, returnTo }, 'klarna-state', key);
}

export function readKlarnaState(value: string | undefined, key: Buffer) {
  const parsed = stateSchema.safeParse(unseal(value, 'klarna-state', key));
  return parsed.success && parsed.data.expiresAt > Date.now() ? parsed.data : null;
}

export function createKlarnaSession(session: Omit<KlarnaIdentitySession, 'expiresAt'>, key: Buffer) {
  return seal({ ...session, expiresAt: Date.now() + SESSION_SECONDS * 1000 }, 'klarna-session', key);
}

export function readKlarnaSession(value: string | undefined): KlarnaIdentitySession | null {
  if (!value) return null;
  const config = klarnaIdentityConfig();
  if (!config) return null;
  const parsed = sessionSchema.safeParse(unseal(value, 'klarna-session', config.key));
  return parsed.success && parsed.data.expiresAt > Date.now() ? parsed.data : null;
}

export const klarnaSessionMaxAge = SESSION_SECONDS;
export const klarnaStateMaxAge = STATE_SECONDS;

const jwks = new Map<string, ReturnType<typeof createRemoteJWKSet>>();
export async function verifyKlarnaIdToken(idToken: string, clientId: string, issuer: string) {
  if (idToken.length > 12000) throw new Error('Invalid Klarna ID token');
  let keySet = jwks.get(issuer);
  if (!keySet) {
    keySet = createRemoteJWKSet(new URL(`${issuer}/.well-known/jwks.json`), {
      timeoutDuration: 8000,
    });
    jwks.set(issuer, keySet);
  }
  const { payload } = await jwtVerify(idToken, keySet, {
    issuer,
    audience: clientId,
    algorithms: ['RS256', 'ES256'],
    maxTokenAge: '10m',
  });
  const parsed = z.object({
    sub: z.string().min(1).max(300),
    email: z.email().max(320),
    email_verified: z.literal(true),
    given_name: z.string().max(80).optional(),
    family_name: z.string().max(80).optional(),
    phone: z.string().regex(/^\+[1-9][0-9]{6,14}$/).optional(),
    phone_verified: z.boolean().optional(),
    date_of_birth: tokenBirthDateSchema.optional(),
    billing_address: addressSchema.optional(),
    shipping_address: addressSchema.optional(),
    address: addressSchema.optional(),
    country: z.string().regex(/^[A-Z]{2}$/i).optional(),
    locale: z.string().regex(/^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/).max(35).optional(),
  }).safeParse(payload);
  if (!parsed.success) throw new Error('Klarna ID token lacks a verified email');
  return {
    subject: parsed.data.sub,
    email: parsed.data.email,
    name: [parsed.data.given_name, parsed.data.family_name].filter(Boolean).join(' '),
    ...(parsed.data.given_name ? { givenName: parsed.data.given_name } : {}),
    ...(parsed.data.family_name ? { familyName: parsed.data.family_name } : {}),
    ...(parsed.data.phone_verified && parsed.data.phone ? { phone: parsed.data.phone } : {}),
    ...(parsed.data.date_of_birth ? { dateOfBirth: parsed.data.date_of_birth } : {}),
    ...(parsed.data.billing_address || parsed.data.address ?
      { billingAddress: parsed.data.billing_address ?? parsed.data.address } : {}),
    ...(parsed.data.shipping_address ? { shippingAddress: parsed.data.shipping_address } : {}),
    ...(parsed.data.country ? { country: parsed.data.country.toUpperCase() } : {}),
    ...(parsed.data.locale ? { locale: parsed.data.locale } : {}),
  };
}
