import { CANONICAL_EVENT_BROWSER_TIMEOUT_MS } from './timeouts';
import { recordCollectorFailureDiagnostics } from '../observability/client/collectorFailureDiagnostics';

// This counts canonical requests only, not other SDKs sharing the browser quota.
let canonicalInFlightKeepaliveBytes = 0;

/** HTTP acceptance is deliberately distinct from provider receipt. */
export type CollectorOutcome =
  | { status: 'accepted_unverified'; httpStatus: number }
  | { status: 'suppressed'; httpStatus: 204 };
export async function deliverCanonicalEvent(
  endpoint: string,
  event: unknown,
  send: typeof fetch = fetch,
): Promise<CollectorOutcome> {
  const body = JSON.stringify(event); // Serialize once: retries retain all IDs/timestamps.
  const bodyBytes = new TextEncoder().encode(body).byteLength;
  let keepalive = bodyBytes <= 65_536;
  for (let attempt = 0; attempt < 2; attempt++) {
    const attemptKeepalive = keepalive;
    const signal = AbortSignal.timeout(CANONICAL_EVENT_BROWSER_TIMEOUT_MS);
    if (attemptKeepalive) canonicalInFlightKeepaliveBytes += bodyBytes;
    try {
      const response = await send(endpoint, {
        method: 'POST', body, cache: 'no-store', credentials: 'same-origin', keepalive: attemptKeepalive,
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        signal,
      });
      // Consent/bot filtering intentionally returns no content. Do not report
      // this as a transport failure or claim the event was accepted.
      if (response.status === 204) return { status: 'suppressed', httpStatus: 204 };
      if (response.status === 200 || response.status === 202) {
        return { status: 'accepted_unverified', httpStatus: response.status };
      }
      if (attempt === 0 && (response.status === 408 || response.status === 429 || response.status >= 500)) continue;
      throw new CollectorRejection(response.status);
    } catch (error) {
      if (error instanceof CollectorRejection) throw error;
      // The browser's 64 KiB keepalive budget is shared with other SDKs. A
      // visible page can retry normally when native fetch rejects that budget;
      // preserve keepalive on page exit and retain the same serialized event.
      if (attempt === 0 && error instanceof TypeError &&
        typeof document !== 'undefined' && document.visibilityState === 'visible') {
        keepalive = false;
      }
      if (attempt === 1) {
        recordCollectorFailureDiagnostics(error, endpoint, {
          body_bytes: bodyBytes, canonical_in_flight_keepalive_bytes: canonicalInFlightKeepaliveBytes,
          keepalive: attemptKeepalive, signal_aborted: signal.aborted,
        });
        throw error;
      }
    } finally {
      if (attemptKeepalive) canonicalInFlightKeepaliveBytes -= bodyBytes;
    }
  }
  throw new Error('collector_unavailable');
}
class CollectorRejection extends Error {
  constructor(readonly status: number) { super(`collector_http_${status}`); }
}
