// These self-reported crawler markers only opt out of customer telemetry.
// They never authorize access to a protected operation.
export const META_CRAWLER_PATTERN =
  /(?:^|[\s;(])(?:facebookexternalhit|meta-(?:externalads|externalagent|webindexer|externalfetcher))\/\d+(?:\.\d+)*(?=$|[\s;)])/i;

export function isMetaCrawler(
  userAgent: string | null | undefined,
): boolean {
  return META_CRAWLER_PATTERN.test(userAgent ?? "");
}

export function isBrowserTelemetryOperation(path: string): boolean {
  return (
    path.startsWith("/api/events/") ||
    path.startsWith("/api/observability/") ||
    path.startsWith("/api/meta/") ||
    path === "/api/log"
  );
}
