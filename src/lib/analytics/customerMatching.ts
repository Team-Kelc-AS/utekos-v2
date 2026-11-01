'use client';

import * as z from '@/lib/validation/zodMini';
import { canonicalUserDataSchema, type CanonicalEventEnvelope } from './canonicalEventEnvelope';
import { reportClientCaughtError } from '@/lib/observability/client/reportClientCaughtError';
import { resolveTrackingAuthorization } from '@/lib/consent/resolveTrackingAuthorization';

const matchingSchema = z.strictObject({
  matching: z.nullable(z.strictObject({
    externalId: z.string().check(z.minLength(1)),
    userData: canonicalUserDataSchema,
    location: z.optional(z.strictObject({
      source: z.literal('customer_provided'),
      country_code: z.string().check(z.regex(/^[A-Z]{2}$/)),
      city: z.optional(z.string()),
      region_code: z.optional(z.string()),
      postal_code: z.optional(z.string()),
    })),
  })),
});
type CustomerMatching = z.infer<typeof matchingSchema>['matching'];
let cachedMatching: CustomerMatching | undefined;
let matchingRevision = 0;

declare global {
  interface Window {
    // Shared with the app-owned Pixel bootstrap. No contact data is stored on disk.
    __utekosCustomerMatchingRequest?: Promise<unknown>;
    __utekosCustomerMatchingSnapshot?: CustomerMatching;
    __utekosCustomerMatchingInitialized?: string;
  }
}

const revisionKey = 'utekos:customer-matching-revision:v1';
let listening = false;
function listenForMatchingChanges() {
  if (listening) return;
  listening = true;
  window.addEventListener('storage', event => {
    if (event.key === revisionKey) invalidateCustomerMatching(false);
  });
}

export async function readCustomerMatching() {
  listenForMatchingChanges();
  window.__utekosCustomerMatchingRequest ??= fetch('/api/identity/klarna/prospect', {
    method: 'POST', credentials: 'same-origin', cache: 'no-store',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'matching' }), signal: AbortSignal.timeout(2000),
  }).then(response => {
    if (response.status === 401) return { matching: null };
    if (!response.ok) throw new Error('customer_matching_unavailable');
    return response.json();
  });
  const request = window.__utekosCustomerMatchingRequest;
  const revision = matchingRevision;
  try {
    const matching = matchingSchema.parse(await request).matching;
    // An older session lookup cannot restore identity after login/logout.
    if (revision !== matchingRevision) return null;
    cachedMatching = matching;
    window.__utekosCustomerMatchingSnapshot = cachedMatching;
    return cachedMatching;
  } catch (error) {
    if (window.__utekosCustomerMatchingRequest === request) window.__utekosCustomerMatchingRequest = undefined;
    throw error;
  }
}

export function primeCustomerMatching() {
  if (resolveTrackingAuthorization().marketing !== 'granted') return;
  void readCustomerMatching().catch(() => {
    reportClientCaughtError(new Error('customer_matching_unavailable'), 'customer_matching');
  });
}

export async function enrichCanonicalEventWithCustomerMatching<T extends CanonicalEventEnvelope>(event: T): Promise<T> {
  if (typeof window === 'undefined' || event.consent.marketing !== 'granted') return event;
  try {
    await readCustomerMatching();
    return enrichWithCachedCustomerMatching(event);
  } catch {
    reportClientCaughtError(new Error('customer_matching_unavailable'), 'customer_matching');
    return event;
  }
}

// Keep Pixel dispatch synchronous after Meta's cookie/URL collection boundary.
export function enrichWithCachedCustomerMatching<T extends CanonicalEventEnvelope>(event: T): T {
  const matching = cachedMatching ?? window.__utekosCustomerMatchingSnapshot;
  if (!matching || event.consent.marketing !== 'granted') return event;
  return {
    ...event, external_id: matching.externalId, user_data: matching.userData,
    ...(matching.location ? { location: matching.location } : {}),
    meta_parameter_builder: undefined,
  };
}

export function invalidateCustomerMatching(notifyOtherTabs = true) {
  if (typeof window === 'undefined') return;
  const matchingStarted = !!window.__utekosCustomerMatchingRequest || window.__utekosCustomerMatchingInitialized !== undefined;
  matchingRevision++;
  window.__utekosCustomerMatchingRequest = undefined;
  cachedMatching = undefined;
  window.__utekosCustomerMatchingSnapshot = undefined;
  if (notifyOtherTabs) {
    try { localStorage.setItem(revisionKey, crypto.randomUUID()); } catch { /* Matching remains private to this document. */ }
  }
  // No documented and verified Pixel identity update: stop this document's
  // Pixel on identity changes. CAPI continues; never reload or replay PageView.
  if (matchingStarted) {
    window.dispatchEvent(new CustomEvent('utekos:customer-matching-changing'));
  }
  primeCustomerMatching();
}
