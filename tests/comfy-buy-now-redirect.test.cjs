/* eslint-disable @typescript-eslint/no-require-imports */
const test = require('node:test');
const assert = require('node:assert/strict');
const { NextRequest } = require('next/server');
const { loadTypeScript } = require('./load-typescript.cjs');
const logs = [];
const { GET } = loadTypeScript('lib/cart/comfyBuyNowRedirect.ts', {
  globals: { console: { ...console, info: (...args) => logs.push(args) } },
  mocks: {
    'next/server': require('next/server'),
    'capi-param-builder-nodejs': require('capi-param-builder-nodejs'),
  },
});
const { parseOrderAttributionFromNoteAttributes } = loadTypeScript('lib/analytics/checkoutAttributionSnapshot.ts');

for (const [suffix, variant] of [['xs', '43959919051000'], ['xl', '43959919116536']]) {
  for (const path of [`comfy-${suffix}`, `comfyrobe-${suffix}`, `kjop/comfyrobe/${suffix}`]) {
    test(`${path} redirects directly to the selected checkout with real incoming attribution`, () => {
      const response = GET(new NextRequest(`https://utekos.no/${path}?fbclid=fixture-click&ad_id=123456789&adset_id=234567890&utm_id=345678901&utm_source=fb&redirect=https://example.test&attributes[_fbc]=injected`, {
        headers: { cookie: '_fbp=fb.1.1792500000000.12345; _fbc=fb.1.1792500000000.old-click' },
      }));
      assert.equal(response.status, 307);
      const url = new URL(response.headers.get('location'));
      assert.equal(url.origin, 'https://kasse.utekos.no');
      assert.equal(url.pathname, `/cart/${variant}:1`);
      assert.equal(url.searchParams.get('discount'), 'COMFYFRI');
      assert.match(url.searchParams.get('attributes[_fbp]'), /^fb\.1\.1792500000000\.12345(?:\.|$)/);
      assert.match(url.searchParams.get('attributes[_fbc]'), /\.fixture-click(?:\.|$)/);
      assert.equal(url.searchParams.get('attributes[fbclid]'), 'fixture-click');
      assert.equal(url.searchParams.get('attributes[utekos_ad_id]'), '123456789');
      assert.equal(url.searchParams.get('attributes[utekos_adset_id]'), '234567890');
      assert.equal(url.searchParams.get('attributes[utekos_campaign_id]'), '345678901');
      assert.equal(url.searchParams.get('redirect'), null);
      assert.equal(JSON.parse(url.searchParams.get('attributes[utekos_consent]')).source, 'operator_policy');
      assert.equal(url.searchParams.get('attributes[utekos_begin_checkout_event_id]'), null);
      assert.equal(response.headers.get('Cache-Control'), 'private, no-store, max-age=0');
      assert.equal(response.body, null);
      const [name, diagnostic] = logs.at(-1);
      assert.equal(name, 'comfy_checkout_redirect');
      assert.equal(diagnostic.fbc_matches_click, true);
      assert.equal(diagnostic.has_checkout_fbclid, true);
      assert.equal(diagnostic.checkout_click_pair_matches, true);
      assert.equal(diagnostic.has_ad_id, true);
      assert.equal(diagnostic.has_fbp, true);
      assert.match(diagnostic.click_fingerprint, /^[a-f0-9]{16}$/);
      assert.equal(JSON.stringify(diagnostic).includes('fixture-click'), false);
      assert.equal(JSON.stringify(diagnostic).includes('fb.1.'), false);
    });
  }
}

test('a fresh direct visit gets an SDK browser ID and no invented click or ad identity', () => {
  const response = GET(new NextRequest('https://utekos.no/comfyrobe-xl'));
  const url = new URL(response.headers.get('location'));
  assert.ok(url.searchParams.get('attributes[_fbp]'));
  assert.equal(url.searchParams.get('attributes[_fbc]'), null);
  assert.equal(url.searchParams.get('attributes[utekos_ad_id]'), null);
  assert.ok(response.cookies.get('_fbp'));
});

test('a return visit preserves existing click identity without requiring JS', () => {
  const response = GET(new NextRequest('https://utekos.no/comfyrobe-xs', {
    headers: { cookie: '_fbp=fb.1.1792500000000.12345; _fbc=fb.1.1792500000000.saved-click' },
  }));
  const url = new URL(response.headers.get('location'));
  assert.equal(url.searchParams.get('attributes[_fbc]'), 'fb.1.1792500000000.saved-click');
  assert.equal(url.searchParams.get('attributes[fbclid]'), 'saved-click');
});

test('a no-query permalink replaces an older Shopify click attribute with the validated cookie click', () => {
  const fbc = `fb.1.${Date.now() - 60_000}.NewerClick.AQQCAQMB`;
  const response = GET(new NextRequest('https://utekos.no/kjop/comfyrobe/xl?attributes[fbclid]=OlderClick', {
    headers: { cookie: `_fbc=${fbc}` },
  }));
  const url = new URL(response.headers.get('location'));
  assert.equal(url.searchParams.get('attributes[_fbc]'), fbc);
  assert.equal(url.searchParams.get('attributes[fbclid]'), 'NewerClick');
  assert.equal(url.searchParams.getAll('attributes[fbclid]').length, 1);
  assert.equal(url.searchParams.get('fbclid'), null);
  const [name, diagnostic] = logs.at(-1);
  assert.equal(name, 'comfy_checkout_redirect');
  assert.equal(diagnostic.has_fbclid, false);
  assert.equal(diagnostic.has_checkout_fbclid, true);
  assert.equal(diagnostic.checkout_click_pair_matches, true);
});

test('ambiguous Meta cookies do not choose a click for a no-query permalink', () => {
  const timestamp = Date.now() - 60_000;
  const response = GET(new NextRequest('https://utekos.no/comfyrobe-xs', {
    headers: { cookie: `_fbc=fb.1.${timestamp}.FirstClick; _fbc=fb.1.${timestamp + 1}.SecondClick` },
  }));
  const url = new URL(response.headers.get('location'));
  assert.equal(url.searchParams.get('attributes[_fbc]'), null);
  assert.equal(url.searchParams.get('attributes[fbclid]'), null);
  assert.equal(url.searchParams.get('fbclid'), null);
  assert.equal(logs.at(-1)?.[1]?.checkout_click_pair_matches, false);
});

test('an invalid URL click is not passed to Shopify over an existing cookie click', () => {
  const fbc = `fb.1.${Date.now() - 60_000}.SavedClick`;
  const response = GET(new NextRequest('https://utekos.no/comfyrobe-xs?fbclid=%ZZ', {
    headers: { cookie: `_fbc=${fbc}` },
  }));
  const url = new URL(response.headers.get('location'));
  assert.equal(url.searchParams.get('fbclid'), null);
  assert.ok(url.searchParams.get('attributes[_fbc]')?.startsWith(fbc));
  assert.equal(url.searchParams.get('attributes[fbclid]'), 'SavedClick');
});

test('marketing denial does not pass cookie or URL Meta identity to checkout', () => {
  const deniedLogs = [];
  const denied = loadTypeScript('lib/cart/comfyBuyNowRedirect.ts', {
    globals: { console: { ...console, info: (...args) => deniedLogs.push(args) } },
    mocks: {
      'next/server': require('next/server'),
      'capi-param-builder-nodejs': require('capi-param-builder-nodejs'),
      '@/lib/consent/resolveTrackingAuthorization': {
        resolveTrackingAuthorization: () => ({
          analytics: 'granted', marketing: 'denied', preferences: 'granted',
          source: 'operator_policy', version: '1',
        }),
      },
    },
  }).GET;
  const response = denied(new NextRequest('https://utekos.no/comfyrobe-xs?fbclid=ObservedClick', {
    headers: { cookie: `_fbc=fb.1.${Date.now() - 60_000}.CookieClick` },
  }));
  const url = new URL(response.headers.get('location'));
  assert.equal(url.searchParams.get('attributes[_fbc]'), null);
  assert.equal(url.searchParams.get('attributes[fbclid]'), null);
  assert.equal(url.searchParams.get('fbclid'), null);
  assert.equal(deniedLogs.at(-1)?.[1]?.has_fbclid, false);
  assert.equal(deniedLogs.at(-1)?.[1]?.click_fingerprint, undefined);
  assert.equal(deniedLogs.at(-1)?.[1]?.has_checkout_fbclid, false);
  assert.equal(deniedLogs.at(-1)?.[1]?.checkout_click_pair_matches, false);
});

test('the deployed legacy Meta URL tags are recorded as campaign and ad IDs', () => {
  const response = GET(new NextRequest('https://utekos.no/comfyrobe-xl?utm_source=ig&utm_medium=instagram_stories&utm_campaign=120248100000000788&utm_content=120248137216840788'));
  const url = new URL(response.headers.get('location'));
  assert.equal(url.searchParams.get('attributes[utekos_ad_id]'), '120248137216840788');
  assert.equal(url.searchParams.get('attributes[utekos_campaign_id]'), '120248100000000788');
});

test('other sources, creative names and unresolved templates never become Meta IDs', () => {
  for (const query of ['utm_source=google&utm_content=123456&utm_campaign=234567', 'utm_source=fb&utm_content=creative-name&utm_campaign=campaign-name', 'utm_source=ig&utm_content={{ad.id}}&utm_campaign={{campaign.id}}']) {
    const url = new URL(GET(new NextRequest(`https://utekos.no/comfyrobe-xs?${query}`)).headers.get('location'));
    assert.equal(url.searchParams.get('attributes[utekos_ad_id]'), null);
    assert.equal(url.searchParams.get('attributes[utekos_campaign_id]'), null);
  }
});

test('explicit IDs take precedence over legacy UTM values', () => {
  const url = new URL(GET(new NextRequest('https://utekos.no/comfyrobe-xs?utm_source=fb&utm_content=123456&utm_campaign=234567&ad_id=345678&campaign_id=456789')).headers.get('location'));
  assert.equal(url.searchParams.get('attributes[utekos_ad_id]'), '345678');
  assert.equal(url.searchParams.get('attributes[utekos_campaign_id]'), '456789');
});

test('unknown variants and oversized identifiers cannot create a checkout redirect', () => {
  assert.equal(GET(new NextRequest('https://utekos.no/kjop/comfyrobe/m')).status, 404);
  assert.equal(GET(new NextRequest(`https://utekos.no/comfyrobe-xs?fbclid=${'x'.repeat(3001)}`)).status, 414);
});

test('query parameters, encoding and repeated marketing values survive without overriding checkout controls', () => {
  const incoming = new URL('https://utekos.no/comfy-xs');
  for (const [key, value] of [
    ['utm_source', 'bing'], ['utm_medium', 'cpc'], ['utm_campaign', 'Høst & varme'],
    ['utm_term', 'jakke + bad'], ['ref', 'campaign-ref'], ['custom_campaign', 'A/B'],
    ['tag', 'first'], ['tag', 'second'], ['discount', 'ATTACK'], ['channel', 'other'],
    ['attributes[msclkid]', 'forged'], ['checkout[email]', 'forged@example.test'],
  ]) incoming.searchParams.append(key, value);
  const url = new URL(GET(new NextRequest(incoming)).headers.get('location'));
  for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'ref', 'custom_campaign', 'tag']) {
    assert.deepEqual(url.searchParams.getAll(key), incoming.searchParams.getAll(key));
  }
  assert.equal(url.searchParams.get('channel'), 'buy_button');
  assert.equal(url.searchParams.get('discount'), 'COMFYFRI');
  assert.equal(url.searchParams.get('attributes[msclkid]'), null);
  assert.equal(url.searchParams.get('checkout[email]'), null);
  assert.equal(url.searchParams.get('attributes[utm_campaign]'), 'Høst & varme');
  assert.equal(url.searchParams.get('attributes[ref]'), 'campaign-ref');
});

test('Microsoft attribution reaches the same order-note parser used for purchase events', () => {
  const click = '12345678-1234-1234-1234-123456789abc';
  const query = new URLSearchParams({msclkid: click, utm_source: 'bing', utm_medium: 'cpc', utm_id: 'campaign-42', ad_id: 'ad-17'});
  const url = new URL(GET(new NextRequest(`https://utekos.no/comfy-xl?${query}`, {
    headers: {cookie: '_uetsid=uet-session; _uetvid=uet-visitor'},
  })).headers.get('location'));
  const notes = [...url.searchParams].filter(([key]) => key.startsWith('attributes[')).map(([key, value]) => ({name: key.slice(11, -1), value}));
  const order = parseOrderAttributionFromNoteAttributes(notes);
  assert.equal(order.click_id.msclkid, click);
  assert.equal(order.browser_id.uet_session, 'uet-session');
  assert.equal(order.browser_id.uet_visitor, 'uet-visitor');
  assert.equal(order.campaign.campaign_id, 'campaign-42');
  assert.equal(order.campaign.ad_id, 'ad-17');
  assert.equal(order.campaign.source, 'microsoft');
});

test('Google, Snapchat and other supported click identifiers are kept in Shopify order attributes', () => {
  for (const [key, canonical] of [['gclid', 'gclid'], ['dclid', 'dclid'], ['gbraid', 'gbraid'], ['wbraid', 'wbraid'], ['ScCid', 'sc_click_id'], ['ttclid', 'ttclid'], ['epik', 'epik'], ['twclid', 'twclid']]) {
    const query = new URLSearchParams({[key]: 'opaque+click/value'});
    const url = new URL(GET(new NextRequest(`https://utekos.no/comfy-xs?${query}`)).headers.get('location'));
    assert.equal(url.searchParams.get(key), 'opaque+click/value');
    assert.equal(url.searchParams.get(`attributes[${canonical}]`), 'opaque+click/value');
  }
});

test('oversized marketing parameters fail explicitly instead of silently disappearing', () => {
  const response = GET(new NextRequest(`https://utekos.no/comfy-xs?utm_campaign=${'x'.repeat(3001)}`));
  assert.equal(response.status, 414);
  assert.equal(response.headers.get('location'), null);
});

test('switching Comfyrobe size keeps campaign parameters and never retains the old variant selection', () => {
  const { variantHref } = loadTypeScript('lib/products/variants.ts');
  const xs = {id: 'gid://shopify/ProductVariant/43959919051000', availableForSale: true, selectedOptions: [{name: 'Størrelse', value: 'XS'}]};
  const xl = {id: 'gid://shopify/ProductVariant/43959919116536', availableForSale: true, selectedOptions: [{name: 'Størrelse', value: 'XL'}]};
  const query = {variant: '43959919051000', storrelse: 'xs', utm_source: 'bing', msclkid: 'qa-click', tag: ['a', 'b']};
  const url = new URL(variantHref('comfyrobe', xl, [xs, xl], query), 'https://utekos.no');
  assert.equal(url.searchParams.get('storrelse'), 'xl');
  assert.equal(url.searchParams.get('variant'), null);
  assert.equal(url.searchParams.get('utm_source'), 'bing');
  assert.equal(url.searchParams.get('msclkid'), 'qa-click');
  assert.deepEqual(url.searchParams.getAll('tag'), ['a', 'b']);
});
