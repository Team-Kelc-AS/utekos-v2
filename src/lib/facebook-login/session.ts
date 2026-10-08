import 'server-only';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { z } from 'zod';
export const FACEBOOK_STATE_COOKIE = 'utekos_v2_fb_state';
export const FACEBOOK_SESSION_COOKIE = 'utekos_v2_fb_session';
export function facebookConfig() {
  if (process.env.FACEBOOK_LOGIN_ENABLED !== 'true') throw new Error('Facebook unavailable');
  const appId = process.env.FACEBOOK_LOGIN_APP_ID;
  const appSecret = process.env.FACEBOOK_LOGIN_APP_SECRET;
  const key = Buffer.from(process.env.FACEBOOK_LOGIN_IDENTITY_KEY ?? '', 'base64');
  if (!appId || !/^\d+$/.test(appId) || !appSecret || key.length !== 32) throw new Error('Facebook unavailable');
  return { appId, appSecret, key, apiVersion: 'v26.0' };
}
export function sealSession(value: { expiresAt: number; userId?: string }, purpose: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', facebookConfig().key, iv);
  cipher.setAAD(Buffer.from(purpose));
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(value)), cipher.final()]);
  return [iv, encrypted, cipher.getAuthTag()].map(v => v.toString('base64url')).join('.');
}
export function readSession(value: string | undefined, purpose: string) {
  if (!value) return null;
  try {
    const [iv, encrypted, tag] = value.split('.').map(v => Buffer.from(v, 'base64url'));
    const decipher = createDecipheriv('aes-256-gcm', facebookConfig().key, iv);
    decipher.setAAD(Buffer.from(purpose)); decipher.setAuthTag(tag);
    const data = z.object({ expiresAt: z.number(), userId: z.string().regex(/^\d+$/).optional() }).parse(JSON.parse(Buffer.concat([decipher.update(encrypted), decipher.final()]).toString()));
    return data.expiresAt > Date.now() ? data : null;
  } catch { return null; }
}
