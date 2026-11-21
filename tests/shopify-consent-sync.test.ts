import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildShopifyTrackingConsent,
  resetShopifyConsentSyncForTests,
  SHOPIFY_CONSENT_TRACKING_API_URL,
  syncShopifyTrackingConsent
} from '../src/lib/tracking/shopifyConsentSync'

function fakeWindow(withApi: boolean, result?: { error?: string }) {
  const calls: Array<Record<string, unknown>> = []
  const appended: Array<{ src: string; onload?: () => void }> = []
  const customerPrivacy = {
    setTrackingConsent: (consent: Record<string, unknown>, cb: (r: unknown) => void) => {
      calls.push(consent)
      cb(result)
    }
  }
  const win = {
    Shopify: withApi ? { customerPrivacy } : {} as { customerPrivacy?: typeof customerPrivacy },
    document: {
      createElement: () => ({}) as { src: string; onload?: () => void },
      head: {
        appendChild: (script: { src: string; onload?: () => void }) => {
          appended.push(script)
          win.Shopify.customerPrivacy = customerPrivacy
          script.onload?.()
        }
      }
    }
  }
  return { win: win as unknown as Window, calls, appended }
}

test('builds the headless consent payload from the operator policy', () => {
  assert.deepEqual(buildShopifyTrackingConsent('public-token'), {
    analytics: true,
    marketing: true,
    preferences: true,
    sale_of_data: true,
    headlessStorefront: true,
    checkoutRootDomain: 'kasse.utekos.no',
    storefrontRootDomain: 'utekos.no',
    storefrontAccessToken: 'public-token'
  })
})

test('loads the Shopify consent API once and syncs once per document', async () => {
  resetShopifyConsentSyncForTests()
  const { win, calls, appended } = fakeWindow(false)
  assert.equal(await syncShopifyTrackingConsent(win, 'public-token'), 'synced')
  assert.equal(await syncShopifyTrackingConsent(win, 'public-token'), 'skipped')
  assert.equal(appended.length, 1)
  assert.equal(appended[0]?.src, SHOPIFY_CONSENT_TRACKING_API_URL)
  assert.equal(calls.length, 1)
  assert.equal(calls[0]?.marketing, true)
})

test('skips without a public storefront token and reports Shopify errors', async () => {
  resetShopifyConsentSyncForTests()
  assert.equal(await syncShopifyTrackingConsent(fakeWindow(true).win, undefined), 'skipped')
  resetShopifyConsentSyncForTests()
  assert.equal(await syncShopifyTrackingConsent(fakeWindow(true, { error: 'x' }).win, 'public-token'), 'failed')
})
