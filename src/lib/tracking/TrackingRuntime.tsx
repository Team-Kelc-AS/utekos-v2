'use client';
import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useReportWebVitals } from 'next/web-vitals';
import { attachCommerceTracking, browserTrackingEnabled, createBrowserEvent, reportNavigation } from './runtime';
import { observeTrackedPage } from './dom-observers';
import { canonicalWebVitalSchema, buildWebVitalCustomData, buildWebVitalDataLayerEvent } from '@/lib/analytics/webVitalEvent';
import { webVitalMetricNameSchema } from '@/lib/analytics/webVitalMetricName';
import { sendCanonicalGTMEvent } from '@/lib/analytics/sendCanonicalGTMEvent';
import { enrichCanonicalBrowserJourneyContext } from '@/lib/analytics/internalJourneyContext';
import { reportClientCaughtError } from '@/lib/observability/client/reportClientCaughtError';
import { deliverCanonicalEvent } from './delivery';

const metricVersions = new Set<string>();
const reportVital: Parameters<typeof useReportWebVitals>[0] = metric => {
  if (!browserTrackingEnabled()) return;
  const name = webVitalMetricNameSchema.safeParse(metric.name);
  const key = `${metric.id}:${metric.value}`;
  if (!name.success || metricVersions.has(key)) return;
  metricVersions.add(key);
  try {
    const envelope = createBrowserEvent('page_view', {});
    const event = canonicalWebVitalSchema.parse({ ...envelope, event_name: 'web_vital',
      custom_data: buildWebVitalCustomData({
        name: name.data, metricId: metric.id, value: metric.value, delta: metric.delta,
        entries: [], pathname: location.pathname, rating: metric.rating, navigationType: metric.navigationType,
      }) });
    const enriched = enrichCanonicalBrowserJourneyContext(event);
    void sendCanonicalGTMEvent(buildWebVitalDataLayerEvent(enriched));
    void deliverCanonicalEvent('/api/events/web-vital', enriched).catch(() => undefined);
  } catch { /* A metric cannot interrupt navigation or commerce. */ }
};
export default function TrackingRuntime() {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  useReportWebVitals(reportVital);
  useEffect(() => {
    if (!browserTrackingEnabled()) return;
    reportNavigation();
    const stopCommerce = attachCommerceTracking();
    const onError = (event: ErrorEvent) => reportClientCaughtError(event.error ?? new Error('window_error'), 'window');
    const onRejection = () => reportClientCaughtError(new Error('unhandled_rejection'), 'promise');
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    return () => { stopCommerce();
      window.removeEventListener('error', onError); window.removeEventListener('unhandledrejection', onRejection); };
  }, []);
  useEffect(() => {
    if (!browserTrackingEnabled()) return;
    reportNavigation();
    return observeTrackedPage();
  }, [pathname, search]);
  return null;
}
