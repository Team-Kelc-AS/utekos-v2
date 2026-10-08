/* eslint-disable @typescript-eslint/no-require-imports */
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadTypeScript } = require('./load-typescript.cjs');
const { parsePage, listingRedirectPath } = loadTypeScript('lib/catalog/pagination.ts');

test('pagination rejects ambiguous, nonpositive and unsafe page numbers', () => {
  for (const value of ['', '0', '-1', '01', '1.5', '1e2', '9007199254740992', ['1', '2']]) {
    assert.equal(parsePage(value), null);
  }
  assert.equal(parsePage(undefined), 1);
  assert.equal(parsePage('2'), 2);
});

test('unused listing filters converge on the listing URL', () => {
  for (const key of ['filter.farge', 'filter', 'farge', 'storrelse', 'kjonn', 'variant', 'sort', 'sort_by', 'order', 'q']) {
    assert.equal(listingRedirectPath('/produkter', { [key]: 'unused' }), '/produkter');
  }
  assert.equal(listingRedirectPath('/produkter/hytte', { page: '1' }), '/produkter/hytte');
  assert.equal(listingRedirectPath('/produkter', { page: '2', farge: 'havdyp' }), '/produkter?page=2');
  assert.equal(listingRedirectPath('/produkter', { page: '2' }), null);
});

test('normalization preserves attribution, opaque click IDs and internal request params', () => {
  const original = {
    farge: 'havdyp', page: '1', utm_source: 'meta', utm_campaign: 'Høst & vinter',
    fbclid: 'opaque+id/=123', ScCid: 'Opaque/ID', gclid: 'google-id',
    campaign_id: '123', custom_campaign: ['one', 'two'], _rsc: 'next-key',
  };
  const result = new URL(listingRedirectPath('/produkter', original), 'https://utekos.no');
  assert.equal(result.searchParams.has('farge'), false);
  assert.equal(result.searchParams.has('page'), false);
  for (const [key, value] of Object.entries(original)) {
    if (key === 'page' || key === 'farge') continue;
    assert.deepEqual(result.searchParams.getAll(key), Array.isArray(value) ? value : [value]);
  }
  assert.equal(listingRedirectPath('/produkter', { utm_source: 'meta', gclid: 'opaque' }), null);
});

test('invalid pagination must be handled as not-found, never normalized to a valid page', () => {
  assert.equal(listingRedirectPath('/produkter', { page: ['1', '2'], farge: 'havdyp' }), null);
  assert.equal(listingRedirectPath('/produkter', { page: '0', sort_by: 'price' }), null);
});
