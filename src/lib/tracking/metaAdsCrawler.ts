export const META_ADS_CRAWLER_PATTERN =
  /(?:^|[\s;(])meta-externalads\/\d+(?:\.\d+)*(?=$|[\s;)])/i;

export function isMetaAdsCrawler(
  userAgent: string | null | undefined,
): boolean {
  return META_ADS_CRAWLER_PATTERN.test(userAgent ?? "");
}

export function isBrowserTelemetryOperation(path: string): boolean {
  return (
    path.startsWith("/api/events/") ||
    path.startsWith("/api/observability/") ||
    path.startsWith("/api/meta/") ||
    path === "/api/log"
  );
}
