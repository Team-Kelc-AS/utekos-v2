/** Prevent HTML script termination while retaining JSON/Unicode semantics. */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
