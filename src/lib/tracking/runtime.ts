'use client';
import type { CanonicalEvent } from '@/lib/analytics/canonicalEvent';
import { browserEventSchema } from './browser-schema';
import { readBrowserReporterContext } from '@/lib/analytics/browserReporterContext';
import { browserPageViewSession } from '@/lib/analytics/pageViewSession';
import { mapEventDeviceInfo } from '@/lib/analytics/mapEventDeviceInfo';
import { enrichCanonicalBrowserJourneyContext } from '@/lib/analytics/internalJourneyContext';
import { enrichCanonicalEventWithMetaAttribution } from '@/lib/analytics/enrichCanonicalEventWithMetaAttribution';
import { enrichCanonicalEventWithGoogleAnalyticsIds } from '@/lib/analytics/googleAnalyticsBrowserIds';
import { sendCanonicalGTMEvent } from '@/lib/analytics/sendCanonicalGTMEvent';
import { browserMicrosoftUetIdSyncEmitter } from '@/lib/analytics/emitMicrosoftUetIdSync';
import { reportClientCaughtError } from '@/lib/observability/client/reportClientCaughtError';
import type { ConsentSnapshot } from '@/lib/analytics/canonicalEventEnvelope';
import type { CanonicalBeginCheckout } from '@/lib/analytics/beginCheckoutEvent';
import type { Cart, CartMutation } from '@/lib/cart/types';
import { registerCheckoutTrackingPreparer } from '@/lib/cart/tracking';
import { productionTrackingEnabled, isTrackingOrigin } from './environment';
import { recordJourney } from './journey';
import { buildDataLayer } from './data-layer';
import { subscribeStorefrontActions, type ActionContext } from './browser-events';
import type { CheckoutTrackingMethod } from '@/lib/cart/tracking';
import { deliverCanonicalEvent } from './delivery';

export function browserTrackingEnabled() {
  return typeof window !== 'undefined' && productionTrackingEnabled() && isTrackingOrigin(window.location.href);
}
type WebEventName = Extract<CanonicalEvent, { source: 'web' }>['event_name'] | 'remove_from_cart';
type StorefrontEvent = Exclude<CanonicalEvent, { event_name: 'purchase' | 'refund' | 'meta_app_event' | 'meta_offline_event' }>;
const deliveries = new Map<string, Promise<StorefrontEvent>>();
const once = new Set<string>();
const acceptedActions = new Set<string>();
const LAST_PAGE = 'utekos:analytics:last-page:v1';

export function claimObservation(key: string) {
  const page = browserPageViewSession.get(undefined);
  if (!page) return false;
  const scoped = `${page.pageViewId}:${key}`;
  if (once.has(scoped)) return false;
  once.add(scoped);
  if (once.size > 1024) once.delete(once.values().next().value!);
  return true;
}
export function createBrowserEvent(eventName: WebEventName, customData: unknown,
  overrides: { event_id?: string; event_time?: string; checkout_method?: 'shopify_checkout' | 'klarna_express'; context?: ActionContext } = {}) {
  const context = readBrowserReporterContext(overrides.context?.pageUrl);
  if (!context) throw new Error('browser_context_unavailable');
  const page = overrides.context ?? browserPageViewSession.ensure({ pageUrl: context.pageUrl, documentReferrer: context.documentReferrer });
  const parsed = browserEventSchema.parse({
    schema_version: 1, event_name: eventName, source: 'web', environment: 'production',
    event_id: overrides.event_id ?? crypto.randomUUID(), event_time: overrides.event_time ?? overrides.context?.eventTime ?? new Date().toISOString(),
    consent: context.consent, page_view_id: page.pageViewId, page_url: context.pageUrl,
    page_title: overrides.context?.pageTitle ?? context.pageTitle, ...(page.referrerUrl ? { referrer_url: page.referrerUrl } : {}),
    ...(context.browserId ? { browser_id: context.browserId } : {}),
    ...(context.clickId ? { click_id: context.clickId } : {}),
    ...(context.externalId ? { external_id: context.externalId } : {}),
    ...(context.metaAudience ? { meta_audience: context.metaAudience } : {}),
    event_device_info: mapEventDeviceInfo(context.eventDeviceInfo), custom_data: customData,
    ...(overrides.checkout_method ? { checkout_method: overrides.checkout_method } : {}),
  });
  if (parsed.source !== 'web') throw new Error('invalid_browser_event_source');
  return parsed;
}
async function boundedEnrichment<T>(task: Promise<T>, fallback: T, milliseconds: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try { return await Promise.race([task.catch(() => fallback), new Promise<T>(resolve => { timer = setTimeout(() => resolve(fallback), milliseconds); })]); }
  finally { if (timer) clearTimeout(timer); }
}
async function prepareEvent(event: StorefrontEvent) {
  const journey = enrichCanonicalBrowserJourneyContext(event);
  return boundedEnrichment(enrichCanonicalEventWithMetaAttribution(journey), journey, 1500);
}
export async function dispatchEvent(event: StorefrontEvent, prepared = false) {
  if (!browserTrackingEnabled()) return event;
  const key = `${event.event_name}:${event.event_id}`;
  const existing = deliveries.get(key);
  if (existing) return existing;
  const work = (async () => {
    let enriched = prepared ? event : await prepareEvent(event);
    const google = prepared ? Promise.resolve(enriched) : boundedEnrichment(enrichCanonicalEventWithGoogleAnalyticsIds(enriched), enriched, 500);
    // Pinned sender synchronously dispatches Pixel before its bounded GA wait.
    const browser = sendCanonicalGTMEvent(buildDataLayer(enriched), async <E extends { consent: ConsentSnapshot; browser_id?: Record<string, string> }>(current: E): Promise<E> => ({ ...current, browser_id: (await google).browser_id }));
    enriched = await google;
    await browser;
    if (enriched.event_name === 'page_view') {
      if (enriched.external_id) browserMicrosoftUetIdSyncEmitter.emit({
        externalId: enriched.external_id, pageViewEventId: enriched.event_id, pageViewId: enriched.page_view_id,
      });
      // Capture is an observation, not the owner of canonical acceptance.
      void deliverCanonicalEvent('/api/events/page-view/capture', { capture_state: 'granted', event: enriched })
        .catch(() => reportClientCaughtError(new Error('capture_failed'), 'page_view.capture'));
    }
    const delivery = deliverCanonicalEvent(`/api/events/${enriched.event_name.replaceAll('_', '-')}`, enriched)
      .catch(() => reportClientCaughtError(new Error('collector_delivery_unverified'), `${enriched.event_name}.collector`));
    if (enriched.event_name === 'begin_checkout') {
      let deadline: ReturnType<typeof setTimeout> | undefined;
      try { await Promise.race([delivery, new Promise<void>(resolve => { deadline = setTimeout(resolve, 1500); })]); }
      finally { if (deadline) clearTimeout(deadline); }
    }
    return enriched;
  })();
  deliveries.set(key, work);
  if (deliveries.size > 256) deliveries.delete(deliveries.keys().next().value!);
  return work;
}
export function reportInteraction(eventName: WebEventName, customData: unknown, overrides?: Parameters<typeof createBrowserEvent>[2]) {
  if (!browserTrackingEnabled()) return;
  try { void dispatchEvent(createBrowserEvent(eventName, customData, overrides)).catch(() => reportClientCaughtError(new Error('dispatch_failed'), eventName)); }
  catch { reportClientCaughtError(new Error('event_contract_invalid'), eventName); }
}
export function reportNavigation(restored = false) {
  if (!browserTrackingEnabled()) return;
  if (restored) browserPageViewSession.clear();
  const context = readBrowserReporterContext();
  if (!context) return;
  const first = !browserPageViewSession.get(undefined);
  let page = browserPageViewSession.ensure({ pageUrl: context.pageUrl, documentReferrer: context.documentReferrer });
  if (browserPageViewSession.hasEmitted(page.pageViewId)) return;
  if (first) {
    try {
      const previous = JSON.parse(sessionStorage.getItem(LAST_PAGE) ?? 'null');
      if (previous && /^[0-9a-f-]{36}$/i.test(previous.pageViewId)) {
        page = { ...page, previousPageViewId: previous.pageViewId };
      }
    } catch { /* Storage access may be denied. */ }
  }
  // Reserve ID before any async enrichment and before React can replay effects.
  browserPageViewSession.recordEmitted(page);
  try { sessionStorage.setItem(LAST_PAGE, JSON.stringify({ pageViewId: page.pageViewId })); } catch {}
  reportInteraction('page_view', {});
  recordJourney('page_arrival', { navigation_type: restored ? 'back_forward' : first ? 'initial' : 'internal' });
}
export async function prepareCanonicalCheckout(cart: Cart, method: CheckoutTrackingMethod) {
  if (!browserTrackingEnabled() || !cart.id || !cart.commerce || !cart.checkout) return null;
  reportNavigation();
  const eventId = crypto.randomUUID();
  const event = createBrowserEvent('begin_checkout', {
    ...cart.commerce, cart_id: cart.id, ...cart.checkout,
  }, { event_id: eventId, checkout_method: method === 'klarna' ? 'klarna_express' : 'shopify_checkout' });
  const enriched = await prepareEvent(event);
  return await boundedEnrichment(enrichCanonicalEventWithGoogleAnalyticsIds(enriched), enriched, 500) as CanonicalBeginCheckout;
}
export async function confirmCheckoutTracking(event: CanonicalBeginCheckout) {
  return dispatchEvent(event, true);
}
export function attachCommerceTracking() {
  const unregister = registerCheckoutTrackingPreparer(prepareCanonicalCheckout);
  const claimAction = (id: string) => { if (acceptedActions.has(id)) return false; acceptedActions.add(id); if (acceptedActions.size > 512) acceptedActions.delete(acceptedActions.values().next().value!); return true; };
  const stop = subscribeStorefrontActions(({ name, detail, context }) => {
    if (name === 'utekos:cart-mutation-confirmed') {
      const mutation = detail as CartMutation;
      if (!mutation || !claimAction(`cart-mutation:${mutation.id}`)) return;
      mutation.changes.forEach(change => reportInteraction(change.event_name, {
        ...change.commerce, cart_id: mutation.cart_id, cart_mutation_id: mutation.id,
      }, { event_time: mutation.event_time, context }));
    } else if (name === 'utekos:cart-view') {
      const cart = detail as Cart;
      if (cart?.id && cart.commerce) reportInteraction('view_cart', { ...cart.commerce, cart_id: cart.id, view_sequence: Date.now() }, { context });
    } else if (name === 'utekos:accepted-lead') {
      const entry = detail as import('@/lib/analytics/generateLeadEvent').GenerateLeadDataLayerEvent;
      if (claimObservation(`accepted-lead:${entry.event_id}`)) void sendCanonicalGTMEvent(entry);
    } else if (name === 'utekos:form-error') {
      const failure = detail as { formId: string; attemptId: string; category: string };
      reportInteraction('form_error', { form_id: failure.formId, attempt_id: failure.attemptId, error_category: failure.category }, { context });
    } else if (name === 'utekos:wishlist-added') {
      const mutation = detail as { commerce: unknown; mutationId: string; eventTime: string };
      if (claimAction(`wishlist:${mutation.mutationId}`)) reportInteraction('add_to_wishlist', { ...mutation.commerce as object, wishlist_mutation_id: mutation.mutationId }, { event_time: mutation.eventTime, context });
    }
  });
  return () => { unregister(); stop(); };
}

export function captureFormTrackingContext() {
  if (!browserTrackingEnabled()) return;
  const context = readBrowserReporterContext();
  const page = browserPageViewSession.get(undefined);
  if (!context || !page) return;
  const identity = enrichCanonicalBrowserJourneyContext({ consent: context.consent, page_view_id: page.pageViewId, journey_id: undefined as string | undefined });
  const query = new URL(context.pageUrl).searchParams;
  return { consent: context.consent, page_url: context.pageUrl, page_view_id: page.pageViewId, journey_id: identity.journey_id,
    ...(page.referrerUrl ? { referrer_url: page.referrerUrl } : {}),
    ...Object.fromEntries(['campaign','medium','content','term'].flatMap(key => { const value = query.get(`utm_${key}`); return value && value.length <= 200 ? [[key,value]] : []; })),
  };
}
