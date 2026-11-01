import 'server-only';
import { createHash } from 'node:crypto';

/** One server-validated authentication token has one ID across retries/callbacks. */
export function klarnaLoginEventId(idToken: string) {
  const bytes = createHash('sha256').update('utekos:klarna:login:v1\0').update(idToken).digest().subarray(0, 16);
  bytes[6] = (bytes[6] & 15) | 80;
  bytes[8] = (bytes[8] & 63) | 128;
  const hex = bytes.toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
