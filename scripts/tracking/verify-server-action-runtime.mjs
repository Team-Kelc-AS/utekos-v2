// Explicit HTTP regression probe. Uses invalid payloads only: no email, order,
// subscription or provider event can be accepted by the application's actions.
import assert from 'node:assert/strict';
import { load } from 'cheerio';

const origin = new URL(process.argv[2] ?? 'http://localhost:3014').origin;
assert.ok(['http://localhost:3014', 'https://utekos.no'].includes(origin), 'Use the local production build or the authorized production hostname');
const routes = ['/', '/kontaktskjema', '/forhandlere', '/frakt-og-retur',
  '/handlehjelp/storrelsesguide', '/handlehjelp/vask-og-vedlikehold', '/om-oss',
  '/personvern', '/produkter', '/produkter/camping-og-bobil/nbcc'];
const unknownAction = '0'.repeat(42);
const headers = { origin, 'user-agent': 'Utekos-Diagnostic/1.0' };
const results = [];

async function check(path, name, init, expected) {
  const response = await fetch(origin + path, { ...init, redirect: 'manual', signal: AbortSignal.timeout(30000) });
  const body = await response.text();
  assert.equal(response.status, expected, `${name} ${path}`);
  assert.ok(!body.includes('resumable slots'), `${name}: no PPR replay error`);
  if (expected === 400 || expected === 409) {
    assert.match(response.headers.get('content-type') ?? '', /text\/plain/);
    assert.equal(response.headers.get('x-nextjs-action-not-found'), '1');
    assert.ok(body.length < 200, 'Rejected actions must not enter HTML/PPR rendering');
  }
  results.push({ path, name, status: response.status, requestId: response.headers.get('x-vercel-id') });
  return body;
}

for (const path of routes) {
  const invalid = new FormData();
  invalid.set('fixture', 'no-action');
  await check(path, 'multipart-without-action', { method: 'POST', headers, body: invalid }, 400);
  const stale = new FormData();
  stale.set(`$ACTION_ID_${unknownAction}`, '');
  await check(path, 'unknown-multipart-action', { method: 'POST', headers, body: stale }, 409);
  const html = await check(path, 'GET-after-rejected-action', { headers: { 'user-agent': 'meta-externalads/1.1' } }, 200);
  const $ = load(html);
  assert.ok($('title').text().trim() && $('main').text().trim().length > 100, `Public content retained on ${path}`);
}

for (const [id, expected] of [['invalid', 400], [unknownAction, 409]]) {
  await check('/', 'unknown-fetch-action', { method: 'POST', headers: { ...headers, 'next-action': id, 'content-type': 'text/plain' }, body: '[]' }, expected);
}

// This exact unsupported fetch-action shape previously returned 404 and logged
// "Couldn't find all resumable slots" while replaying the wrong PPR tree.
for (const extra of [{}, { rsc: '1', 'next-router-prefetch': '1', purpose: 'prefetch' }]) {
  await check('/', 'unsupported-urlencoded-action', {
    method: 'POST', headers: { ...headers, ...extra, 'next-action': unknownAction, 'content-type': 'application/x-www-form-urlencoded' },
    body: 'fixture=invalid',
  }, 400);
}

// Real, currently rendered action references with invalid business data must
// still reach application validation (progressive-enhancement/no-JS contract).
for (const [path, formId, message] of [
  ['/', 'newsletter_signup', 'Skriv inn en gyldig e-postadresse.'],
  ['/kontaktskjema', 'contact', 'Se over feltene nedenfor og prøv igjen.'],
]) {
  const response = await fetch(origin + path, { headers: { 'user-agent': 'meta-externalads/1.1' } });
  const $ = load(await response.text());
  const form = $(`form[data-tracking-form="${formId}"]`);
  assert.equal(form.length, 1, `Rendered ${formId} form`);
  const data = new FormData();
  form.find('input[type="hidden"][name]').each((_, input) => data.append($(input).attr('name'), $(input).attr('value') ?? ''));
  assert.ok([...data.keys()].some(name => name.startsWith('$ACTION_')), 'Use actual rendered action metadata');
  data.set('email', 'invalid');
  const body = await check(path, 'real-action-invalid-fields', { method: 'POST', headers, body: data }, 200);
  assert.ok(load(body).text().includes(message), `Application validation rendered for ${formId}`);
}

console.log(JSON.stringify({ origin, passed: results.length, results }, null, 2));
