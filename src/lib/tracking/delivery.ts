/** HTTP acceptance is deliberately distinct from provider receipt. */
export type CollectorOutcome = { status: 'accepted_unverified'; httpStatus: number };
export async function deliverCanonicalEvent(
  endpoint: string,
  event: unknown,
  send: typeof fetch = fetch,
): Promise<CollectorOutcome> {
  const body = JSON.stringify(event); // Serialize once: retries retain all IDs/timestamps.
  const keepalive = new TextEncoder().encode(body).byteLength <= 65_536;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await send(endpoint, {
        method: 'POST', body, cache: 'no-store', credentials: 'same-origin', keepalive,
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        signal: AbortSignal.timeout(10_000),
      });
      if (response.status === 200 || response.status === 202) {
        return { status: 'accepted_unverified', httpStatus: response.status };
      }
      if (attempt === 0 && (response.status === 408 || response.status === 429 || response.status >= 500)) continue;
      throw new CollectorRejection(response.status);
    } catch (error) {
      if (attempt === 1 || error instanceof CollectorRejection) throw error;
    }
  }
  throw new Error('collector_unavailable');
}
class CollectorRejection extends Error {
  constructor(readonly status: number) { super(`collector_http_${status}`); }
}
