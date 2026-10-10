/* eslint-disable @typescript-eslint/no-require-imports */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadTypeScript } = require('./load-typescript.cjs');

const customerId = 'gid://shopify/Customer/123';
const payload = (marketingState, id = customerId) => ({ customer: { id, defaultEmailAddress: { marketingState } }, userErrors: [] });
const reply = (key, value) => ({ ok: true, json: async () => ({ data: { [key]: value } }) });
const newCustomer = () => reply('customerSet', payload('NOT_SUBSCRIBED'));
const subscribed = () => reply('customerEmailMarketingConsentUpdate', payload('SUBSCRIBED'));

function setup(responses = [newCustomer(), subscribed()], configured = true) {
  const calls = [];
  const tracking = [];
  const { subscribeToNewsletter } = loadTypeScript('lib/newsletter/subscribe.ts', {
    env: configured ? { SHOPIFY_ADMIN_API_TOKEN: 'test-only-token', SHOPIFY_STORE_DOMAIN: 'test-store.myshopify.com' } : {},
    mocks: {
      '@/lib/validation/zodMini': require('zod/mini'),
      '@/lib/tracking/server-forms': { recordAcceptedForm: async (_form, id) => tracking.push(id) },
    },
    fetch: async (url, options) => {
      calls.push({ url, ...options, payload: JSON.parse(options.body) });
      const response = responses.shift();
      if (response instanceof Error) throw response;
      if (!response) throw new Error('Unexpected provider call');
      return response;
    },
  });
  const submit = (email = '  Test@Example.com ', website = '') => {
    const form = new FormData();
    form.set('email', email);
    form.set('website', website);
    return subscribeToNewsletter({ status: 'idle', message: '', email: '' }, form);
  };
  return { submit, calls, tracking };
}

test('signup normalizes email, upserts only email, and verifies Shopify consent before acceptance', async () => {
  const { submit, calls, tracking } = setup();
  const result = await submit();
  assert.equal(result.status, 'success');
  assert.equal(result.email, '');
  assert.equal(calls.length, 2);
  assert.ok(calls.every(call => call.url === 'https://test-store.myshopify.com/admin/api/2026-10/graphql.json'));
  assert.deepEqual(calls[0].payload.variables, { input: { email: 'test@example.com' }, identifier: { email: 'test@example.com' } });
  const input = calls[1].payload.variables.input;
  assert.equal(input.customerId, customerId);
  assert.equal(input.emailMarketingConsent.marketingState, 'SUBSCRIBED');
  assert.equal(input.emailMarketingConsent.marketingOptInLevel, 'SINGLE_OPT_IN');
  assert.ok(Number.isFinite(Date.parse(input.emailMarketingConsent.consentUpdatedAt)));
  assert.deepEqual(tracking, ['newsletter_signup']);
});

test('existing subscription has its own message without changing consent or counting a new signup', async () => {
  const { submit, calls, tracking } = setup([reply('customerSet', payload('SUBSCRIBED'))]);
  const result = await submit();
  assert.equal(result.status, 'success');
  assert.match(result.message, /allerede påmeldt/);
  assert.equal(calls.length, 1);
  assert.equal(tracking.length, 0);
});

test('a customer who unsubscribed can explicitly subscribe again', async () => {
  const { submit, calls } = setup([reply('customerSet', payload('UNSUBSCRIBED')), subscribed()]);
  assert.equal((await submit()).status, 'success');
  assert.equal(calls.length, 2);
});

for (const [name, responses] of [
  ['HTTP failure', [{ ok: false }]],
  ['GraphQL error', [{ ok: true, json: async () => ({ errors: [{ message: 'denied' }] }) }]],
  ['customer user error', [reply('customerSet', { customer: null, userErrors: [{ message: 'invalid' }] })]],
  ['timeout', [new Error('timeout')]],
  ['invalid JSON', [{ ok: true, json: async () => { throw new Error('invalid JSON'); } }]],
  ['missing customer', [reply('customerSet', { customer: null, userErrors: [] })]],
  ['consent user error', [newCustomer(), reply('customerEmailMarketingConsentUpdate', { customer: null, userErrors: [{ message: 'rejected' }] })]],
  ['consent state not subscribed', [newCustomer(), reply('customerEmailMarketingConsentUpdate', payload('PENDING'))]],
  ['mismatched customer', [newCustomer(), reply('customerEmailMarketingConsentUpdate', payload('SUBSCRIBED', 'wrong-id'))]],
]) {
  test(`${name} preserves email and never reports an accepted signup`, async () => {
    const { submit, tracking } = setup(responses);
    const result = await submit();
    assert.equal(result.status, 'error');
    assert.equal(result.email, 'test@example.com');
    assert.equal(tracking.length, 0);
  });
}

test('invalid email, honeypot and missing config never reach Shopify', async () => {
  const { submit, calls } = setup();
  assert.equal((await submit('invalid')).invalidEmail, true);
  assert.equal((await submit('test@example.com', 'spam')).status, 'error');
  assert.equal(calls.length, 0);
  const unconfigured = setup([], false);
  assert.equal((await unconfigured.submit()).status, 'error');
  assert.equal(unconfigured.calls.length, 0);
});
