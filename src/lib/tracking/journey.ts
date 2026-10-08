'use client';
import { browserPageViewSession } from '@/lib/analytics/pageViewSession';
import { readBrowserReporterContext } from '@/lib/analytics/browserReporterContext';
import { enrichCanonicalBrowserJourneyContext } from '@/lib/analytics/internalJourneyContext';
import { journeyEventSchema, sanitizeJourneyPath, type JourneyEvent } from '@/lib/observability/journey/contract';
import { productionTrackingEnabled, isTrackingOrigin } from './environment';
import { deliverCanonicalEvent } from './delivery';
export function createJourneyReporter() {
  if (!productionTrackingEnabled() || !isTrackingOrigin(location.href)) return () => {};
  const page = browserPageViewSession.get(undefined); const context = readBrowserReporterContext();
  if (!page || !context) return () => {};
  const identity = enrichCanonicalBrowserJourneyContext({ consent: context.consent, page_view_id: page.pageViewId, journey_id: undefined as string | undefined, previous_page_view_id: undefined as string | undefined });
  const pagePath = sanitizeJourneyPath(location.pathname);
  // Navigation cleanup still belongs to the page that was actually observed.
  return (eventName: JourneyEvent['event_name'], data: unknown) => {
  const parsed = journeyEventSchema.safeParse({ schema_version: 1, event_id: crypto.randomUUID(), event_name: eventName,
    journey_id: identity.journey_id, page_view_id: page.pageViewId,
    ...(identity.previous_page_view_id ? { previous_page_view_id: identity.previous_page_view_id } : {}),
    occurred_at: new Date().toISOString(), page_path: pagePath,
    consent: context.consent, source: 'browser', environment: 'production', data });
  if (parsed.success) void deliverCanonicalEvent('/api/observability/journey', parsed.data).catch(() => undefined);
  };
}
export function recordJourney(eventName: JourneyEvent['event_name'], data: unknown) {
  createJourneyReporter()(eventName, data);
}
