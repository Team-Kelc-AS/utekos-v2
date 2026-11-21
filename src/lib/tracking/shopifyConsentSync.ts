'use client'

import { OPERATOR_TRACKING_AUTHORIZATION } from '@/lib/consent/resolveTrackingAuthorization'

// Shopify Customer Privacy API for custom (headless) storefronts. Shopify-managed
// surfaces (checkout App Web Pixels, custom pixels, Audiences) only read consent
// from Shopify's own `_tracking_consent`. Without this sync, Shopify's automated
// privacy settings decide on their own and, for Norway, report analytics and
// marketing as not granted, so the checkout App Web Pixel never loads.
export const SHOPIFY_CONSENT_TRACKING_API_URL =
  'https://cdn.shopify.com/shopifycloud/consent-tracking-api/v0.1/consent-tracking-api.js'
export const SHOPIFY_CHECKOUT_ROOT_DOMAIN = 'kasse.utekos.no'
export const SHOPIFY_STOREFRONT_ROOT_DOMAIN = 'utekos.no'

type ConsentResult = { error?: unknown } | undefined

type CustomerPrivacy = {
  setTrackingConsent: (
    consent: Record<string, unknown>,
    callback: (result: ConsentResult) => void
  ) => void
}

type ShopifyWindow = Window & {
  Shopify?: { customerPrivacy?: CustomerPrivacy }
}

let syncStarted = false

/** Shopify consent payload derived from the operator tracking policy. */
export function buildShopifyTrackingConsent(storefrontAccessToken: string) {
  const granted = (value: string) => value === 'granted'
  return {
    analytics: granted(OPERATOR_TRACKING_AUTHORIZATION.analytics),
    marketing: granted(OPERATOR_TRACKING_AUTHORIZATION.marketing),
    preferences: granted(OPERATOR_TRACKING_AUTHORIZATION.preferences),
    // The operator policy does not opt visitors out of data sharing.
    sale_of_data: granted(OPERATOR_TRACKING_AUTHORIZATION.marketing),
    headlessStorefront: true,
    checkoutRootDomain: SHOPIFY_CHECKOUT_ROOT_DOMAIN,
    storefrontRootDomain: SHOPIFY_STOREFRONT_ROOT_DOMAIN,
    storefrontAccessToken
  }
}

function loadConsentApi(win: ShopifyWindow): Promise<CustomerPrivacy | undefined> {
  const existing = win.Shopify?.customerPrivacy
  if (existing?.setTrackingConsent) return Promise.resolve(existing)

  return new Promise(resolve => {
    const script = win.document.createElement('script')
    script.src = SHOPIFY_CONSENT_TRACKING_API_URL
    script.async = true
    script.onload = () => resolve(win.Shopify?.customerPrivacy)
    script.onerror = () => resolve(undefined)
    win.document.head.appendChild(script)
  })
}

/**
 * Shares the operator consent with Shopify once per document. Never throws:
 * a consent sync failure must not interrupt the storefront.
 */
export async function syncShopifyTrackingConsent(
  win: ShopifyWindow = window,
  storefrontAccessToken: string | undefined = process.env.NEXT_PUBLIC_STOREFRONT_ACCESS_TOKEN
): Promise<'synced' | 'skipped' | 'failed'> {
  if (syncStarted || !storefrontAccessToken) return 'skipped'
  syncStarted = true

  try {
    const privacy = await loadConsentApi(win)
    if (!privacy?.setTrackingConsent) return 'failed'

    return await new Promise(resolve => {
      privacy.setTrackingConsent(
        buildShopifyTrackingConsent(storefrontAccessToken),
        result => resolve(result?.error ? 'failed' : 'synced')
      )
    })
  } catch {
    return 'failed'
  }
}

/** Test-only reset of the per-document guard. */
export function resetShopifyConsentSyncForTests() {
  syncStarted = false
}
