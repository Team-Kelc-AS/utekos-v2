/* eslint-disable @typescript-eslint/no-require-imports */
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadTypeScript } = require('./load-typescript.cjs');

const cart = { id: 'gid://shopify/Cart/fixture', commerce: { currency: 'NOK' } };
const event = { event_id: 'f16a04b1-d0be-4d2c-9b73-cf69c67f2251' };
function harness({ enabled = true, rejected = false } = {}) {
  const order = [], requests = [], confirms = [];
  const api = loadTypeScript('lib/cart/tracking.ts', {
    globals: { window: { location: { href: 'https://utekos.no/produkter/test' } } },
    mocks: {
      '@/lib/tracking/environment': { productionTrackingEnabled: () => enabled, isTrackingOrigin: () => true },
      '@/lib/tracking/browser-events': { emitStorefrontAction: (...args) => order.push(args) },
      '@/lib/analytics/campaignAttributionSessionStore': { resolveCampaignAttribution: () => ({ campaign_id: 'fixture-campaign', source: 'meta' }) },
      '@/lib/tracking/runtime': {
        prepareCanonicalCheckout: async (actual, method) => { assert.equal(actual, cart); assert.equal(method, 'shopify'); order.push('prepare'); return event; },
        confirmCheckoutTracking: async value => { order.push('confirm'); confirms.push(value); },
      },
    },
    fetch: async (_url, init) => { order.push('attributes'); requests.push(JSON.parse(init.body)); return { ok: !rejected, json: async () => rejected ? { error: 'Attribute save rejected' } : { checkoutUrl: 'https://checkout.example.test' } }; },
  });
  return { ...api, order, requests, confirms };
}

test('immediate checkout before runtime registration still prepares one identity, saves it, then emits', async () => {
  const api = harness();
  const result = await api.persistCheckoutPreparation(cart, 'shopify');
  assert.equal(result.checkoutUrl, 'https://checkout.example.test');
  assert.deepEqual(api.order, ['prepare', 'attributes', 'confirm']);
  assert.equal(api.requests[0].event.event_id, event.event_id);
  assert.equal(api.requests[0].campaign.campaign_id, 'fixture-campaign');
  assert.equal(api.confirms[0], event);
});

test('a failed handoff emits no begin_checkout and preserves a useful error', async () => {
  const api = harness({ rejected: true });
  await assert.rejects(api.persistCheckoutPreparation(cart, 'shopify'), /Attribute save rejected/);
  assert.deepEqual(api.order, ['prepare', 'attributes']);
  assert.equal(api.confirms.length, 0);
});

test('disabled environments never load the tracking runtime or emit production checkout events', async () => {
  const api = harness({ enabled: false });
  await api.persistCheckoutPreparation(cart, 'shopify');
  assert.deepEqual(api.order, ['attributes']);
  assert.equal(api.requests[0].event, null);
  assert.equal(api.confirms.length, 0);
});
