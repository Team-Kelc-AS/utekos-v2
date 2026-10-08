'use client';
import { browserPageViewSession } from '@/lib/analytics/pageViewSession';
import { productionTrackingEnabled, isTrackingOrigin } from './environment';
export type ActionContext = { pageUrl: string; pageTitle: string; pageViewId: string; referrerUrl?: string; eventTime: string };
type Action = { name: string; detail: unknown; context: ActionContext };
const pending: Action[] = [];
const listeners = new Set<(action: Action) => void>();
/** Preserve real confirmed actions that precede the lazy observer's hydration. */
export function emitStorefrontAction(name: string, detail: unknown) {
  if (typeof window === 'undefined' || !productionTrackingEnabled() || !isTrackingOrigin(location.href)) return;
  const page = browserPageViewSession.ensure({ pageUrl: location.href, documentReferrer: document.referrer });
  const action = { name, detail, context: { pageUrl: page.pageUrl, pageViewId: page.pageViewId, pageTitle: document.title || 'Utekos', ...(page.referrerUrl ? { referrerUrl: page.referrerUrl } : {}), eventTime: new Date().toISOString() } };
  if (!listeners.size) { pending.push(action); if (pending.length > 30) pending.shift(); }
  else for (const listener of listeners) listener(action);
}
export function subscribeStorefrontActions(listener: (action: Action) => void) {
  listeners.add(listener);
  for (const action of pending.splice(0)) listener(action);
  return () => { listeners.delete(listener); };
}
