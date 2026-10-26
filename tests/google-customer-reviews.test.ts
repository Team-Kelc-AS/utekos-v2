import assert from 'node:assert/strict';
import { test, mock } from 'node:test';
import { GET, POST } from '../src/app/anmeldelse/google/route';

const token = 'a'.repeat(120);
const payload = { merchant_id: 5806691920, order_id: '123456', email: 'buyer@example.test', delivery_country: 'NO', estimated_delivery_date: '2026-11-02', opt_in_style: 'CENTER_DIALOG' };
function request(origin = 'https://utekos.no', body = token) {
  return new Request('https://utekos.no/anmeldelse/google', { method: 'POST', headers: { origin }, body });
}

test('private confirmation page never includes customer data or storefront tracking', async () => {
  const response = GET();
  const html = await response.text();
  assert.ok(html.startsWith('<!DOCTYPE html>'));
  assert.match(response.headers.get('Cache-Control')!, /no-store/);
  assert.equal(response.headers.get('Referrer-Policy'), 'no-referrer');
  assert.match(response.headers.get('X-Robots-Tag')!, /noindex/);
  assert.match(response.headers.get('Content-Security-Policy')!, /frame-ancestors 'none'/);
  assert.doesNotMatch(html, /buyer@example|googletagmanager|facebook\.net|vercel-insights/);
  assert.ok(html.indexOf('history.replaceState') < html.indexOf('await fetch'));
});

test('rejects cross-origin and malformed proof before contacting Shopify app', async () => {
  const fetchMock = mock.method(globalThis, 'fetch', async () => { throw new Error('must not call'); });
  try {
    assert.equal((await POST(request('https://attacker.test'))).status, 403);
    assert.equal((await POST(request('https://utekos.no', '123456'))).status, 403);
    assert.equal(fetchMock.mock.callCount(), 0);
  } finally { fetchMock.mock.restore(); }
});

test('only returns verified minimal payload from the existing owned app', async () => {
  const fetchMock = mock.method(globalThis, 'fetch', async (url: string | URL | Request, options?: RequestInit) => {
    assert.equal(url, 'https://utekos-shopify-platform-app.vercel.app/api/customer-reviews/exchange');
    assert.equal(options?.body, token);
    assert.equal(options?.redirect, 'error');
    return Response.json(payload);
  });
  try {
    const response = await POST(request());
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), payload);
    assert.match(response.headers.get('Cache-Control')!, /no-store/);
  } finally { fetchMock.mock.restore(); }
});

test('does not pass upstream error bodies or unexpected customer fields to browser', async () => {
  const errorLog = mock.method(console, 'error', () => {});
  const fetchMock = mock.method(globalThis, 'fetch', async () => Response.json({ ...payload, fullAddress: 'must-never-pass' }));
  try {
    const response = await POST(request());
    assert.equal(response.status, 503);
    assert.doesNotMatch(await response.text(), /buyer@example|fullAddress|must-never-pass/);
  } finally { fetchMock.mock.restore(); errorLog.mock.restore(); }
});
