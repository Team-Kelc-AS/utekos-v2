import { META_CRAWLER_PATTERN, isMetaCrawler } from './metaCrawler';

// Documented HTTP tokens, not arbitrary Google/Chrome substrings. This is only
// a telemetry opt-out, never authentication or a firewall bypass.
// Google-Extended/Googlebot-News are robots controls, not separate HTTP agents.
// APIs-Google delivers authenticated notifications, not browser visits.
export const GOOGLE_CRAWLER_PATTERN = /(?:^|[\s;(])(?:Googlebot(?:-Image|-Video)?|Storebot-Google|Google-InspectionTool|GoogleOther(?:-Image|-Video)?|Google-CloudVertexBot|AdsBot-Google(?:-Mobile)?|Google-Safety|Mediapartners-Google|Google-CWS|FeedFetcher-Google|Google-GeminiNotebook|Google-Agent|GoogleMessages|Google-Pinpoint|GoogleProducer|Google-Read-Aloud|Google-Site-Verification)(?:\/\d+(?:\.\d+)*)?(?=$|[\s;)])/i;
export const WEB_CRAWLER_PATTERN = new RegExp(`${META_CRAWLER_PATTERN.source}|${GOOGLE_CRAWLER_PATTERN.source}`, 'i');
export function isWebCrawler(userAgent: string | null | undefined): boolean {
  return WEB_CRAWLER_PATTERN.test(userAgent ?? '');
}

// Shopping checks and user-delegated actions must retain normal cart behavior.
export function isPassiveWebCrawler(userAgent: string | null | undefined): boolean {
  if (isMetaCrawler(userAgent)) return true;
  return GOOGLE_CRAWLER_PATTERN.test(userAgent ?? '') &&
    !/(?:^|[\s;(])(?:Storebot-Google|Google-Agent)(?:\/\d+(?:\.\d+)*)?(?=$|[\s;)])/i.test(userAgent ?? '');
}
