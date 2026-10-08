'use client';
import { productionTrackingEnabled, isTrackingOrigin } from './environment';
let intent: { destination: string; sourceVariantId: string; interactionId: string } | undefined;
export function recordVariantIntent(destination: string, sourceVariantId: string) {
  if (!productionTrackingEnabled() || !isTrackingOrigin(location.href)) return;
  intent = { destination: new URL(destination, location.href).href, sourceVariantId, interactionId: crypto.randomUUID() };
}
export function getVariantIntent() { return intent; }
export function clearVariantIntent() { intent = undefined; }
